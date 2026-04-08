import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const BOARD_DEPTH = 5;
const CORNER_R    = 9;
const BG          = 0xF0F2F5;

// Build board shape with slot holes punched in natively by Three.js
// This is O(n) geometry — no boolean algebra, just vertices
function buildBoardShape(w, h, slots) {
  const r = CORNER_R;
  const outline = new THREE.Shape();
  outline.moveTo(r, 0);
  outline.lineTo(w - r, 0);
  outline.absarc(w-r, r,   r, -Math.PI/2, 0,           false);
  outline.lineTo(w, h - r);
  outline.absarc(w-r, h-r, r,  0,          Math.PI/2,   false);
  outline.lineTo(r, h);
  outline.absarc(r,   h-r, r,  Math.PI/2,  Math.PI,     false);
  outline.lineTo(0, r);
  outline.absarc(r,   r,   r,  Math.PI,    Math.PI*1.5, false);

  // Each slot is a hole path added to the shape
  const rx = 2.5, lineH = 5.0;
  for (const { x, y, w: sw, h: sh } of slots) {
    const cx = x + sw / 2;
    const cy = h - (y + sh / 2);
    const hole = new THREE.Path();
    hole.moveTo(cx + rx, cy - lineH);
    hole.absarc(cx, cy - lineH, rx, 0,       Math.PI,   true);
    hole.lineTo(cx - rx, cy + lineH);
    hole.absarc(cx, cy + lineH, rx, Math.PI, Math.PI*2, true);
    outline.holes.push(hole);
  }

  return outline;
}

function buildBoardGeo(w, h, slots) {
  const shape = buildBoardShape(w, h, slots);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: BOARD_DEPTH,
    bevelEnabled: false,
  });
  geo.computeVertexNormals();
  return geo;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BoardISOView({ width, height, slots }) {
  const mountRef  = useRef(null);
  const stateRef  = useRef(null);
  const geomTimer = useRef(null);

  useEffect(() => {
    const container = mountRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(BG);
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(1, 1, 2);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-1, -0.5, 1);
    scene.add(dir2);

    const matBoard = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 40, side: THREE.DoubleSide });
    const boardMesh = new THREE.Mesh(new THREE.BufferGeometry(), matBoard);
    scene.add(boardMesh);

    // Camera
    const aspect = (container.clientWidth || 1) / (container.clientHeight || 1);
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);

    const setCamera = (bw, bh) => {
      const cx = bw / 2, cy = bh / 2, cz = BOARD_DEPTH / 2;
      const dist = Math.max(bw, bh) * 1.8;
      camera.position.set(cx + dist * 0.7, cy - dist * 0.7, cz + dist * 0.7);
      camera.lookAt(cx, cy, cz);
      camera.up.set(0, 0, 1);
    };
    setCamera(width, height);

    // Orbit
    const drag = { active: false, x: 0, y: 0 };
    let spherical = { theta: Math.PI / 4, phi: Math.PI / 3.5 };
    let radiusMult = 1;

    const updateOrbit = (bw, bh) => {
      const cx = bw / 2, cy = bh / 2, cz = BOARD_DEPTH / 2;
      const base = Math.max(bw, bh) * 1.8 * radiusMult;
      camera.position.set(
        cx + base * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        cy - base * Math.sin(spherical.phi) * Math.cos(spherical.theta),
        cz + base * Math.cos(spherical.phi)
      );
      camera.lookAt(cx, cy, cz);
    };

    const onMouseDown = (e) => { drag.active = true; drag.x = e.clientX; drag.y = e.clientY; };
    const onMouseMove = (e) => {
      if (!drag.active) return;
      spherical.theta -= (e.clientX - drag.x) * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, spherical.phi + (e.clientY - drag.y) * 0.008));
      drag.x = e.clientX; drag.y = e.clientY;
      const s = stateRef.current;
      if (s) updateOrbit(s.boardW, s.boardH);
    };
    const onMouseUp = () => { drag.active = false; };
    const onWheel = (e) => {
      e.preventDefault();
      radiusMult = Math.max(0.4, Math.min(3, radiusMult * (e.deltaY > 0 ? 1.1 : 0.9)));
      const s = stateRef.current;
      if (s) updateOrbit(s.boardW, s.boardH);
    };

    let lastTouchDist = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        drag.active = true; drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        drag.active = false;
        lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && drag.active) {
        spherical.theta -= (e.touches[0].clientX - drag.x) * 0.012;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, spherical.phi + (e.touches[0].clientY - drag.y) * 0.012));
        drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY;
        const s = stateRef.current;
        if (s) updateOrbit(s.boardW, s.boardH);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        radiusMult = Math.max(0.4, Math.min(3, radiusMult * (lastTouchDist / dist)));
        lastTouchDist = dist;
        const s = stateRef.current;
        if (s) updateOrbit(s.boardW, s.boardH);
      }
    };
    const onTouchEnd = () => { drag.active = false; };

    const el = renderer.domElement;
    el.addEventListener('mousedown',  onMouseDown);
    el.addEventListener('mousemove',  onMouseMove);
    el.addEventListener('mouseup',    onMouseUp);
    el.addEventListener('mouseleave', onMouseUp);
    el.addEventListener('wheel',      onWheel,      { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);

    const ro = new ResizeObserver(([entry]) => {
      const { width: rw, height: rh } = entry.contentRect;
      if (!rw || !rh) return;
      renderer.setSize(rw, rh);
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    stateRef.current = {
      renderer, camera, boardMesh,
      boardW: width, boardH: height,
      setCamera, updateOrbit,
    };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      el.removeEventListener('mousedown',  onMouseDown);
      el.removeEventListener('mousemove',  onMouseMove);
      el.removeEventListener('mouseup',    onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
      renderer.dispose();
      if (container.contains(el)) container.removeChild(el);
      stateRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(geomTimer.current);
    geomTimer.current = setTimeout(() => {
      const s = stateRef.current;
      if (!s) return;
      s.boardMesh.geometry.dispose();
      s.boardMesh.geometry = buildBoardGeo(width, height, slots);
      s.boardW = width;
      s.boardH = height;
      s.setCamera(width, height);
    }, 150);
    return () => clearTimeout(geomTimer.current);
  }, [width, height, slots]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  );
}
