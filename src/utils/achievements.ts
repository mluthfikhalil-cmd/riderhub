import { supabase } from '../lib/supabase';

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  secret?: boolean;
}

export interface RiderStats {
  totalRides: number;
  totalDistanceKm: number;
  maxSpeedKmh: number;
  hasGPSRide: boolean;
  longestRideKm: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Distance milestones
  { id: 'first_ride',   icon: '🏍️', name: 'First Ride',           desc: 'Selesaikan ride pertamamu',        tier: 'bronze' },
  { id: 'km_10',        icon: '📍', name: '10KM Club',             desc: 'Kumpulkan total jarak 10 km',      tier: 'bronze' },
  { id: 'km_50',        icon: '🛣️', name: '50KM Rider',            desc: 'Kumpulkan total jarak 50 km',      tier: 'bronze' },
  { id: 'km_100',       icon: '💯', name: '100KM Club',            desc: 'Kumpulkan total jarak 100 km',     tier: 'silver' },
  { id: 'km_250',       icon: '🗺️', name: 'Explorer',              desc: 'Kumpulkan total jarak 250 km',     tier: 'silver' },
  { id: 'km_500',       icon: '🔥', name: 'Road Warrior',          desc: 'Kumpulkan total jarak 500 km',     tier: 'gold'   },
  { id: 'km_1000',      icon: '🏆', name: 'Thousand KM Legend',    desc: 'Kumpulkan total jarak 1000 km',    tier: 'platinum' },
  // Ride count
  { id: 'rides_5',      icon: '⭐', name: 'Regular Rider',         desc: 'Selesaikan 5 ride',                tier: 'bronze' },
  { id: 'rides_20',     icon: '🎖️', name: 'Veteran',               desc: 'Selesaikan 20 ride',               tier: 'silver' },
  { id: 'rides_50',     icon: '👑', name: 'Riding Legend',         desc: 'Selesaikan 50 ride',               tier: 'gold'   },
  // Speed
  { id: 'speed_60',     icon: '💨', name: 'Cruiser',               desc: 'Capai kecepatan 60 km/h',          tier: 'bronze' },
  { id: 'speed_80',     icon: '⚡', name: 'Speed Rider',           desc: 'Capai kecepatan 80 km/h',          tier: 'silver' },
  { id: 'speed_100',    icon: '🚀', name: 'Speed Demon',           desc: 'Capai kecepatan 100 km/h',         tier: 'gold'   },
  { id: 'speed_120',    icon: '🌪️', name: 'Bullet Rider',          desc: 'Capai kecepatan 120 km/h',         tier: 'platinum', secret: true },
  // GPS / Special
  { id: 'gps_track',   icon: '🛰️', name: 'GPS Explorer',          desc: 'Record ride pertama dengan GPS',   tier: 'bronze' },
  { id: 'long_ride_30', icon: '🏕️', name: 'Long Distance Rider',   desc: 'Satu ride lebih dari 30 km',       tier: 'silver' },
  { id: 'long_ride_100',icon: '🌍', name: 'Iron Butt',             desc: 'Satu ride lebih dari 100 km',      tier: 'gold', secret: true },
];

const TIER_COLORS: Record<string, string> = {
  bronze:   '#CD7F32',
  silver:   '#C0C0C0',
  gold:     '#FFD700',
  platinum: '#00D4FF',
};
export const getTierColor = (tier: string) => TIER_COLORS[tier] || '#777';

// Parse "2.45 km" → 2.45
const parseKm = (s: string | null): number => {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};

// Parse "120 km/h" → 120
const parseSpeed = (s: string | null): number => {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};

export const buildStats = (rides: any[]): RiderStats => {
  let totalDistanceKm = 0, maxSpeedKmh = 0, longestRideKm = 0, hasGPSRide = false;
  for (const r of rides) {
    const d = parseKm(r.distance);
    const spd = parseSpeed(r.max_speed);
    totalDistanceKm += d;
    if (d > longestRideKm) longestRideKm = d;
    if (spd > maxSpeedKmh) maxSpeedKmh = spd;
    if (r.route_path && Array.isArray(r.route_path) && r.route_path.length > 1) hasGPSRide = true;
  }
  return { totalRides: rides.length, totalDistanceKm, maxSpeedKmh, hasGPSRide, longestRideKm };
};

export const checkUnlocked = (stats: RiderStats): string[] => {
  const unlocked: string[] = [];
  const { totalRides, totalDistanceKm, maxSpeedKmh, hasGPSRide, longestRideKm } = stats;
  if (totalRides >= 1)    unlocked.push('first_ride');
  if (totalRides >= 5)    unlocked.push('rides_5');
  if (totalRides >= 20)   unlocked.push('rides_20');
  if (totalRides >= 50)   unlocked.push('rides_50');
  if (totalDistanceKm >= 10)   unlocked.push('km_10');
  if (totalDistanceKm >= 50)   unlocked.push('km_50');
  if (totalDistanceKm >= 100)  unlocked.push('km_100');
  if (totalDistanceKm >= 250)  unlocked.push('km_250');
  if (totalDistanceKm >= 500)  unlocked.push('km_500');
  if (totalDistanceKm >= 1000) unlocked.push('km_1000');
  if (maxSpeedKmh >= 60)  unlocked.push('speed_60');
  if (maxSpeedKmh >= 80)  unlocked.push('speed_80');
  if (maxSpeedKmh >= 100) unlocked.push('speed_100');
  if (maxSpeedKmh >= 120) unlocked.push('speed_120');
  if (hasGPSRide) unlocked.push('gps_track');
  if (longestRideKm >= 30)  unlocked.push('long_ride_30');
  if (longestRideKm >= 100) unlocked.push('long_ride_100');
  return unlocked;
};

// Sync with DB: save new unlocks, return array of NEWLY unlocked achievement IDs
export const syncAchievements = async (userId: string, rides: any[]): Promise<string[]> => {
  if (!userId || rides.length === 0) return [];

  const stats = buildStats(rides);
  const earned = checkUnlocked(stats);

  // Fetch already-saved achievements
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const existingIds = new Set((existing || []).map((r: any) => r.achievement_id));
  const newlyEarned = earned.filter(id => !existingIds.has(id));

  if (newlyEarned.length > 0) {
    await supabase.from('user_achievements').insert(
      newlyEarned.map(achievement_id => ({ user_id: userId, achievement_id }))
    );
  }
  return newlyEarned;
};

export const fetchUserAchievements = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  return (data || []).map((r: any) => r.achievement_id);
};
