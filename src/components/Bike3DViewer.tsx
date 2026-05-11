import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import {
  resolveBikeModelUrl, resolveBikeConfig, getBikeLabel,
  getCachedGLB, setCachedGLB,
} from '../constants/bikeRegistry';
import {
  ZONE_META, PART_TO_GARAGE_ZONE, ZONE_CAMERA, FINISH_PRESETS,
  type FinishId, type GarageZone,
} from '../constants/zoneMeta';
import { nextEngineState, computeFrameDeltas } from '../constants/engineState';

// Three.js + loaders loaded lazily from CDN on web
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const GLTF_CDN = 'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js';

let threePromise: Promise<any> | null = null;
const loadThree = (): Promise<any> => {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  if ((window as any).THREE?.GLTFLoader) return Promise.resolve((window as any).THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve) => {
    const loadScript = (src: string, onload: () => void) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = onload;
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    };
    loadScript(THREE_CDN, () => {
      loadScript(GLTF_CDN, () => {
        const THREE = (window as any).THREE;
        if (THREE && (window as any).THREE.GLTFLoader) {
          resolve(THREE);
        } else {
          // GLTFLoader may be on window directly
          resolve(THREE || null);
        }
      });
    });
  });
  return threePromise;
};

export interface Bike3DViewerProps {
  bikeName?: string;
  modelUrl?: string;
  primaryColor?: string;
  onColorChange?: (color: string) => void;
  designMode?: boolean;
  partColors?: Record<string, string>;
  onPartColorChange?: (part: string, color: string) => void;
  selectedZone?: GarageZone;
  garageColors?: Record<string, string>;
  onGarageColorChange?: (zone: string, color: string) => void;
  garageFinish?: FinishId;
  engineOn?: boolean;
  rpm?: number;
  selectedWheelItem?: string;
  onPulse?: (pulse: number, glow: number) => void;
  height?: number;
}

const MOTORCYCLE_COLORS = [
  { label: 'Stealth Black', color: '#151515', accent: '#3a3a3a' },
  { label: 'Ducati Red',    color: '#cc1010', accent: '#ff2222' },
  { label: 'Winter Test',   color: '#1845a0', accent: '#3377ff' },
  { label: 'Arctic White',  color: '#d5d5d5', accent: '#888888' },
  { label: 'Lava Orange',   color: '#d05810', accent: '#ff7722' },
  { label: 'Desert Yellow', color: '#c49510', accent: '#ffcc33' },
  { label: 'Racing Green',  color: '#187228', accent: '#22cc44' },
];

// Classify mesh material by name heuristics
function classifyPart(mat: any, matIdx: number, config: any): string {
  const n = (mat.name || '').toLowerCase();
  if (config) {
    if (config.bodyMatIndices?.includes(matIdx)) return 'body';
    if (config.keepMatIndices?.includes(matIdx)) return 'detail';
    if (config.accentMatIndices?.includes(matIdx)) return 'chrome';
    if (config.bodyMatNames) {
      for (const bn of config.bodyMatNames) if (n === bn.toLowerCase()) return 'body';
    }
  }
  if (n.includes('tire') || n.includes('tyre') || n.includes('rubber') ||
      n.includes('black') || n.includes('dark') || n.includes('grip')) return 'tire';
  if (n.includes('chrome') || n.includes('silver') || n.includes('metal') ||
      n.includes('rim') || n.includes('exhaust') || n.includes('fork') ||
      n.includes('handlebar') || n.includes('pipe')) return 'chrome';
  if (n.includes('glass') || n.includes('lens') || n.includes('light') ||
      n.includes('windshield')) return 'glass';
  if (n.includes('paint') || n.includes('body') || n.includes('fairing') ||
      n.includes('tank') || n.includes('fender') || n.includes('seat')) return 'body';
  if (!mat.color) return 'detail';
  const hsl = { h: 0, s: 0, l: 0 };
  mat.color.getHSL(hsl);
  if (hsl.s > 0.15 && hsl.l < 0.9) return 'body';
  if (hsl.s < 0.15) return 'tire';
  if (hsl.s > 0.9 && hsl.l < 0.05) return 'body';
  if (hsl.l < 0.08) return 'detail';
  return 'body';
}

// Normalize model scale + position
function positionModel(scene: any, THREE: any, config: any) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? (config?.scale ?? 1.8) / maxDim : 1;
  scene.scale.setScalar(scale);
  scene.position.x = -center.x * scale + (config?.offsetX ?? 0);
  scene.position.z = -center.z * scale + (config?.offsetZ ?? 0);
  scene.position.y = -box.min.y * scale + (config?.offsetY ?? 0.01);
  if (config?.rotationY) scene.rotation.y = config.rotationY;
}

// Apply PBR materials with custom shader for body recoloring
function applyPBR(scene: any, config: any, bodyColor: any, accentColor: any, envMap: any,
                  partColorsRef: any, finishKey: string, state: any, THREE: any) {
  const tireY = config?.splitThresholds?.tireY ?? -0.5;
  scene.traverse((obj: any) => {
    if (!obj.isMesh || !obj.material) return;
    obj.userData.partType = 'body';
    const mat = obj.material.clone();
    obj.material = mat;
    if (envMap && !mat.envMap) { mat.envMap = envMap; mat.envMapIntensity = 1.2; }
    // Store uniforms for shader injection
    mat.userData.uTargetColor = { value: bodyColor.clone() };
    mat.userData.uTireY = { value: tireY };
    mat.userData.uHideStockWheels = { value: 0 };
    mat.userData.uFrontWheelPos = { value: state?.frontWheelPos ?? new THREE.Vector3(0, 0, 1) };
    mat.userData.uRearWheelPos = { value: state?.rearWheelPos ?? new THREE.Vector3(0, 0, -1) };
    mat.userData.uWheelRadius = { value: state?.wheelRadius ?? 0.35 };
    mat.userData.uRimColor = { value: new THREE.Color(0) };
    mat.userData.uRimColorActive = { value: 0 };
    mat.needsUpdate = true;
  });
}

// Find the mesh with the most vertices (primary mesh)
function findPrimaryMesh(scene: any, THREE: any): any {
  let best: any = null;
  let bestCount = 0;
  scene.traverse((obj: any) => {
    if (obj instanceof THREE.Mesh) {
      const pos = obj.geometry?.attributes?.position;
      if (pos && pos.count > bestCount) { bestCount = pos.count; best = obj; }
    }
  });
  return best;
}

const canvasStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block', cursor: 'grab' };

export default function Bike3DViewer({
  bikeName = 'Ducati Panigale V4',
  modelUrl,
  primaryColor,
  onColorChange,
  designMode = false,
  partColors,
  onPartColorChange,
  selectedZone,
  garageColors,
  onGarageColorChange,
  garageFinish = 'glossy',
  engineOn = false,
  rpm = 0,
  selectedWheelItem = 'stock_rims',
  onPulse,
  height = 380,
}: Bike3DViewerProps) {
  const [colorEntry, setColorEntry] = useState(
    MOTORCYCLE_COLORS.find((c) => c.color === primaryColor) ?? MOTORCYCLE_COLORS[1],
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const containerRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const stateRef = useRef<any>(null);
  const bikeNameRef = useRef(bikeName);
  const partColorsRef = useRef(partColors);
  const engineOnRef = useRef(engineOn);
  const rpmRef = useRef(rpm);
  const onPulseRef = useRef(onPulse);

  partColorsRef.current = partColors;
  engineOnRef.current = engineOn;
  rpmRef.current = rpm;
  onPulseRef.current = onPulse;

  // Sync color entry when primaryColor prop changes
  useEffect(() => {
    if (primaryColor && colorEntry.color !== primaryColor) {
      const found = MOTORCYCLE_COLORS.find((c) => c.color === primaryColor);
      setColorEntry(found ?? { label: 'Custom', color: primaryColor, accent: '#666' });
    }
  }, [primaryColor]);

  const initScene = useCallback(async (color: string) => {
    const container = containerRef.current;
    if (!container || Platform.OS !== 'web') return;

    // Cleanup previous
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    stateRef.current = null;

    try {
      setStatus('loading');
      const THREE = await loadThree();
      if (!THREE) { setStatus('error'); return; }

      const GLTFLoader = THREE.GLTFLoader || (window as any).THREE?.GLTFLoader;
      if (!GLTFLoader) { setStatus('error'); return; }

      const w = container.clientWidth || 380;
      const h = container.clientHeight || height;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.LinearToneMapping;
      renderer.toneMappingExposure = 1.6;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050508);

      // Fake env map from colored spheres
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0a0a12);
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd8a9 }));
      s1.position.set(6, 12, 5); envScene.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0x5577ff }));
      s2.position.set(-8, 6, -5); envScene.add(s2);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      s3.position.set(0, 8, -10); envScene.add(s3);
      const envMap = pmrem.fromScene(envScene, 0, 0.1).texture;
      pmrem.dispose();

      // Camera
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 30);
      camera.position.set(2.8, 0.5, 3.5);
      camera.lookAt(0, 0.2, 0.4);

      // Lights
      scene.add(new THREE.AmbientLight(0x404040, 0.8));
      const keyLight = new THREE.DirectionalLight(0xcc9960, 3.5);
      keyLight.position.set(5, 8, 5); keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024; keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x20200c, 3);
      rimLight.position.set(-6, 6, -6); scene.add(rimLight);
      const fillLight = new THREE.DirectionalLight(0xebc000, 0.8);
      fillLight.position.set(2, -2, 4); scene.add(fillLight);
      const backLight = new THREE.DirectionalLight(0xccccff, 0.6);
      backLight.position.set(-4, 3, 6); scene.add(backLight);
      const pointLight = new THREE.PointLight(0xffffff, 2, 10);
      pointLight.position.set(1, 4, 3); scene.add(pointLight);

      // State object
      const st: any = {
        rotY: 0.4, rotX: 0.06, autoRot: true, drag: false, lx: 0, ly: 0,
        aTimer: null, bikeGroup: new THREE.Group(), renderer, scene, camera,
        currentColor: color, cameraTween: null, engineState: 'ENGINE_OFF',
        livingTime: 0, prevEngineOn: false, prevRpm: 0,
        keyLight, rimLight, fillLight, envMapIntensityBase: 1.6,
        lowerY: -0.3, frontWheelPos: null, rearWheelPos: null,
        wheelRadius: 0.15, rimRatio: 0.75, isZLong: true, envMap,
        _velgMeshes: [],
      };
      st.bikeGroup.scale.set(1.5, 1.5, 1.5);
      st.bikeGroup.position.y = st.lowerY;
      scene.add(st.bikeGroup);
      stateRef.current = st;

      // Load GLB
      const url = modelUrl ?? resolveBikeModelUrl(bikeName);
      const config = resolveBikeConfig(bikeName);
      const bodyColor = new THREE.Color(color);
      const accentColor = new THREE.Color(MOTORCYCLE_COLORS.find((c) => c.color === color)?.accent ?? '#666');

      const cached = getCachedGLB(url);
      const loadModel = (gltfScene: any) => {
        try {
          positionModel(gltfScene, THREE, config);
          applyPBR(gltfScene, config, bodyColor, accentColor, envMap, partColorsRef, garageFinish, st, THREE);
          // Detect wheel positions
          const primary = findPrimaryMesh(gltfScene, THREE);
          if (primary) {
            primary.geometry.computeBoundingBox();
            const bb = primary.geometry.boundingBox!;
            const size = bb.getSize(new THREE.Vector3());
            const center = bb.getCenter(new THREE.Vector3());
            st.isZLong = size.z > size.x;
            const n = st.isZLong ? size.x : size.z;
            st.wheelRadius = 0.48 * n;
            const name = bikeName.toLowerCase();
            const isScooter = name.includes('vario') || name.includes('aerox') || name.includes('nmax') || name.includes('supra') || name.includes('revo') || name.includes('scoot') || name.includes('beat') || name.includes('filano');
            const isBebek = name.includes('supra') || name.includes('revo') || name.includes('f1zr');
            st.rimRatio = isBebek ? 0.86 : isScooter ? 0.68 : 0.76;
            const minY = bb.min.y + st.wheelRadius;
            const offset = 0.38 * (st.isZLong ? size.z : size.x);
            if (st.isZLong) {
              st.frontWheelPos = new THREE.Vector3(center.x, minY, center.z + offset);
              st.rearWheelPos = new THREE.Vector3(center.x, minY, center.z - offset);
            } else {
              st.frontWheelPos = new THREE.Vector3(center.x + offset, minY, center.z);
              st.rearWheelPos = new THREE.Vector3(center.x - offset, minY, center.z);
            }
          }
          if (!st.frontWheelPos) st.frontWheelPos = new THREE.Vector3(0, 0.1, 0.5);
          if (!st.rearWheelPos) st.rearWheelPos = new THREE.Vector3(0, 0.1, -0.5);
          st.bikeGroup.add(gltfScene);
          setStatus('ready');
        } catch (e) {
          console.error('[3D] model setup error:', e);
          setStatus('error');
        }
      };

      if (cached) {
        loadModel(cached.clone(true));
      } else {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf: any) => {
            if (bikeNameRef.current !== bikeName) return;
            setCachedGLB(url, gltf.scene.clone(true));
            loadModel(gltf.scene);
          },
          undefined,
          (err: any) => { console.warn('[3D] GLB load error:', err); setStatus('error'); },
        );
      }

      // Pointer drag
      const getXY = (e: any) => e.touches ? e.touches[0] : e;
      const onDown = (e: any) => { st.drag = true; st.autoRot = false; const p = getXY(e); st.lx = p.clientX; st.ly = p.clientY; renderer.domElement.style.cursor = 'grabbing'; };
      const onMove = (e: any) => { if (!st.drag) return; const p = getXY(e); st.rotY += 0.011 * (p.clientX - st.lx); st.rotX = Math.max(-0.48, Math.min(0.65, st.rotX + 0.006 * (p.clientY - st.ly))); st.lx = p.clientX; st.ly = p.clientY; };
      const onUp = () => { st.drag = false; renderer.domElement.style.cursor = 'grab'; clearTimeout(st.aTimer); st.aTimer = setTimeout(() => { st.autoRot = true; }, 3500); };
      renderer.domElement.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
      renderer.domElement.addEventListener('touchmove', onMove, { passive: true });
      renderer.domElement.addEventListener('touchend', onUp);

      // Render loop
      let rafId = 0;
      let prevTime = performance.now();
      const tick = () => {
        rafId = requestAnimationFrame(tick);
        const s = stateRef.current;
        if (!s) return;
        const now = performance.now();
        const dt = Math.min((now - prevTime) / 1000, 0.05);
        prevTime = now;
        s.livingTime += dt;
        s.engineState = nextEngineState(s.engineState, engineOnRef.current, rpmRef.current);
        s.autoRot && (s.rotY += 0.004);
        const deltas = computeFrameDeltas(s.engineState, rpmRef.current, s.livingTime, new THREE.Color(s.currentColor));
        s.bikeGroup.position.x = deltas.position.x;
        s.bikeGroup.position.y = s.lowerY + deltas.position.y;
        s.bikeGroup.position.z = deltas.position.z;
        s.bikeGroup.rotation.y = s.rotY + deltas.rotation.y;
        s.bikeGroup.rotation.x = s.rotX + deltas.rotation.x;
        if (!s.cameraTween) {
          if (s.autoRot) {
            const t = 0.1 * s.livingTime;
            const r = 3.5 + 0.5 * Math.sin(0.5 * t);
            camera.position.set(Math.cos(0.5 * s.rotY) * r, 0.5 + 0.2 * Math.cos(0.8 * t), Math.sin(0.5 * s.rotY) * r);
            camera.lookAt(0, 0.2, 0);
          } else {
            camera.position.set(2.8, 0.5 + 0.2 * deltas.cameraTilt, 3.5 + 0.05 * (deltas.cameraZoom - 1));
            camera.lookAt(0, 0.2, 0.4);
          }
        } else {
          s.cameraTween.progress += 0.035;
          if (s.cameraTween.progress >= 1) {
            camera.position.copy(s.cameraTween.toPos);
            camera.fov = s.cameraTween.toFov;
            camera.updateProjectionMatrix();
            s.cameraTween = null;
          } else {
            const t = 1 - Math.pow(1 - s.cameraTween.progress, 3);
            camera.position.lerpVectors(s.cameraTween.fromPos, s.cameraTween.toPos, t);
            camera.fov = s.cameraTween.fromFov + (s.cameraTween.toFov - s.cameraTween.fromFov) * t;
            camera.updateProjectionMatrix();
          }
        }
        keyLight.intensity = 2.5 * deltas.keyLightIntensity;
        rimLight.intensity = 1.6 * deltas.rimLightIntensity;
        fillLight.intensity = 0.8 * deltas.fillLightIntensity;
        onPulseRef.current?.(deltas.rpmPulse, deltas.engineGlow);
        renderer.render(scene, camera);
      };
      tick();

      // Resize
      const onResize = () => {
        const nw = container.clientWidth || w;
        const nh = container.clientHeight || h;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        clearTimeout(st.aTimer);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        renderer.domElement.removeEventListener('mousedown', onDown);
        renderer.domElement.removeEventListener('touchstart', onDown);
        renderer.domElement.removeEventListener('touchend', onUp);
        renderer.domElement.removeEventListener('touchmove', onMove);
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        stateRef.current = null;
      };
    } catch (e) {
      console.error('[3D] FATAL initScene:', e);
      setStatus('error');
    }
  }, [bikeName, modelUrl, height]);

  // Init / reinit when bike changes
  useEffect(() => {
    bikeNameRef.current = bikeName;
    if (Platform.OS === 'web') initScene(colorEntry.color);
    return () => { cleanupRef.current?.(); cleanupRef.current = null; };
  }, [bikeName, modelUrl]);

  // Color change
  useEffect(() => {
    const s = stateRef.current;
    if (!s || status !== 'ready') return;
    s.currentColor = colorEntry.color;
    s.bikeGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        if (obj.material.userData?.uTargetColor) {
          obj.material.userData.uTargetColor.value.set(colorEntry.color);
          obj.material.uniformsNeedUpdate = true;
        } else if (obj.material.color) {
          obj.material.color.set(colorEntry.color);
        }
      }
    });
  }, [colorEntry.color, status]);

  // Garage colors sync
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !garageColors) return;
    s.bikeGroup.traverse((obj: any) => {
      if (!obj.isMesh || !obj.material) return;
      const zone = PART_TO_GARAGE_ZONE[obj.userData.partType ?? ''];
      if (zone && garageColors[zone]) {
        if (obj.material.userData?.uTargetColor) {
          obj.material.userData.uTargetColor.value.set(garageColors[zone]);
        } else if (obj.material.color) {
          obj.material.color.set(garageColors[zone]);
        }
      }
    });
  }, [garageColors]);

  // Finish change
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const preset = FINISH_PRESETS[garageFinish] ?? FINISH_PRESETS.glossy;
    s.bikeGroup.traverse((obj: any) => {
      if (!obj.isMesh || !obj.material || obj.userData.partType !== 'body') return;
      obj.material.roughness = preset.roughness;
      obj.material.metalness = preset.metalness;
      obj.material.envMapIntensity = preset.env;
      obj.material.needsUpdate = true;
    });
  }, [garageFinish]);

  // Camera zone tween
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !selectedZone) return;
    const preset = ZONE_CAMERA[selectedZone];
    if (!preset) return;
    const THREE = (window as any).THREE;
    if (!THREE) return;
    s.cameraTween = {
      fromPos: s.camera.position.clone(),
      toPos: new THREE.Vector3(...preset.pos),
      fromFov: s.camera.fov,
      toFov: preset.fov,
      progress: 0,
    };
    // Zone light color
    s.scene.traverse((obj: any) => {
      if (!obj.isDirectionalLight) return;
      if (selectedZone === 'wheels_zone') obj.color.setHex(0xeedd77);
      else if (selectedZone === 'performance_zone') obj.color.setHex(0xffee88);
      else obj.color.setHex(0xffffff);
    });
  }, [selectedZone]);

  const bikeLabel = getBikeLabel(bikeName);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>3D preview tersedia di web</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <div ref={containerRef} style={canvasStyle} />
      {status === 'loading' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#EBB040" />
          <Text style={styles.overlayText}>Loading {bikeLabel}...</Text>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.overlay}>
          <Text style={[styles.overlayText, { color: '#ff4444' }]}>Model Load Error</Text>
          <Text style={[styles.overlayText, { fontSize: 10, opacity: 0.5 }]}>tap to retry</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#050508' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 },
  overlayText: { color: '#888', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
});
