// 3D muscle viewer for the player profile.
// Model: models/muscles-male.glb — CC BY-SA 4.0, see models/ATTRIBUTION.md.
// One viewer is created on first use and moved between profiles, so the model loads once.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let pending = null;
export function getViewer() { if (!pending) pending = create().catch((e) => { pending = null; throw e; }); return pending; }

const VIEWS = {
  front: { target: [0, 0.87, 0], pos: [0, 0.95, 3.7] },
  back: { target: [0, 0.87, 0], pos: [0, 0.95, -3.7] },
  legs: { target: [0, 0.52, 0], pos: [0.55, 0.62, 2.45] },
  legsBack: { target: [0, 0.52, 0], pos: [-0.55, 0.62, -2.45] }
};

async function create() {
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("WebGL is not available in this browser.");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "ana-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Rotatable 3D muscle model. Drag to turn, pinch or scroll to zoom, tap a muscle for details.");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 30);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4458, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(1.4, 2.4, 2.6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(-1.6, 1.9, -2.6); scene.add(rim);

  const url = new URL("./models/muscles-male.glb", import.meta.url).href;
  const gltf = await new GLTFLoader().loadAsync(url);
  const body = gltf.scene; scene.add(body);

  const muscles = new Map(), pickables = [], others = [];
  body.traverse((o) => {
    if (!o.isMesh) return;
    const u = o.userData || {};
    o.material = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, color: 0xcccccc });
    if (u.muscleId) { muscles.set(u.muscleId, o); pickables.push(o); }
    else { o.userData.kind = u.boneId ? "bone" : u.contextType === "connective" ? "connective" : "context"; others.push(o); }
  });

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.minDistance = 1.1; controls.maxDistance = 5.5;
  controls.minPolarAngle = Math.PI * 0.18; controls.maxPolarAngle = Math.PI * 0.78;
  controls.rotateSpeed = 0.8;

  // camera tween
  let tween = null;
  function go(name, instant) {
    const v = VIEWS[name] || VIEWS.front;
    const to = { t: new THREE.Vector3(...v.target), p: new THREE.Vector3(...v.pos) };
    if (instant) { controls.target.copy(to.t); camera.position.copy(to.p); controls.update(); tween = null; return kick(); }
    tween = { from: { t: controls.target.clone(), p: camera.position.clone() }, to, t0: performance.now(), dur: 650 };
    kick();
  }

  // render loop runs only while the canvas is on the page
  let raf = 0, dirty = true;
  controls.addEventListener("change", () => (dirty = true));
  function frame(now) {
    raf = 0;
    if (!canvas.isConnected) return;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      controls.target.lerpVectors(tween.from.t, tween.to.t, e); camera.position.lerpVectors(tween.from.p, tween.to.p, e);
      if (k >= 1) tween = null; dirty = true;
    }
    controls.update();
    if (dirty) { renderer.render(scene, camera); dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  function kick() { dirty = true; if (!raf) raf = requestAnimationFrame(frame); }

  function resize() {
    const box = canvas.parentElement; if (!box) return;
    const w = Math.max(200, box.clientWidth), h = Math.max(260, box.clientHeight);
    renderer.setSize(w, h, false); canvas.style.width = "100%"; canvas.style.height = "100%";
    camera.aspect = w / h;
    // keep the whole body in frame on narrow screens
    camera.fov = w / h < 0.72 ? 34 : 28;
    camera.updateProjectionMatrix(); kick();
  }
  const ro = new ResizeObserver(resize);

  // tap / click to pick a muscle (ignore drags)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null, onPick = null, onHover = null;
  canvas.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables.filter((m) => m.visible), false)[0];
    return h ? h.object.userData : null;
  }
  canvas.addEventListener("pointerup", (e) => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 6 || !onPick) return;
    onPick(hit(e));
  });
  canvas.addEventListener("pointermove", (e) => { if (down || e.pointerType !== "mouse" || !onHover) return; onHover(hit(e), e); });
  canvas.addEventListener("pointerleave", () => onHover && onHover(null));

  const tmp = new THREE.Color();
  return {
    muscleIds: [...muscles.keys()],
    mount(container, opts = {}) {
      ro.disconnect(); container.appendChild(canvas); ro.observe(container);
      onPick = opts.onPick || null; onHover = opts.onHover || null;
      resize(); go(opts.view || "front", true);
    },
    view(name) { go(name); },
    // paint(fn): fn(muscleId, userData) -> { color, glow }, plus colors for bone / context tissue
    paint(fn, base) {
      muscles.forEach((m, id) => {
        const p = fn(id, m.userData) || {};
        m.material.color.set(p.color || base.context);
        if (p.glow) { m.material.emissive.copy(tmp.set(p.color || base.context)); m.material.emissiveIntensity = p.glow; }
        else { m.material.emissive.set(0x000000); m.material.emissiveIntensity = 0; }
      });
      others.forEach((o) => {
        const c = o.userData.kind === "bone" ? base.bone : o.userData.kind === "connective" ? base.connective : base.context;
        o.material.color.set(c); o.material.emissive.set(0x000000);
      });
      kick();
    }
  };
}
