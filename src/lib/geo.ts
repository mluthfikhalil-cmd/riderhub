// Geo helpers shared between ride tracking and segment detection.

export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};

export const parseKm = (value: string | null | undefined): number => {
  if (!value) return 0;
  const n = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};

export const parseSpeedKmh = (value: string | null | undefined): number => {
  if (!value) return 0;
  const n = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
