// Zone meta — ported from live bundle module 636
// Defines garage customization zones, colors, finishes, camera presets

export const GARAGE_ZONES = ['body_zone', 'wheels_zone', 'performance_zone'] as const;
export type GarageZone = typeof GARAGE_ZONES[number];

export const PART_TO_GARAGE_ZONE: Record<string, GarageZone> = {
  body: 'body_zone',
  seat: 'body_zone',
  tank: 'body_zone',
  fender: 'body_zone',
  windscreen: 'body_zone',
  unknown: 'body_zone',
};

export const FINISH_OPTIONS = [
  { id: 'glossy',         name: 'Glossy',         icon: 'circle' },
  { id: 'matte',          name: 'Matte',           icon: 'circle-outline' },
  { id: 'carbon',         name: 'Carbon Fiber',    icon: 'grid' },
  { id: 'racing_stripes', name: 'Racing Stripes',  icon: 'minus' },
] as const;
export type FinishId = typeof FINISH_OPTIONS[number]['id'];

export interface ColorOption { name: string; hex: string; }

export interface BodyZoneMeta {
  label: string; labelId: string; icon: string;
  defaultColor: string; availableColors: ColorOption[];
  roughness: number; metalness: number; envIntensity: number;
}

export interface WheelsZoneMeta {
  label: string; labelId: string; icon: string;
  defaultColor: string; availableColors: ColorOption[];
  roughness: number; metalness: number; envIntensity: number;
  items?: WheelItem[];
}

export interface WheelItem { id: string; name: string; glb?: string; }

export interface UpgradeTier { level: number; label: string; statBonus: { stat: string; value: number }[]; }
export interface Upgrade { id: string; name: string; icon: string; currentTier: number; tiers: UpgradeTier[]; }

export interface PerformanceZoneMeta {
  label: string; labelId: string; icon: string;
  upgrades: Upgrade[];
}

export const ZONE_META: {
  body_zone: BodyZoneMeta;
  wheels_zone: WheelsZoneMeta;
  performance_zone: PerformanceZoneMeta;
} = {
  body_zone: {
    label: 'Body & Fairing', labelId: 'BODY', icon: 'motorbike-outline',
    defaultColor: '#CD202C',
    availableColors: [
      { name: 'Racing Red',    hex: '#C41E1E' },
      { name: 'Ducati Red',    hex: '#CD202C' },
      { name: 'Mustard Yellow',hex: '#EBB040' },
      { name: 'Electric Blue', hex: '#1E7FC4' },
      { name: 'Emerald Green', hex: '#1B8C4A' },
      { name: 'Matte Black',   hex: '#1A1A1A' },
      { name: 'Pearl White',   hex: '#F0F0F0' },
      { name: 'Matte Grey',    hex: '#4A4A4A' },
      { name: 'Orange Fury',   hex: '#FF6B35' },
      { name: 'Deep Purple',   hex: '#5B2C8E' },
      { name: 'Lime Green',    hex: '#7FFF00' },
      { name: 'Matte Olive',   hex: '#6B8E23' },
    ],
    roughness: 0.25, metalness: 0.15, envIntensity: 1.8,
  },
  wheels_zone: {
    label: 'Velg & Rim', labelId: 'WHEELS', icon: 'circle-outline',
    defaultColor: '#888888',
    availableColors: [
      { name: 'Stock',        hex: '#888888' },
      { name: 'Gloss Black',  hex: '#111111' },
      { name: 'Chrome',       hex: '#D4D4D4' },
      { name: 'Gold',         hex: '#C8A84B' },
      { name: 'Gunmetal',     hex: '#3D3D3D' },
      { name: 'Bronze',       hex: '#8B6914' },
      { name: 'Racing Red',   hex: '#CC1010' },
      { name: 'Electric Blue',hex: '#1E7FC4' },
      { name: 'Neon Green',   hex: '#00D67D' },
      { name: 'Rose Gold',    hex: '#B76E79' },
      { name: 'Titanium',     hex: '#878681' },
      { name: 'Midnight Blue',hex: '#0D1B4B' },
    ],
    roughness: 0.05, metalness: 0.95, envIntensity: 2.5,
    // Velg GLB items — populated when velg files are available
    items: [],
  },
  performance_zone: {
    label: 'Upgrade Mesin', labelId: 'PERFORMANCE', icon: 'flash-outline',
    upgrades: [
      {
        id: 'engine', name: 'Engine', icon: 'engine-outline', currentTier: 0,
        tiers: [
          { level: 0, label: 'Stock',   statBonus: [] },
          { level: 1, label: 'Stage 1', statBonus: [{ stat: 'HP', value: 15 }, { stat: 'Torque', value: 10 }] },
          { level: 2, label: 'Stage 2', statBonus: [{ stat: 'HP', value: 35 }, { stat: 'Torque', value: 25 }] },
          { level: 3, label: 'Stage 3', statBonus: [{ stat: 'HP', value: 60 }, { stat: 'Torque', value: 45 }] },
        ],
      },
      {
        id: 'suspension', name: 'Suspension', icon: 'car-shock-absorber', currentTier: 0,
        tiers: [
          { level: 0, label: 'Stock',  statBonus: [] },
          { level: 1, label: 'Sport',  statBonus: [{ stat: 'Handling', value: 10 }, { stat: 'Stability', value: 8 }] },
          { level: 2, label: 'Track',  statBonus: [{ stat: 'Handling', value: 22 }, { stat: 'Stability', value: 18 }] },
          { level: 3, label: 'Race',   statBonus: [{ stat: 'Handling', value: 38 }, { stat: 'Stability', value: 30 }] },
        ],
      },
      {
        id: 'tires', name: 'Tires', icon: 'tire', currentTier: 0,
        tiers: [
          { level: 0, label: 'Street', statBonus: [] },
          { level: 1, label: 'Sport',  statBonus: [{ stat: 'Grip', value: 12 }, { stat: 'Cornering', value: 10 }] },
          { level: 2, label: 'Track',  statBonus: [{ stat: 'Grip', value: 25 }, { stat: 'Cornering', value: 22 }] },
          { level: 3, label: 'Slick',  statBonus: [{ stat: 'Grip', value: 40 }, { stat: 'Cornering', value: 35 }] },
        ],
      },
    ],
  },
};

export const ZONE_CAMERA: Record<GarageZone, { fov: number; pos: [number, number, number] }> = {
  body_zone:        { fov: 38, pos: [2, 0.9, 2.6] },
  wheels_zone:      { fov: 34, pos: [2, 0.35, 2.6] },
  performance_zone: { fov: 38, pos: [1.8, 0.8, 2.2] },
};

export const getDefaultZoneColors = (): Record<string, string> => ({
  body_zone: ZONE_META.body_zone.defaultColor,
});

// Finish material presets
export const FINISH_PRESETS: Record<FinishId, { roughness: number; metalness: number; env: number }> = {
  glossy:         { roughness: 0.05, metalness: 0.3,  env: 2.0 },
  matte:          { roughness: 0.85, metalness: 0.0,  env: 0.5 },
  carbon:         { roughness: 0.3,  metalness: 0.6,  env: 1.5 },
  racing_stripes: { roughness: 0.1,  metalness: 0.2,  env: 1.8 },
};
