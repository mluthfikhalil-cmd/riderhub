import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Configurator'>;

const COLORS = [
  { id: 'red',    label: 'Racing Red',    hex: '#CC0000' },
  { id: 'black',  label: 'Stealth Black', hex: '#111111' },
  { id: 'white',  label: 'Pearl White',   hex: '#F5F5F5' },
  { id: 'blue',   label: 'Ocean Blue',    hex: '#0055AA' },
  { id: 'green',  label: 'Neon Green',    hex: '#00D67D' },
  { id: 'orange', label: 'Sunset Orange', hex: '#FF6600' },
];

const VELGS = [
  { id: 'sport',   label: 'Sport Racing', spokes: 5,  desc: 'Y-spoke alloy' },
  { id: 'classic', label: 'Classic Wire', spokes: 36, desc: 'Wire 36-spoke' },
  { id: 'retro',   label: 'Retro Solid',  spokes: 0,  desc: 'Solid disc' },
  { id: 'multi',   label: 'Multi-Spoke',  spokes: 10, desc: '10-spoke alloy' },
];

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

let threePromise: Promise<any> | null = null;
const loadThree = (): Promise<any> => {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  if ((window as any).THREE) return Promise.resolve((window as any).THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = THREE_CDN;
    s.async = true;
    s.onload = () => resolve((window as any).THREE);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return threePromise;
};

interface SceneHandle {
  setColor: (hex: string) => void;
  setVelg: (spokes: number) => void;
  dispose: () => void;
}

const buildScene = (canvas: HTMLCanvasElement, THREE: any): SceneHandle => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(3, 1.5, 3);
  camera.lookAt(0, 0.5, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dl = new THREE.DirectionalLight(0xffffff, 1);
  dl.position.set(5, 5, 5);
  scene.add(dl);
  const rl = new THREE.DirectionalLight(0x4488ff, 0.3);
  rl.position.set(-3, 2, -3);
  scene.add(rl);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7, roughness: 0.3 });
  const bodyGroup = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.7), bodyMat);
  body.position.set(0, 0.7, 0);
  bodyGroup.add(body);

  const tankG = new THREE.SphereGeometry(0.4, 16, 16);
  tankG.scale(1.2, 0.8, 0.9);
  const tank = new THREE.Mesh(tankG, bodyMat);
  tank.position.set(0.2, 1.05, 0);
  bodyGroup.add(tank);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
  );
  seat.position.set(-0.3, 1.05, 0);
  bodyGroup.add(seat);

  const hb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 }),
  );
  hb.position.set(0.7, 1.2, 0);
  hb.rotation.x = Math.PI / 2;
  bodyGroup.add(hb);

  const fork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }),
  );
  fork.position.set(0.75, 0.6, 0);
  fork.rotation.z = 0.3;
  bodyGroup.add(fork);

  const eng = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 }),
  );
  eng.position.set(0.1, 0.4, 0);
  bodyGroup.add(eng);

  const ex = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 1.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 }),
  );
  ex.position.set(-0.5, 0.3, 0.3);
  ex.rotation.z = Math.PI / 2;
  bodyGroup.add(ex);
  scene.add(bodyGroup);

  let wheelGroup: any;
  const buildWheels = (spokeCount: number) => {
    if (wheelGroup) scene.remove(wheelGroup);
    wheelGroup = new THREE.Group();
    [-0.8, 0.8].forEach((x) => {
      const wg = new THREE.Group();
      wg.add(new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.1, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
      ));
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.03, 8, 32),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 }),
      );
      wg.add(rim);
      if (spokeCount > 0 && spokeCount <= 10) {
        for (let i = 0; i < spokeCount; i++) {
          const a = (i / spokeCount) * Math.PI * 2;
          const s = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.025, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9 }),
          );
          s.position.set(0, Math.sin(a) * 0.13, Math.cos(a) * 0.13);
          s.rotation.x = a;
          wg.add(s);
        }
      } else if (spokeCount > 10) {
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const s = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }),
          );
          s.position.set(0, Math.sin(a) * 0.12, Math.cos(a) * 0.12);
          s.rotation.x = a + Math.PI / 2;
          wg.add(s);
        }
      } else {
        const d = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }),
        );
        d.rotation.x = Math.PI / 2;
        wg.add(d);
      }
      wg.children.forEach((c: any) => { c.rotation.y = Math.PI / 2; });
      wg.position.set(x, 0.35, 0);
      wheelGroup.add(wg);
    });
    wheelGroup.rotation.y = bodyGroup.rotation.y;
    scene.add(wheelGroup);
  };
  buildWheels(5);

  let drag = false, lx = 0;
  const onDown = (e: PointerEvent) => { drag = true; lx = e.clientX; canvas.style.cursor = 'grabbing'; };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - lx;
    bodyGroup.rotation.y += dx * 0.01;
    if (wheelGroup) wheelGroup.rotation.y += dx * 0.01;
    lx = e.clientX;
  };
  const onUp = () => { drag = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  let rafId = 0;
  const tick = () => {
    rafId = requestAnimationFrame(tick);
    if (!drag) {
      bodyGroup.rotation.y += 0.003;
      if (wheelGroup) wheelGroup.rotation.y += 0.003;
    }
    renderer.render(scene, camera);
  };
  tick();

  const onResize = () => {
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  };
  window.addEventListener('resize', onResize);

  return {
    setColor: (hex: string) => bodyMat.color.set(hex),
    setVelg: (spokes: number) => buildWheels(spokes),
    dispose: () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
};

const canvasStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block', cursor: 'grab' };

export default function ConfiguratorScreen({ navigation }: Props) {
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [activeVelg, setActiveVelg] = useState(VELGS[0]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(Platform.OS === 'web' ? 'loading' : 'error');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    loadThree().then((THREE) => {
      if (cancelled) return;
      if (!THREE) { setStatus('error'); return; }
      const canvas = canvasRef.current;
      if (!canvas) { setStatus('error'); return; }
      try {
        sceneRef.current = buildScene(canvas, THREE);
        setStatus('ready');
      } catch (e) {
        console.error('[Configurator] scene build failed:', e);
        setStatus('error');
      }
    });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { sceneRef.current?.setColor(activeColor.hex); }, [activeColor]);
  useEffect(() => { sceneRef.current?.setVelg(activeVelg.spokes); }, [activeVelg]);

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={ts.title}>3D Configurator</Text>
          <Text style={ts.subtitle}>Customize Your Ride</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={ts.canvasContainer}>
        {Platform.OS === 'web' ? (
          <>
            <canvas ref={canvasRef} style={canvasStyle} />
            {status !== 'ready' && (
              <View style={ts.canvasOverlay}>
                <Text style={ts.canvasOverlayText}>
                  {status === 'loading' ? 'Loading 3D engine...' : 'Failed to load 3D preview.'}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={ts.canvasOverlay}>
            <MaterialCommunityIcons name="laptop" size={32} color={colors.textMuted} />
            <Text style={ts.canvasOverlayText}>3D preview hanya tersedia di web.</Text>
          </View>
        )}
      </View>

      <ScrollView style={ts.controls} showsVerticalScrollIndicator={false}>
        <Text style={ts.sectionLabel}>BODY COLOR</Text>
        <View style={ts.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setActiveColor(c)}
              style={[ts.colorSwatch, { backgroundColor: c.hex }, activeColor.id === c.id && ts.colorActive]}
            />
          ))}
        </View>
        <Text style={ts.colorName}>{activeColor.label}</Text>

        <Text style={ts.sectionLabel}>WHEEL STYLE</Text>
        <View style={ts.velgRow}>
          {VELGS.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setActiveVelg(v)}
              style={[ts.velgCard, activeVelg.id === v.id && ts.velgActive]}
            >
              <MaterialCommunityIcons
                name={v.spokes === 0 ? 'circle-slice-8' : v.spokes > 10 ? 'tire' : 'steering'}
                size={28}
                color={activeVelg.id === v.id ? colors.accent : colors.textSecondary}
              />
              <Text style={[ts.velgLabel, activeVelg.id === v.id && ts.velgLabelActive]}>{v.label}</Text>
              <Text style={ts.velgDesc}>{v.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center' },
  canvasContainer: { height: 300, marginHorizontal: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: '#080808', position: 'relative' },
  canvasOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 8 },
  canvasOverlayText: { color: colors.textSecondary, fontSize: 12 },
  controls: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2, fontWeight: '700', marginBottom: spacing.sm },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xs },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  colorActive: { borderColor: colors.accent, borderWidth: 3 },
  colorName: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.lg },
  velgRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  velgCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  velgActive: { borderColor: colors.accent, backgroundColor: 'rgba(0,214,125,0.05)' },
  velgLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  velgLabelActive: { color: colors.accent },
  velgDesc: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
});
