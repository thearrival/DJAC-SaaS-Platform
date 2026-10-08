import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GlobeMarker = {
  location: [number, number];
  size?: number;
  label?: string;
};
export type GlobeArc = { from: [number, number]; to: [number, number] };

/** Key regulatory hubs (lat, lng). */
export const GLOBE_MARKERS: GlobeMarker[] = [
  { location: [39.9, 116.4], size: 1.0, label: "Beijing" },
  { location: [22.3, 114.2], size: 0.7 },
  { location: [24.7, 46.7], size: 1.0, label: "Riyadh" },
  { location: [25.2, 55.3], size: 0.8, label: "Dubai" },
  { location: [50.85, 4.35], size: 0.9, label: "Brussels" },
  { location: [38.9, -77.0], size: 0.9, label: "Washington" },
  { location: [51.5, -0.12], size: 0.7, label: "London" },
  { location: [1.35, 103.8], size: 0.7, label: "Singapore" },
  { location: [35.68, 139.7], size: 0.6 },
  { location: [-33.87, 151.2], size: 0.6 },
  { location: [-23.55, -46.63], size: 0.6 },
  { location: [-1.29, 36.82], size: 0.6 },
];

/** Cross-border regulatory corridors. */
export const GLOBE_ARCS: GlobeArc[] = [
  { from: [39.9, 116.4], to: [24.7, 46.7] }, // China → Saudi
  { from: [39.9, 116.4], to: [50.85, 4.35] }, // China → EU
  { from: [24.7, 46.7], to: [50.85, 4.35] }, // Saudi → EU
  { from: [50.85, 4.35], to: [38.9, -77.0] }, // EU → US
  { from: [25.2, 55.3], to: [1.35, 103.8] }, // UAE → Singapore
  { from: [38.9, -77.0], to: [-23.55, -46.63] }, // US → Brazil
  { from: [39.9, 116.4], to: [1.35, 103.8] }, // China → Singapore
];

const RADIUS = 1;

function toVec(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function makeLabel(text: string): {
  sprite: THREE.Sprite;
  texture: THREE.Texture;
} {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#c7e6ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    })
  );
  sprite.scale.set(0.3, 0.075, 1);
  return { sprite, texture };
}

/**
 * Full 3D globe (three.js): real country outlines, fresnel atmosphere, a
 * starfield, glowing regulatory hubs with labels, and animated cross-border
 * corridor pulses. Orbit + auto-rotate. Country data is a static same-origin
 * asset (no external textures); everything else is code-generated.
 */
export function Globe3D({
  markers = GLOBE_MARKERS,
  arcs = GLOBE_ARCS,
  className,
}: {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = el.clientWidth || 520;
    let cancelled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.45, 3.05);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x93b8ff, 1.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);
    const rim = new THREE.PointLight(0x00d2ff, 2.4, 14);
    rim.position.set(-3, -1.5, -2);
    scene.add(rim);

    const globe = new THREE.Group();
    scene.add(globe);

    // ── Starfield ─────────────────────────────────────────────────────────────
    const starCount = 1400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 12 + Math.random() * 18;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
      starPos[i * 3 + 1] = r * Math.cos(p);
      starPos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0x9fc7ff,
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    scene.add(stars);

    // ── Earth + graticule ─────────────────────────────────────────────────────
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x081627,
        emissive: 0x050d1c,
        specular: 0x1b3a6b,
        shininess: 12,
      })
    );
    globe.add(earth);
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.0012, 48, 32),
        new THREE.MeshBasicMaterial({
          color: 0x123163,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        })
      )
    );

    // ── Fresnel atmosphere ─────────────────────────────────────────────────────
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.2, 64, 64),
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            glowColor: { value: new THREE.Color(0x00d2ff) },
            c: { value: 0.45 },
            p: { value: 3.4 },
          },
          vertexShader:
            "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
          fragmentShader:
            "varying vec3 vN; varying vec3 vV; uniform vec3 glowColor; uniform float c; uniform float p; void main(){ float i = pow(max(c - dot(vN, vV), 0.0), p); gl_FragColor = vec4(glowColor, i); }",
        })
      )
    );

    // ── Country outlines (async, same-origin asset) ────────────────────────────
    let outlineGeo: THREE.BufferGeometry | null = null;
    const disposeOutlines: Array<() => void> = [];
    fetch("/world-110m.geo.json")
      .then(r => (r.ok ? r.json() : null))
      .then(geo => {
        if (cancelled || !geo?.features) return;
        const R = RADIUS * 1.004;
        const pts: number[] = [];
        const addRing = (ring: number[][]) => {
          for (let i = 0; i < ring.length - 1; i++) {
            const a = toVec(ring[i][1], ring[i][0], R);
            const b = toVec(ring[i + 1][1], ring[i + 1][0], R);
            pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
        };
        for (const f of geo.features) {
          const g = f.geometry;
          if (!g) continue;
          const polys =
            g.type === "Polygon"
              ? [g.coordinates]
              : g.type === "MultiPolygon"
                ? g.coordinates
                : [];
          for (const poly of polys) for (const ring of poly) addRing(ring);
        }
        outlineGeo = new THREE.BufferGeometry();
        outlineGeo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(pts, 3)
        );
        const material = new THREE.LineBasicMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.6,
        });
        const outlines = new THREE.LineSegments(outlineGeo, material);
        globe.add(outlines);
        disposeOutlines.push(() => {
          outlineGeo?.dispose();
          material.dispose();
          globe.remove(outlines);
        });
      })
      .catch(() => {});

    // ── Hubs (+ labels) ────────────────────────────────────────────────────────
    const labelTextures: THREE.Texture[] = [];
    for (const m of markers) {
      const pos = toVec(m.location[0], m.location[1], RADIUS);
      const s = m.size ?? 0.7;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.006 + 0.009 * s, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x8df0ff })
      );
      dot.position.copy(pos);
      globe.add(dot);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.017 + 0.032 * s, 12, 12),
        new THREE.MeshBasicMaterial({
          color: 0x00d2ff,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.position.copy(pos);
      globe.add(halo);
      if (m.label) {
        const { sprite, texture } = makeLabel(m.label);
        sprite.position.copy(pos.clone().multiplyScalar(1.06));
        globe.add(sprite);
        labelTextures.push(texture);
      }
    }

    // ── Corridor arcs + travelling pulses ──────────────────────────────────────
    const pulses: {
      mesh: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      t: number;
      speed: number;
    }[] = [];
    for (const a of arcs) {
      const start = toVec(a.from[0], a.from[1], RADIUS);
      const end = toVec(a.to[0], a.to[1], RADIUS);
      const dist = start.distanceTo(end);
      const mid = start
        .clone()
        .add(end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(RADIUS + dist * 0.42);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      globe.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(72)),
          new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.5,
          })
        )
      );
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x9be9ff })
      );
      globe.add(pulse);
      pulses.push({
        mesh: pulse,
        curve,
        t: Math.random(),
        speed: 0.14 + Math.random() * 0.12,
      });
    }

    // ── Controls ───────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.85;

    // ── Loop ───────────────────────────────────────────────────────────────────
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      for (const p of pulses) {
        p.t = (p.t + dt * p.speed) % 1;
        p.mesh.position.copy(p.curve.getPoint(p.t));
      }
      stars.rotation.y += dt * 0.005;
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const resize = () => {
      const w = el.clientWidth || size;
      renderer.setSize(w, w, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      disposeOutlines.forEach(fn => fn());
      labelTextures.forEach(t => t.dispose());
      scene.traverse(obj => {
        const o = obj as THREE.Mesh;
        o.geometry?.dispose?.();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [markers, arcs]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Interactive 3D globe of DJAC regulatory hubs and cross-border corridors"
      className={className}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 520,
        margin: "0 auto",
        touchAction: "none",
      }}
    />
  );
}
