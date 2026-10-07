import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GlobeMarker = { location: [number, number]; size?: number };
export type GlobeArc = { from: [number, number]; to: [number, number] };

/** Key regulatory hubs (lat, lng). */
export const GLOBE_MARKERS: GlobeMarker[] = [
  { location: [39.9, 116.4], size: 1.0 }, // Beijing, China
  { location: [22.3, 114.2], size: 0.7 }, // Hong Kong
  { location: [24.7, 46.7], size: 1.0 }, // Riyadh, Saudi Arabia
  { location: [25.2, 55.3], size: 0.8 }, // Dubai, UAE
  { location: [50.85, 4.35], size: 0.9 }, // Brussels, EU
  { location: [38.9, -77.0], size: 0.9 }, // Washington, US
  { location: [51.5, -0.12], size: 0.7 }, // London, UK
  { location: [1.35, 103.8], size: 0.7 }, // Singapore
  { location: [35.68, 139.7], size: 0.6 }, // Tokyo, Japan
  { location: [-33.87, 151.2], size: 0.6 }, // Sydney, Australia
  { location: [-23.55, -46.63], size: 0.6 }, // São Paulo, Brazil
  { location: [-1.29, 36.82], size: 0.6 }, // Nairobi, Kenya
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

/**
 * Full 3D globe (three.js): wireframe earth, fresnel atmosphere, glowing hubs
 * and animated cross-border corridor pulses. Orbit + auto-rotate. Everything is
 * code-generated — no external textures, so no CSP/network changes.
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.35, 3.1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x8fb6ff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 2, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x00d2ff, 2.2, 12);
    rim.position.set(-3, -1.5, -2);
    scene.add(rim);

    const globe = new THREE.Group();
    scene.add(globe);

    // Earth core
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x0a1a33,
        emissive: 0x061024,
        specular: 0x1b3a6b,
        shininess: 14,
      })
    );
    globe.add(earth);

    // Wireframe grid
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.0015, 36, 24),
        new THREE.MeshBasicMaterial({
          color: 0x1d4ed8,
          wireframe: true,
          transparent: true,
          opacity: 0.22,
        })
      )
    );

    // Fresnel atmosphere glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.18, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          glowColor: { value: new THREE.Color(0x00d2ff) },
          c: { value: 0.45 },
          p: { value: 3.6 },
        },
        vertexShader:
          "varying vec3 vNormal; varying vec3 vView; void main(){ vNormal = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vView = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader:
          "varying vec3 vNormal; varying vec3 vView; uniform vec3 glowColor; uniform float c; uniform float p; void main(){ float i = pow(c - dot(vNormal, vView), p); gl_FragColor = vec4(glowColor, i); }",
      })
    );
    scene.add(glow);

    // Hubs
    for (const m of markers) {
      const pos = toVec(m.location[0], m.location[1], RADIUS);
      const s = m.size ?? 0.7;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.006 + 0.008 * s, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
      );
      dot.position.copy(pos);
      globe.add(dot);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.016 + 0.03 * s, 12, 12),
        new THREE.MeshBasicMaterial({
          color: 0x00d2ff,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.position.copy(pos);
      globe.add(halo);
    }

    // Corridor arcs + travelling pulses
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
        .multiplyScalar(RADIUS + dist * 0.45);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      globe.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)),
          new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
          })
        )
      );
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
      );
      globe.add(pulse);
      pulses.push({
        mesh: pulse,
        curve,
        t: Math.random(),
        speed: 0.14 + Math.random() * 0.12,
      });
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.82;

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      for (const p of pulses) {
        p.t = (p.t + dt * p.speed) % 1;
        p.mesh.position.copy(p.curve.getPoint(p.t));
      }
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse(obj => {
        const anyObj = obj as THREE.Mesh;
        anyObj.geometry?.dispose?.();
        const mat = anyObj.material;
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
