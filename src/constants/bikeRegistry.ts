// Bike registry — ported from live bundle module 634
// Maps bike display name → GLB path + specs + material hints

export interface BikeSpec {
  power: string;
  torque: string;
  weight: string;
  topSpeed: string;
  engine: string;
}

export interface BikeConfig {
  url: string;
  bodyType: 'sport' | 'naked' | 'retro' | 'scooter';
  label: string;
  scale: number;
  offsetY: number;
  splitThresholds?: { tireY: number; seatY: number };
  bodyMatIndices?: number[];
  keepMatIndices?: number[];
  accentMatIndices?: number[];
  bodyMatNames?: string[];
  specs?: BikeSpec;
}

export const BIKE_REGISTRY: Record<string, BikeConfig> = {
  'Kawasaki Ninja 250': {
    url: '/models/meshy/kawasaki-ninja.glb',
    bodyType: 'sport',
    label: 'NINJA 250',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.3, seatY: 0.21 },
    specs: { power: '39 PS', torque: '23.5 Nm', weight: '163 kg', topSpeed: '175 km/h', engine: '249 cc Parallel-Twin' },
  },
  'Kawasaki KLX': {
    url: '/models/meshy/dual-sport.glb',
    bodyType: 'naked',
    label: 'KLX',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.32, seatY: 0.23 },
    specs: { power: '12 PS', torque: '11.3 Nm', weight: '118 kg', topSpeed: '110 km/h', engine: '144 cc Air-cooled Single' },
  },
  'Yamaha F1ZR': {
    url: '/models/meshy/orange-scooter.glb',
    bodyType: 'retro',
    label: 'F1ZR',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.31, seatY: 0.22 },
    specs: { power: '11.8 PS', torque: '10.7 Nm', weight: '95 kg', topSpeed: '115 km/h', engine: '110 cc 2-Stroke Single' },
  },
  'Honda Supra X 125': {
    url: '/models/meshy/supra.glb',
    bodyType: 'scooter',
    label: 'SUPRA X 125',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.34, seatY: 0.24 },
    specs: { power: '10.1 PS', torque: '9.3 Nm', weight: '106 kg', topSpeed: '105 km/h', engine: '124.8 cc SOHC eSP' },
  },
  'Honda Revo': {
    url: '/models/meshy/revo.glb',
    bodyType: 'scooter',
    label: 'REVO',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.34, seatY: 0.24 },
    specs: { power: '8.9 PS', torque: '8.7 Nm', weight: '98 kg', topSpeed: '100 km/h', engine: '109.1 cc SOHC Single' },
  },
  'Vespa Super': {
    url: '/models/meshy/vespa-super.glb',
    bodyType: 'retro',
    label: 'VESPA SUPER',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.31, seatY: 0.23 },
    specs: { power: '7.7 hp', torque: '11 Nm', weight: '100 kg', topSpeed: '90 km/h', engine: '150 cc 2-Stroke Single' },
  },
  'Vespa Sprint': {
    url: '/models/meshy/vespa-sprint.glb',
    bodyType: 'retro',
    label: 'VESPA SPRINT',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.31, seatY: 0.23 },
    specs: { power: '12.7 hp', torque: '12.8 Nm', weight: '117 kg', topSpeed: '110 km/h', engine: '154.8 cc i-Get 4-Stroke' },
  },
  'Ducati Panigale V4': {
    url: '/models/meshy/panigale.glb',
    bodyType: 'sport',
    label: 'PANIGALE V4',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.298, seatY: 0.213 },
    specs: { power: '215.5 hp', torque: '123.6 Nm', weight: '172 kg', topSpeed: '299+ km/h', engine: '1,103 cc V4 Desmosedici Stradale' },
  },
  'Ducati Monster': {
    url: '/models/meshy/monster.glb',
    bodyType: 'naked',
    label: 'MONSTER',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.275, seatY: 0.207 },
    specs: { power: '111 hp', torque: '93 Nm', weight: '166 kg', topSpeed: '250 km/h', engine: '937 cc Testastretta 11°' },
  },
  'Kawasaki Z900': {
    url: '/models/meshy/z900extreme.glb',
    bodyType: 'naked',
    label: 'Z900',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.28, seatY: 0.205 },
    specs: { power: '125 PS', torque: '98.6 Nm', weight: '212 kg', topSpeed: '240 km/h', engine: '948 cc Inline-Four' },
  },
  'Honda CB650R': {
    url: '/models/meshy/cb650r.glb',
    bodyType: 'naked',
    label: 'CB650R',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.405, seatY: 0.196 },
    specs: { power: '91.1 hp', torque: '63 Nm', weight: '203 kg', topSpeed: '220 km/h', engine: '649 cc Inline-Four' },
  },
  'Kawasaki W175': {
    url: '/models/meshy/orange.glb',
    bodyType: 'retro',
    label: 'W175 SE',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.315, seatY: 0.225 },
    specs: { power: '13 PS', torque: '13.2 Nm', weight: '126 kg', topSpeed: '110 km/h', engine: '177 cc Single SOHC' },
  },
  'Yamaha Fazzio': {
    url: '/models/meshy/retroscoot.glb',
    bodyType: 'retro',
    label: 'FAZZIO',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.33, seatY: 0.235 },
    specs: { power: '8.3 hp', torque: '10.6 Nm', weight: '95 kg', topSpeed: '95 km/h', engine: '124.8 cc Blue Core Hybrid' },
  },
  'Honda Vario 125': {
    url: '/models/meshy/vario125.glb',
    bodyType: 'scooter',
    label: 'VARIO 125',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.35, seatY: 0.25 },
    specs: { power: '11.1 hp', torque: '10.8 Nm', weight: '112 kg', topSpeed: '105 km/h', engine: '124.8 cc eSP' },
  },
  'Yamaha Aerox': {
    url: '/models/meshy/azureblaze.glb',
    bodyType: 'scooter',
    label: 'AEROX 155',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.345, seatY: 0.245 },
    specs: { power: '15.1 hp', torque: '13.9 Nm', weight: '122 kg', topSpeed: '120 km/h', engine: '155 cc Blue Core VVA' },
  },
  'Yamaha Grand Filano': {
    url: '/models/meshy/blushpink.glb',
    bodyType: 'scooter',
    label: 'GRAND FILANO',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.34, seatY: 0.245 },
    specs: { power: '8.1 hp', torque: '10.4 Nm', weight: '100 kg', topSpeed: '95 km/h', engine: '124.8 cc Blue Core Hybrid' },
  },
  'Yamaha NMAX': {
    url: '/models/meshy/yam70cc.glb',
    bodyType: 'scooter',
    label: 'NMAX 155',
    scale: 2,
    offsetY: 0.02,
    splitThresholds: { tireY: -0.345, seatY: 0.25 },
    specs: { power: '15.1 hp', torque: '13.9 Nm', weight: '130 kg', topSpeed: '125 km/h', engine: '155 cc Blue Core VVA' },
  },
};

export const BIKE_NAMES = Object.keys(BIKE_REGISTRY);

export const detectBodyType = (bikeName: string): BikeConfig['bodyType'] => {
  const n = bikeName.toLowerCase();
  if (n.includes('scooter') || n.includes('vario') || n.includes('aerox') ||
      n.includes('filano') || n.includes('nmax') || n.includes('supra') || n.includes('revo'))
    return 'scooter';
  if (n.includes('fazzio') || n.includes('w175') || n.includes('f1zr') || n.includes('vespa'))
    return 'retro';
  if (n.includes('monster') || n.includes('z900') || n.includes('cb650') || n.includes('klx'))
    return 'naked';
  return 'sport';
};

export const resolveBikeConfig = (bikeName: string): BikeConfig =>
  BIKE_REGISTRY[bikeName] ?? {
    url: resolveBikeModelUrl(bikeName),
    bodyType: 'sport',
    label: bikeName.toUpperCase(),
    scale: 2,
    offsetY: 0.02,
  };

export const resolveBikeModelUrl = (bikeName: string): string =>
  BIKE_REGISTRY[bikeName]?.url ?? '/models/meshy/panigale.glb';

export const getBikeLabel = (bikeName: string): string =>
  BIKE_REGISTRY[bikeName]?.label ?? bikeName.toUpperCase();

// Simple LRU cache for loaded GLB scenes (max 2 entries)
const glbCache = new Map<string, { scene: any; lastAccess: number }>();
const MAX_CACHE = 2;

const evictOldest = () => {
  if (glbCache.size < MAX_CACHE) return;
  let oldest: string | null = null;
  let oldestTime = Infinity;
  for (const [key, val] of glbCache) {
    if (val.lastAccess < oldestTime) { oldestTime = val.lastAccess; oldest = key; }
  }
  if (oldest) {
    const entry = glbCache.get(oldest)!;
    entry.scene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m: any) => {
          ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'].forEach((k) => m[k]?.dispose());
          m.dispose();
        });
      }
    });
    glbCache.delete(oldest);
  }
};

export const getCachedGLB = (url: string): any | null => {
  const entry = glbCache.get(url);
  if (entry) { entry.lastAccess = Date.now(); return entry.scene; }
  return null;
};

export const setCachedGLB = (url: string, scene: any): void => {
  evictOldest();
  glbCache.set(url, { scene, lastAccess: Date.now() });
};
