import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type GlobeMarker = {
  id?: string;
  location: [number, number];
  size?: number;
  value?: number;
  label?: string;
};
export type CorridorStatus = "cleared" | "approval" | "blocked";
export type GlobeArc = {
  from: [number, number];
  to: [number, number];
  label?: string;
  status?: CorridorStatus;
  volume?: "low" | "medium" | "high";
  dataCategories?: string[];
};
export type GlobeSelection = {
  type: "hub" | "arc";
  id: string;
  label: string;
  value?: number;
  status?: CorridorStatus;
  dataCategories?: string[];
};

/** Fallback hubs (used when no data-driven markers are supplied). */
export const GLOBE_MARKERS: GlobeMarker[] = [
  { id: "China", location: [39.9, 116.4], size: 0.8, label: "China", value: 3 },
  {
    id: "Saudi Arabia",
    location: [24.7, 46.7],
    size: 1.0,
    label: "Saudi Arabia",
    value: 6,
  },
  {
    id: "European Union",
    location: [50.85, 4.35],
    size: 1.0,
    label: "European Union",
    value: 10,
  },
  {
    id: "United States",
    location: [38.9, -77.0],
    size: 1.2,
    label: "United States",
    value: 21,
  },
  {
    id: "Singapore",
    location: [1.35, 103.8],
    size: 0.6,
    label: "Singapore",
    value: 3,
  },
];

export const GLOBE_ARCS: GlobeArc[] = [
  {
    from: [39.9, 116.4],
    to: [24.7, 46.7],
    label: "Sino–Saudi Data Corridor",
    status: "approval",
    volume: "high",
    dataCategories: ["Personal Data", "Financial Records"],
  },
  {
    from: [39.9, 116.4],
    to: [50.85, 4.35],
    label: "China–EU Transfer",
    status: "approval",
    volume: "high",
    dataCategories: ["Personal Data"],
  },
  {
    from: [24.7, 46.7],
    to: [50.85, 4.35],
    label: "Gulf–EU Link",
    status: "cleared",
    volume: "medium",
  },
  {
    from: [50.85, 4.35],
    to: [38.9, -77.0],
    label: "EU–US Data Bridge",
    status: "cleared",
    volume: "high",
  },
  {
    from: [25.2, 55.3],
    to: [1.35, 103.8],
    label: "Gulf–ASEAN Transit",
    status: "approval",
    volume: "medium",
    dataCategories: ["Personal Data", "Biometric Data"],
  },
  {
    from: [38.9, -77.0],
    to: [-23.55, -46.63],
    label: "Americas Link",
    status: "cleared",
    volume: "low",
  },
  {
    from: [39.9, 116.4],
    to: [1.35, 103.8],
    label: "China–ASEAN Link",
    status: "approval",
    volume: "medium",
    dataCategories: ["Personal Data"],
  },
];

const CORRIDOR_COLOR: Record<CorridorStatus, number> = {
  cleared: 0x10b981,
  approval: 0xf59e0b,
  blocked: 0xef4444,
};
const CORRIDOR_LABEL: Record<CorridorStatus, string> = {
  cleared: "cleared",
  approval: "approval required",
  blocked: "blocked",
};

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

function makeLabel(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
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
  sprite.scale.set(0.34, 0.085, 1);
  return { sprite, texture };
}

/** Brightness ramp for hub color by relative count. */
function hubColor(t: number): THREE.Color {
  return new THREE.Color().setHSL(0.52 - 0.12 * t, 0.9, 0.55 + 0.1 * t);
}

export function Globe3D({
  markers = GLOBE_MARKERS,
  arcs = GLOBE_ARCS,
  selectedId,
  filterStatus,
  whatIf,
  onSelect,
  className,
}: {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  selectedId?: string | null;
  filterStatus?: CorridorStatus | "all";
  whatIf?: boolean;
  onSelect?: (sel: GlobeSelection) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  // Keep the callback in a ref so a re-rendering parent never rebuilds the scene.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const tourRef = useRef(false);
  const [touring, setTouring] = useState(false);
  const resetRef = useRef<() => void>(() => {});
  const emphasizeRef = useRef<(loc: [number, number] | null) => void>(() => {});
  const hubLocRef = useRef<[number, number] | null>(null);
  const filterRef = useRef<CorridorStatus | "all">("all");
  const refreshArcsRef = useRef<() => void>(() => {});
  const whatIfRef = useRef(false);
  const applyWhatIfRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = el.clientWidth || 520;
    let cancelled = false;
    const disposables: Array<{ dispose: () => void }> = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.45, 3.05);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scene.add(new THREE.AmbientLight(0x93b8ff, 1.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x00d2ff, 2.2, 14);
    rimLight.position.set(-3, -1.5, -2);
    scene.add(rimLight);

    const globe = new THREE.Group();
    scene.add(globe);

    // Starfield
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
    const starMat = new THREE.PointsMaterial({
      color: 0x9fc7ff,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    disposables.push(starGeo, starMat);

    // Earth
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

    // Fresnel atmosphere
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

    // Country outlines (same-origin asset)
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
        const og = new THREE.BufferGeometry();
        og.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const om = new THREE.LineBasicMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.6,
        });
        globe.add(new THREE.LineSegments(og, om));
        disposables.push(og, om);
      })
      .catch(() => {});

    // Hubs (+ labels) — pickable
    const pickables: THREE.Object3D[] = [];
    const hubObjects: { dot: THREE.Mesh; loc: [number, number] }[] = [];
    const arcObjects: {
      from: [number, number];
      to: [number, number];
      mat: THREE.MeshBasicMaterial;
      tube: THREE.Mesh;
      status?: CorridorStatus;
      baseStatus?: CorridorStatus;
    }[] = [];
    const labelTextures: THREE.Texture[] = [];
    const maxVal = Math.max(1, ...markers.map(m => m.value ?? 1));
    for (const m of markers) {
      const pos = toVec(m.location[0], m.location[1], RADIUS);
      const s = m.size ?? 0.6;
      const t = Math.min(1, (m.value ?? 1) / maxVal);
      const color = hubColor(t);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.007 + 0.011 * s, 14, 14),
        new THREE.MeshBasicMaterial({ color })
      );
      dot.position.copy(pos);
      dot.userData = {
        type: "hub",
        id: m.id ?? m.label ?? "",
        label: m.label ?? m.id ?? "",
        value: m.value,
        location: m.location,
      };
      globe.add(dot);
      pickables.push(dot);
      hubObjects.push({ dot, loc: m.location });

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.02 + 0.045 * s, 14, 14),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.position.copy(pos);
      globe.add(halo);

      if (m.label) {
        const { sprite, texture } = makeLabel(m.label);
        sprite.position.copy(pos.clone().multiplyScalar(1.07));
        globe.add(sprite);
        labelTextures.push(texture);
      }
    }

    // Corridor arcs — glowing tube + travelling pulse; pickable via a fat tube
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

      const tubeRadius =
        a.volume === "high" ? 0.006 : a.volume === "low" ? 0.003 : 0.0045;
      const tubeGeo = new THREE.TubeGeometry(curve, 72, tubeRadius, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: a.status ? CORRIDOR_COLOR[a.status] : 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.userData = {
        type: "arc",
        id: `${a.from.join(",")}-${a.to.join(",")}`,
        label: a.label ?? "Cross-border corridor",
        status: a.status,
        dataCategories: a.dataCategories,
      };
      globe.add(tube);
      pickables.push(tube);
      arcObjects.push({
        from: a.from,
        to: a.to,
        mat: tubeMat,
        tube,
        status: a.status,
        baseStatus: a.status,
      });
      disposables.push(tubeGeo, tubeMat);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
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

    // Emphasis: brighten corridors touching a selected hub + enlarge the node.
    const sameLoc = (a: [number, number], b: [number, number]) =>
      Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5;
    const refreshArcs = () => {
      for (const ao of arcObjects) {
        const emOn =
          !hubLocRef.current ||
          sameLoc(ao.from, hubLocRef.current) ||
          sameLoc(ao.to, hubLocRef.current);
        const fOn =
          filterRef.current === "all" || ao.status === filterRef.current;
        ao.tube.visible = fOn;
        ao.mat.opacity = emOn ? 0.9 : 0.08;
      }
    };
    refreshArcsRef.current = refreshArcs;
    const emphasizeHub = (loc: [number, number] | null) => {
      hubLocRef.current = loc;
      refreshArcs();
      for (const ho of hubObjects) {
        ho.dot.scale.setScalar(loc && sameLoc(ho.loc, loc) ? 2.2 : 1);
      }
    };
    emphasizeRef.current = emphasizeHub;
    filterRef.current = filterStatus ?? "all";
    refreshArcs();

    // "What-if": simulate stricter rules — approval-required lanes as blocked.
    const applyWhatIf = () => {
      for (const ao of arcObjects) {
        const eff: CorridorStatus | undefined =
          whatIfRef.current && ao.baseStatus === "approval"
            ? "blocked"
            : ao.baseStatus;
        ao.status = eff;
        ao.tube.userData.status = eff;
        ao.mat.color.set(eff ? CORRIDOR_COLOR[eff] : 0x38bdf8);
      }
      refreshArcs();
    };
    applyWhatIfRef.current = applyWhatIf;
    whatIfRef.current = whatIf ?? false;
    applyWhatIf();

    // Expanding pulse rings (spawned when a hub is selected)
    const rings: {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      geo: THREE.RingGeometry;
      t: number;
    }[] = [];
    const spawnRing = (pos: THREE.Vector3, color: THREE.Color) => {
      const geo = new THREE.RingGeometry(0.018, 0.026, 48);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize()
      );
      globe.add(ring);
      rings.push({ mesh: ring, mat, geo, t: 0 });
    };

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.85;
    resetRef.current = () => {
      controls.reset();
    };

    // Auto-cycling spotlight tour
    let tourIdx = 0;
    const tourTimer = window.setInterval(() => {
      if (!tourRef.current || markers.length === 0) return;
      const m = markers[tourIdx % markers.length];
      tourIdx++;
      emphasizeHub(m.location);
      spawnRing(
        toVec(m.location[0], m.location[1], RADIUS),
        new THREE.Color(0x7dd3fc)
      );
      onSelectRef.current?.({
        type: "hub",
        id: m.id ?? m.label ?? "",
        label: m.label ?? m.id ?? "",
        value: m.value,
      });
    }, 3500);

    // Bloom post-processing
    const composer = new EffectComposer(renderer);
    composer.setSize(size, size);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size, size),
      0.75,
      0.55,
      0.82
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos: { x: number; y: number } | null = null;

    const toNdc = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      return r;
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = toNdc(e);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        pickables.filter(o => o.visible !== false),
        false
      )[0];
      if (hit) {
        renderer.domElement.style.cursor = "pointer";
        const d = hit.object.userData as {
          label: string;
          value?: number;
          type: string;
          status?: CorridorStatus;
        };
        const st = d.status ? ` · ${CORRIDOR_LABEL[d.status]}` : "";
        setTip({
          x: e.clientX - r.left,
          y: e.clientY - r.top,
          text:
            d.type === "hub" && d.value != null
              ? `${d.label} · ${d.value} framework${d.value === 1 ? "" : "s"}`
              : `${d.label}${st}`,
        });
      } else {
        renderer.domElement.style.cursor = "grab";
        setTip(null);
      }
    };
    const onPointerLeave = () => setTip(null);
    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 5) return; // treat as drag, not click
      toNdc(e);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        pickables.filter(o => o.visible !== false),
        false
      )[0];
      if (hit && onSelectRef.current) {
        const d = hit.object.userData as GlobeSelection & {
          location?: [number, number];
        };
        if (d.type === "hub" && d.location) {
          const mesh = hit.object as THREE.Mesh;
          const mat = mesh.material as THREE.MeshBasicMaterial;
          emphasizeHub(d.location);
          spawnRing(
            mesh.position.clone(),
            mat instanceof THREE.MeshBasicMaterial
              ? mat.color
              : new THREE.Color(0x00d2ff)
          );
        } else {
          emphasizeHub(null);
        }
        onSelectRef.current({
          type: d.type,
          id: d.id,
          label: d.label,
          value: d.value,
          status: d.status,
          dataCategories: d.dataCategories,
        });
      } else if (!hit) {
        emphasizeHub(null);
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);

    // Loop (paused while the tab is hidden or the globe is off-screen)
    let raf = 0;
    let running = false;
    let inView = true;
    const clock = new THREE.Clock();
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const speedScale = reduceMotion ? 0.3 : 1;
      for (const p of pulses) {
        p.t = (p.t + dt * p.speed * speedScale) % 1;
        p.mesh.position.copy(p.curve.getPoint(p.t));
      }
      if (!reduceMotion) stars.rotation.y += dt * 0.005;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += dt * 1.6;
        r.mesh.scale.setScalar(1 + r.t * 4);
        r.mat.opacity = Math.max(0, 0.9 * (1 - r.t));
        if (r.t >= 1) {
          globe.remove(r.mesh);
          r.geo.dispose();
          r.mat.dispose();
          rings.splice(i, 1);
        }
      }
      controls.update();
      composer.render();
      raf = requestAnimationFrame(animate);
    };
    const start = () => {
      if (running) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(animate);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };
    const updateRun = () => {
      if (inView && !document.hidden) start();
      else stop();
    };
    updateRun();

    const io = new IntersectionObserver(
      entries => {
        inView = entries[0]?.isIntersecting ?? true;
        updateRun();
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    const onVisibility = () => updateRun();
    document.addEventListener("visibilitychange", onVisibility);

    const resize = () => {
      const w = el.clientWidth || size;
      renderer.setSize(w, w, false);
      composer.setSize(w, w);
      bloom.setSize(w, w);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearInterval(tourTimer);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      labelTextures.forEach(t => t.dispose());
      rings.forEach(r => {
        r.geo.dispose();
        r.mat.dispose();
      });
      composer.dispose();
      scene.traverse(obj => {
        const o = obj as THREE.Mesh;
        o.geometry?.dispose?.();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose?.();
      });
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [markers, arcs]);

  // Controlled selection (e.g. from an external keyboard-accessible list).
  useEffect(() => {
    const m = markers.find(x => (x.id ?? x.label) === selectedId);
    emphasizeRef.current(m ? m.location : null);
  }, [selectedId, markers]);

  // Controlled corridor-status filter.
  useEffect(() => {
    filterRef.current = filterStatus ?? "all";
    refreshArcsRef.current();
  }, [filterStatus]);

  // Controlled "what-if" stress test.
  useEffect(() => {
    whatIfRef.current = whatIf ?? false;
    applyWhatIfRef.current();
  }, [whatIf]);

  const downloadPng = () => {
    const canvas = ref.current?.querySelector(
      "canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "djac-global-regulatory-network.png";
    a.click();
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 520,
        margin: "0 auto",
        touchAction: "none",
      }}
    >
      {tip && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            left: Math.min(tip.x + 12, 360),
            top: Math.max(tip.y - 10, 4),
            pointerEvents: "none",
            background: "rgba(2,10,25,0.92)",
            border: "1px solid rgba(56,189,248,0.45)",
            borderRadius: 8,
            padding: "4px 9px",
            fontSize: 11,
            color: "#c7e6ff",
            whiteSpace: "nowrap",
          }}
        >
          {tip.text}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          fontSize: 10,
          color: "#8fb4d6",
          lineHeight: 1.5,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>few</span>
          <span
            style={{
              display: "inline-block",
              width: 54,
              height: 6,
              borderRadius: 3,
              background:
                "linear-gradient(90deg, hsl(188,90%,55%), hsl(173,90%,62%))",
            }}
          />
          <span>many</span>
        </div>
        <div>Hub size/colour = frameworks per jurisdiction</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 3,
          }}
        >
          <span style={{ color: "#10b981" }}>●</span> cleared
          <span style={{ color: "#f59e0b" }}>●</span> approval
          <span style={{ color: "#ef4444" }}>●</span> blocked
        </div>
      </div>

      {/* Snapshot */}
      <button
        type="button"
        onClick={downloadPng}
        aria-label="Download globe as PNG"
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          background: "rgba(2,10,25,0.6)",
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 8,
          color: "#9bd6ff",
          fontSize: 11,
          padding: "4px 9px",
          cursor: "pointer",
        }}
      >
        PNG
      </button>

      {/* Reset view */}
      <button
        type="button"
        onClick={() => resetRef.current()}
        aria-label="Reset view"
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          background: "rgba(2,10,25,0.6)",
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 8,
          color: "#9bd6ff",
          fontSize: 12,
          padding: "3px 9px",
          cursor: "pointer",
        }}
      >
        ⟲
      </button>

      {/* Tour toggle */}
      <button
        type="button"
        onClick={() => {
          tourRef.current = !tourRef.current;
          setTouring(tourRef.current);
        }}
        aria-pressed={touring}
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          background: touring ? "rgba(0,210,255,0.2)" : "rgba(2,10,25,0.6)",
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 8,
          color: "#9bd6ff",
          fontSize: 11,
          padding: "4px 9px",
          cursor: "pointer",
        }}
      >
        {touring ? "■ Tour" : "▶ Tour"}
      </button>
    </div>
  );
}
