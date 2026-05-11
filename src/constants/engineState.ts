// Engine state machine — ported from live bundle module 637
// Handles RPM-based camera shake, color lerp, light intensity

// Three.js is loaded lazily on web — we import types only
// Actual THREE object is passed in at runtime

export type EngineState = 'ENGINE_OFF' | 'ENGINE_ON' | 'HIGH_RPM';

export const RPM_HIGH_THRESHOLD = 4000;

export const nextEngineState = (
  current: EngineState,
  engineOn: boolean,
  rpm: number,
): EngineState => {
  if (!engineOn) return 'ENGINE_OFF';
  if (current === 'ENGINE_OFF') return 'ENGINE_ON';
  if (rpm >= RPM_HIGH_THRESHOLD) return 'HIGH_RPM';
  return 'ENGINE_ON';
};

// Compute per-frame deltas for camera + lights based on engine state
export const computeFrameDeltas = (
  state: EngineState,
  rpm: number,
  time: number,
  bodyColor: any, // THREE.Color
) => {
  const shake = computeShake(state, time);
  const zoom = computeZoom(state, time);
  const lights = computeLights(state, bodyColor);
  const pulse = computePulse(state, rpm, time);
  return { ...shake, ...zoom, ...lights, ...pulse };
};

function computeShake(state: EngineState, t: number) {
  const pos = { x: 0, y: 0, z: 0 };
  const rot = { x: 0, y: 0, z: 0 };
  if (state === 'ENGINE_OFF') return { position: pos, rotation: rot };
  const f = state === 'HIGH_RPM' ? 1.5 : 1;
  pos.x = (4e-4 * Math.sin(37.7 * t + 1.3) + 3e-4 * Math.sin(53.2 * t + 4.7)) * f;
  pos.y = (5e-4 * Math.sin(41.3 * t + 2.1) + 3e-4 * Math.sin(59.7 * t + 0.8)) * f;
  pos.z = (3e-4 * Math.sin(33.1 * t + 5.9) + 2e-4 * Math.sin(48.9 * t + 3.2)) * f;
  pos.y += 0.001 * Math.sin(2.5 * t + 0.3) * f;
  rot.y += 8e-4 * Math.sin(1.8 * t + 2.7) * f;
  return { position: pos, rotation: rot };
}

function computeZoom(state: EngineState, t: number) {
  const n = state === 'ENGINE_OFF' ? 0.25 : 0.35;
  return {
    cameraZoom: 1 + 0.025 * Math.sin(t * n + 0.5),
    cameraTilt: 0.004 * Math.sin(0.2 * t + 1.8),
  };
}

function computeLights(state: EngineState, color: any) {
  let key = 1, rim = 1, fill = 1, env = 1;
  switch (state) {
    case 'ENGINE_OFF': key = 0.85; rim = 0.8; fill = 0.85; env = 0.9; break;
    case 'ENGINE_ON':  key = 1.05; rim = 1.05; fill = 1.0; env = 1.05; break;
    case 'HIGH_RPM':   key = 1.15; rim = 1.2; fill = 0.95; env = 1.15; break;
  }
  if (color?.getHSL) {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    env *= 1 + 0.05 * (hsl.h - 0.5);
  }
  return { keyLightIntensity: key, rimLightIntensity: rim, fillLightIntensity: fill, envMapIntensity: env };
}

function computePulse(state: EngineState, rpm: number, t: number) {
  if (state === 'ENGINE_OFF') return { rpmPulse: 0, engineGlow: 0 };
  const speed = 1 + (rpm / 12000) * 4;
  const amp = state === 'HIGH_RPM' ? 0.08 : 0.04;
  const rpmPulse = 0.5 + Math.sin(t * speed * Math.PI * 2) * amp;
  const engineGlow = state === 'HIGH_RPM' ? 0.3 : 0.15;
  return { rpmPulse, engineGlow };
}

// Color lerp helpers
export interface ColorLerp {
  current: any; // THREE.Color
  target: any;  // THREE.Color
  progress: number;
  duration: number;
}

export const initColorLerp = (THREE: any, from: string, to: string, duration = 0.4): ColorLerp => ({
  current: new THREE.Color(from),
  target: new THREE.Color(to),
  progress: 0,
  duration,
});

export const advanceColorLerp = (lerp: ColorLerp, dt: number): any => {
  if (lerp.progress >= 1) return lerp.target.clone();
  lerp.progress += dt / lerp.duration;
  if (lerp.progress >= 1) { lerp.progress = 1; lerp.current.copy(lerp.target); return lerp.target.clone(); }
  const t = 1 - Math.pow(1 - lerp.progress, 3);
  lerp.current.lerpColors(lerp.current.clone(), lerp.target, t);
  return lerp.current.clone();
};

export const isColorLerpComplete = (lerp: ColorLerp): boolean => lerp.progress >= 1;
