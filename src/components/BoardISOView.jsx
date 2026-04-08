import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const BOARD_DEPTH = 5;
const CORNER_R    = 9;
const BG          = 0xF0F2F5; // matches --dec-dark-bg

const VERT = `
  precision highp float;
  attribute vec3 position;
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform sampler2D tColor;
  uniform sampler2D tNormal;
  uniform sampler2D tDepth;
  uniform vec2 res;
  vec3 norm(vec2 uv) { return texture2D(tNormal, uv).rgb * 2.0 - 1.0; }
  float dep(vec2 uv)  { return texture2D(tDepth,  uv).r; }
  void main() {
    vec2 uv = gl_FragCoord.xy / res;
    vec2 p  = 1.0 / res;
    float d[9];
    d[0]=dep(uv+vec2(-p.x,-p.y)); d[1]=dep(uv+vec2(0.0,-p.y)); d[2]=dep(uv+vec2(p.x,-p.y));
    d[3]=dep(uv+vec2(-p.x, 0.0));                               d[5]=dep(uv+vec2(p.x, 0.0));
    d[6]=dep(uv+vec2(-p.x, p.y)); d[7]=dep(uv+vec2(0.0, p.y)); d[8]=dep(uv+vec2(p.x, p.y));
    float Gx = -d[0]-2.0*d[3]-d[6] + d[2]+2.0*d[5]+d[8];
    float Gy = -d[0]-2.0*d[1]-d[2] + d[6]+2.0*d[7]+d[8];
    float edgeD = sqrt(Gx*Gx + Gy*Gy);
    vec3 n[9];
    n[0]=norm(uv+vec2(-p.x,-p.y)); n[1]=norm(uv+vec2(0.0,-p.y)); n[2]=norm(uv+vec2(p.x,-p.y));
    n[3]=norm(uv+vec2(-p.x, 0.0));                                n[5]=norm(uv+vec2(p.x, 0.0));
    n[6]=norm(uv+vec2(-p.x, p.y)); n[7]=norm(uv+vec2(0.0, p.y)); n[8]=norm(uv+vec2(p.x, p.y));
    vec3 nGx = -n[0]-2.0*n[3]-n[6] + n[2]+2.0*n[5]+n[8];
    vec3 nGy = -n[0]-2.0*n[1]-n[2] + n[6]+2.0*n[7]+n[8];
    float edgeN = sqrt(dot(nGx,nGx)+dot(nGy,nGy));
    float edge  = step(0.25, max(edgeD * 30.0, edgeN));
    vec4 color  = texture2D(tColor, uv);
    gl_FragColor = mix(color, vec4(0.0,0.0,0.0,1.0), edge);
  }
`;

function buildBoardGeo(w, h) {
  const r = CORNER_R;
  const shape = new THREE.Shape();
  shape.moveTo(r, 0);
  shape.lineTo(w - r, 0);
  shape.absarc(w-r, r,   r, -Math.PI/2, 0,           false);
  shape.lineTo(w, h - r);
  shape.absarc(w-r, h-r, r,  0,          Math.PI/2,   false);
  shape.lineTo(r, h);
  shape.absarc(r,   h-r, r,  Math.PI/2,  Math.PI,     false);
  shape.lineTo(0, r);
  shape.absarc(r,   r,   r,  Math.PI,    Math.PI*1.5, false);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: BOARD_DEPTH, bevelEnabled: false });
  geo.computeVertexNormals();
  return geo;
}

function buildSlotsGeo(slots, boardH) {
  if (!slots.length) return null;
  const rx = 2.5, lineH = 5.0;
  const geos = slots.map(({ x, y, w, h }) => {
    const cx = x + w / 2;
    const cy = boardH - (y + h / 2);
    const shape = new THREE.Shape();
    shape.moveTo(cx + rx, cy - lineH);
    shape.absarc(cx, cy - lineH, rx, 0,       Math.PI,   true);
    shape.lineTo(cx - rx, cy + lineH);
    shape.absarc(cx, cy + lineH, rx, Math.PI, Math.PI*2, true);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: BOARD_DEPTH + 2, bevelEnabled: false });
    geo.computeVertexNormals();
    return geo;
  });
  const merged = mergeGeometries(geos);
  geos.forEach(g => g.dispose());
  merged.computeVertexNormals();
  return merged;
}

// Isometric camera: 45° azimuth, true isometric elevation (~35.26°)
// Board is in XY plane, extruded in +Z
function updateCamera(camera, boardW, boardH, containerW, containerH) {
  // frustum: fit the board with some padding, correct aspect
  const aspect = containerW / containerH;
  const fitW   = boardW * 1.6;
  const fitH   = boardH * 1.6;
  // pick the view size that fits both dimensions
  let vH = fitH;
  if (fitW / aspect > fitH) vH = fitW / aspect;
  const vW = vH * aspect;

  camera.left   = -vW / 2;
  camera.right  =  vW / 2;
  camera.top    =  vH / 2;
  camera.bottom = -vH / 2;
  camera.near   = -999999;
  camera.far    =  999999;

  // position: true isometric angles (120° apart on each axis)
  const cx = boardW / 2;
  const cy = boardH / 2;
  const cz = BOARD_DEPTH / 2;
  const dist = Math.max(boardW, boardH) * 2.5;
  // ISO: camera comes from front-right-top
  camera.position.set(cx + dist, cy - dist, cz + dist);
  camera.up.set(0, 0, 1);
  camera.lookAt(cx, cy, cz);
  camera.updateProjectionMatrix();
}

export default function BoardISOView({ width, height, slots }) {
  const canvasRef   = useRef(null);
  const stateRef    = useRef(null);
  const geomTimerRef = useRef(null);

  // ── Init renderer (runs once) ──────────────────────────────────────────────
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = canvas.parentElement;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(1, 1, false);

    // Scene A: color pass (board white, slots bg-colored)
    const sceneA   = new THREE.Scene();
    sceneA.background = new THREE.Color(BG);
    const matBoard = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matSlot  = new THREE.MeshBasicMaterial({ color: BG });
    const boardMesh  = new THREE.Mesh(new THREE.BufferGeometry(), matBoard);
    const slotsMesh  = new THREE.Mesh(new THREE.BufferGeometry(), matSlot);
    slotsMesh.position.z = -1;
    sceneA.add(boardMesh, slotsMesh);

    // Scene B: normal pass (for edge detection)
    const sceneB    = new THREE.Scene();
    sceneB.background = new THREE.Color(0x8080ff);
    const matNormal  = new THREE.MeshNormalMaterial();
    const boardMeshB = new THREE.Mesh(new THREE.BufferGeometry(), matNormal);
    const slotsMeshB = new THREE.Mesh(new THREE.BufferGeometry(), matSlot);
    slotsMeshB.position.z = -1;
    sceneB.add(boardMeshB, slotsMeshB);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -999999, 999999);

    const rtColor  = new THREE.WebGLRenderTarget(1, 1);
    const rtNormal = new THREE.WebGLRenderTarget(1, 1);
    const rtDepth  = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedShortType),
    });

    const quadGeo = new THREE.BufferGeometry();
    quadGeo.setAttribute('position', new THREE.Float32BufferAttribute(
      [-1,-1,0, 1,-1,0, -1,1,0, 1,1,0], 3
    ));
    quadGeo.setIndex([0,1,2, 1,3,2]);
    const quadMat = new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tColor:  { value: rtColor.texture },
        tNormal: { value: rtNormal.texture },
        tDepth:  { value: rtDepth.depthTexture },
        res:     { value: new THREE.Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });
    const sceneQuad = new THREE.Scene();
    sceneQuad.add(new THREE.Mesh(quadGeo, quadMat));
    const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Central resize handler — always reads from stateRef for board dims
    const applySize = (rw, rh) => {
      renderer.setSize(rw, rh, false);
      [rtColor, rtNormal, rtDepth].forEach(rt => rt.setSize(rw, rh));
      quadMat.uniforms.res.value.set(rw, rh);
      const s = stateRef.current;
      updateCamera(camera, s?.boardW ?? width, s?.boardH ?? height, rw, rh);
    };

    const ro = new ResizeObserver(([entry]) => {
      const { width: rw, height: rh } = entry.contentRect;
      if (rw > 0 && rh > 0) applySize(rw, rh);
    });
    ro.observe(container);

    // Also apply synchronously if container already has dimensions (desktop)
    const iw = container.clientWidth;
    const ih = container.clientHeight;
    if (iw > 0 && ih > 0) applySize(iw, ih);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.setRenderTarget(rtColor);  renderer.render(sceneA, camera);
      renderer.setRenderTarget(rtNormal); renderer.render(sceneB, camera);
      renderer.setRenderTarget(rtDepth);  renderer.render(sceneA, camera);
      renderer.setRenderTarget(null);     renderer.render(sceneQuad, camQuad);
    };
    animate();

    stateRef.current = {
      renderer, camera, applySize,
      boardMesh, slotsMesh, boardMeshB, slotsMeshB,
      boardW: width, boardH: height,
    };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      rtColor.dispose(); rtNormal.dispose(); rtDepth.dispose();
      renderer.dispose();
      stateRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update geometry when board dims / slots change ─────────────────────────
  useEffect(() => {
    clearTimeout(geomTimerRef.current);
    geomTimerRef.current = setTimeout(() => {
      const s = stateRef.current;
      if (!s) return;

      s.boardMesh.geometry.dispose();
      s.slotsMesh.geometry.dispose();
      s.boardMeshB.geometry.dispose();

      const bg = buildBoardGeo(width, height);
      const sg = buildSlotsGeo(slots, height) ?? new THREE.BufferGeometry();

      s.boardMesh.geometry  = bg;
      s.slotsMesh.geometry  = sg;
      s.boardMeshB.geometry = bg;
      s.slotsMeshB.geometry = sg;

      s.boardW = width;
      s.boardH = height;

      // Re-run applySize with current container dimensions so camera fits new board
      const container = s.renderer.domElement.parentElement;
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      if (rw > 0 && rh > 0) s.applySize(rw, rh);
    }, 150);
    return () => clearTimeout(geomTimerRef.current);
  }, [width, height, slots]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
