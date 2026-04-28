import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Platform, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { syncAchievements, ACHIEVEMENTS, getTierColor } from '../utils/achievements';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const haversine = (a: number, b: number, c: number, d: number) => {
  const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLon = ((d - b) * Math.PI) / 180, x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${String(m).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`;
};

const speedColor = (s: number) => {
  if (s < 20) return colors.textMuted;
  if (s < 40) return colors.success;
  if (s < 80) return colors.accent;
  return colors.error;
};

const snapToRoad = async (pts: Coord[]): Promise<[number, number][]> => {
  const MAX = 98;
  let sampled = pts;
  if (pts.length > MAX) { const step = Math.ceil(pts.length / MAX); sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1); }
  const coordStr = sampled.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  try {
    const r = await fetch(`https://router.project-osrm.org/match/v1/driving/${coordStr}?overview=full&geometries=geojson&tidy=true`);
    const d = await r.json();
    if (d.code === 'Ok' && d.matchings?.[0]) {
      return d.matchings[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  } catch (_) { }
  return pts.map(p => [p.lat, p.lng]);
};

const RouteMap = ({ coords, height = 280, mapKey }: { coords: Coord[]; height?: number; mapKey?: string }) => {
  const ref = useRef<any>(null);
  const mapRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || coords.length < 2) return;
    const timer = setTimeout(async () => {
      const L = (window as any).L;
      if (!L || !ref.current) return;
      if (mapRef.current) { try { mapRef.current.remove(); } catch (_) { } mapRef.current = null; }
      const node = ref.current;
      node.style.height = height + 'px';
      
      const map = L.map(node, { zoomControl: false, attributionControl: false });
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      const latlngs = coords.map(c => [c.lat, c.lng]);
      const rawPoly = L.polyline(latlngs, { opacity: 0 }).addTo(map);
      map.fitBounds(rawPoly.getBounds(), { padding: [20, 20] });
      rawPoly.remove();

      const snapped = await snapToRoad(coords);
      L.polyline(snapped, { color: 'rgba(0, 214, 125, 0.3)', weight: 8, lineCap: 'round' }).addTo(map);
      L.polyline(snapped, { color: colors.accent, weight: 3, lineCap: 'round' }).addTo(map);

      setTimeout(() => map.invalidateSize(), 100);
      mapRef.current = map;
    }, 200);
    return () => { clearTimeout(timer); try { mapRef.current?.remove(); } catch (_) { } mapRef.current = null; };
  }, [coords, height, mapKey]);

  if (Platform.OS !== 'web' || coords.length < 2) return (
    <View style={{ height, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="map-outline" size={32} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>No GPS Data</Text>
    </View>
  );
  return <View ref={ref} style={{ height, backgroundColor: '#000' }} />;
};

interface Coord { lat: number; lng: number; speed?: number; }
interface Ride { id: string; title: string; distance: string; duration: string; avg_speed: string; max_speed: string; date: string; route_path: Coord[]; }

export default function RideHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [saveModal, setSaveModal] = useState(false);
  const [mapModal, setMapModal] = useState<{ ride: Ride } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Ride | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [unlockModal, setUnlockModal] = useState<string[]>([]);
  const timerRef = useRef<any>(null);
  const watchRef = useRef<any>(null);
  const prevCoord = useRef<Coord | null>(null);
  const prevTime = useRef<number>(0);
  const speedHistory = useRef<number[]>([]);

  useEffect(() => { fetchRides(); return () => stopAll(); }, []);

  const fetchRides = async () => {
    setLoading(true);
    const { data } = await supabase.from('rides').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setRides(data || []); setLoading(false);
  };

  const stopAll = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (watchRef.current) { try { if (typeof watchRef.current?.remove === 'function') watchRef.current.remove(); else if (typeof watchRef.current === 'number') navigator.geolocation.clearWatch(watchRef.current); } catch (_) { } watchRef.current = null; }
    prevCoord.current = null;
  };

  const processCoord = useCallback((lat: number, lng: number, speedMs?: number, accuracy?: number) => {
    if (accuracy != null && accuracy > 30) return;
    const now = Date.now();
    const prev = prevCoord.current;
    const timeDeltaMs = now - prevTime.current;
    if (prevTime.current > 0 && timeDeltaMs < 800) return;
    if (prev) {
      const d = haversine(prev.lat, prev.lng, lat, lng);
      if (d >= 0.01 && d < 0.5) setDistance(x => x + d);
    }
    let spd = 0;
    if (speedMs != null && speedMs >= 0 && speedMs < 70) {
      spd = speedMs * 3.6;
    } else if (prev && timeDeltaMs > 0) {
      const d = haversine(prev.lat, prev.lng, lat, lng);
      spd = d / (timeDeltaMs / 3600000);
      if (spd > 220) spd = 0;
    }
    speedHistory.current.push(spd);
    if (speedHistory.current.length > 5) speedHistory.current.shift();
    const smooth = Math.round(speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length);
    setCurrentSpeed(smooth);
    setMaxSpeed(mx => Math.max(mx, smooth));
    prevCoord.current = { lat, lng };
    prevTime.current = now;
    setCoords(c => [...c, { lat, lng, speed: smooth }]);
  }, []);

  const startTracking = async () => {
    setTracking(true); setElapsed(0); setDistance(0); setCurrentSpeed(0); setMaxSpeed(0); setCoords([]); prevCoord.current = null; prevTime.current = 0; speedHistory.current = [];
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        pos => processCoord(pos.coords.latitude, pos.coords.longitude, pos.coords.speed != null ? pos.coords.speed : undefined, pos.coords.accuracy),
        err => { if (err.code === 1) { setPermDenied(true); simulateGPS(); } },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      watchRef.current = id;
      setTimeout(() => { if (coords.length === 0) { setPermDenied(true); simulateGPS(); } }, 6000);
    } else if (Platform.OS !== 'web') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermDenied(true); setTracking(false); stopAll(); return; }
      watchRef.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 }, loc => processCoord(loc.coords.latitude, loc.coords.longitude, loc.coords.speed ?? undefined));
    } else { simulateGPS(); }
  };

  const simulateGPS = () => {
    let lat = -6.2088, lng = 106.8456, heading = 45;
    const INTERVAL = 3000;
    const interval = setInterval(() => {
      if (!timerRef.current) { clearInterval(interval); return; }
      heading += (Math.random() - 0.5) * 20;
      const speedKmh = 20 + Math.random() * 50;
      const speedMs = speedKmh / 3.6;
      const distKm = speedKmh * (INTERVAL / 3600000);
      const distDeg = distKm / 111.32;
      const rad = heading * (Math.PI / 180);
      lat += Math.cos(rad) * distDeg;
      lng += Math.sin(rad) * distDeg;
      processCoord(lat, lng, speedMs, 5);
    }, INTERVAL);
    watchRef.current = { remove: () => clearInterval(interval) };
  };

  const stopTracking = () => { stopAll(); setSaveModal(true); };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveRide = async () => {
    if (!user?.id) { setSaveError('Session expired. Please login again.'); return; }
    setSaving(true); setSaveError('');
    const avgSpd = elapsed > 0 ? (distance / (elapsed / 3600)).toFixed(1) : '0';
    const payload = {
      user_id: user.id,
      title: `Ride ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      distance: `${distance.toFixed(2)} km`,
      duration: fmtTime(elapsed),
      avg_speed: `${avgSpd} km/h`,
      max_speed: `${maxSpeed} km/h`,
      date: new Date().toISOString().split('T')[0],
      route_path: coords.length > 0 ? coords.slice(-500) : null,
    };
    const { data, error } = await supabase.from('rides').insert([payload]).select();
    if (error || !data) {
      setSaveError(`Failed to save: ${error.message}`);
      setSaving(false);
      return;
    }
    setSaving(false); setSaveModal(false); setTracking(false); setCoords([]);
    if (data && data[0]?.id) {
      const rideId = data[0].id;
      detectSegments(coords, rideId);
      detectGroupRide(rideId);
      const { data: allRides } = await supabase.from('rides').select('*').eq('user_id', user.id);
      if (allRides && user?.id) {
        const newBadges = await syncAchievements(user.id, allRides);
        if (newBadges.length > 0) setUnlockModal(newBadges);
      }
    }
    fetchRides();
  };

  const detectSegments = async (routeCoords: Coord[], rideId: string) => {
    if (routeCoords.length < 2) return;
    const { data: segs } = await supabase.from('segments').select('*');
    if (!segs || segs.length === 0) return;
    const THRESH = 0.3;
    for (const seg of segs) {
      let entryIdx = -1, entryDist = THRESH;
      let exitIdx = -1, exitDist = THRESH;
      routeCoords.forEach((c, i) => {
        const dS = haversine(c.lat, c.lng, seg.start_lat, seg.start_lng);
        const dE = haversine(c.lat, c.lng, seg.end_lat, seg.end_lng);
        if (dS < entryDist) { entryDist = dS; entryIdx = i; }
        if (dE < exitDist && i > entryIdx + 1) { exitDist = dE; exitIdx = i; }
      });
      if (entryIdx >= 0 && exitIdx > entryIdx) {
        const elapsedSec = Math.max(1, (exitIdx - entryIdx) * 3);
        const avgSpd = seg.distance_km / (elapsedSec / 3600);
        await supabase.from('segment_efforts').insert([{
          segment_id: seg.id, ride_id: rideId, user_id: user?.id,
          user_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider',
          elapsed_seconds: elapsedSec, avg_speed: parseFloat(avgSpd.toFixed(1)),
          date: new Date().toISOString().split('T')[0],
        }]);
      }
    }
  };

  const detectGroupRide = async (rideId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRides } = await supabase.from('rides').select('id, user_id').eq('date', today).neq('user_id', user?.id).limit(10);
    if (!todayRides || todayRides.length === 0) return;
    const myName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';
    const { data: grp, error } = await supabase.from('group_rides').insert([{ name: `Group Ride ${today}`, date: today, leader_id: user?.id }]).select().single();
    if (error || !grp) return;
    await supabase.from('group_ride_members').insert([
      { group_ride_id: grp.id, ride_id: rideId, user_id: user?.id, user_name: myName },
      ...todayRides.map((r: any) => ({ group_ride_id: grp.id, ride_id: r.id, user_id: r.user_id, user_name: 'Rider' })),
    ]);
  };

  const deleteRide = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    await supabase.from('rides').delete().eq('id', deleteModal.id);
    setRides(prev => prev.filter(r => r.id !== deleteModal.id));
    setDeleteModal(null); setDeleting(false);
  };

  const avgSpeed = elapsed > 60 ? (distance / (elapsed / 3600)).toFixed(1) : '0';

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Ride History</Text>
          <Text style={ts.headerSubtitle}>Manage your tracks</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={ts.iconBtn}>
          <Ionicons name="trophy-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {tracking && (
        <View style={ts.hudBox}>
          <View style={ts.hudHeader}>
            <View style={ts.recordingDot} />
            <Text style={ts.hudStatus}>RECORDING LIVE</Text>
          </View>
          <View style={ts.speedContainer}>
            <Text style={ts.speedValue}>{currentSpeed}</Text>
            <Text style={ts.speedUnit}>KM/H</Text>
          </View>
          <View style={ts.statsGrid}>
            <View style={ts.statItem}>
              <Text style={ts.statLabel}>DISTANCE</Text>
              <Text style={ts.statValue}>{distance.toFixed(1)} km</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statLabel}>DURATION</Text>
              <Text style={ts.statValue}>{fmtTime(elapsed)}</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statLabel}>AVERAGE</Text>
              <Text style={ts.statValue}>{avgSpeed} km/h</Text>
            </View>
          </View>
          <TouchableOpacity style={ts.stopBtn} onPress={stopTracking}>
            <Text style={ts.stopBtnText}>STOP RIDE</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        {loading ? (
          <Text style={ts.loadingText}>Loading your rides...</Text>
        ) : rides.length === 0 ? (
          <View style={ts.emptyState}>
            <MaterialCommunityIcons name="map-marker-path" size={64} color={colors.textMuted} />
            <Text style={ts.emptyText}>No rides recorded yet.</Text>
            <Text style={ts.emptySub}>Start a ride to track your route and stats.</Text>
          </View>
        ) : (
          rides.map((ride, i) => (
            <TeslaCard key={ride.id} style={ts.rideCard}>
              <View style={ts.rideHeader}>
                <View>
                  <Text style={ts.rideDate}>{new Date(ride.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={ts.rideTitle}>{ride.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setDeleteModal(ride)} style={ts.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <View style={ts.rideStatsRow}>
                <View style={ts.rideStatItem}>
                  <Text style={ts.rideStatValue}>{ride.distance}</Text>
                  <Text style={ts.rideStatLabel}>Distance</Text>
                </View>
                <View style={ts.rideStatItem}>
                  <Text style={ts.rideStatValue}>{ride.duration}</Text>
                  <Text style={ts.rideStatLabel}>Time</Text>
                </View>
                <View style={ts.rideStatItem}>
                  <Text style={ts.rideStatValue}>{ride.avg_speed}</Text>
                  <Text style={ts.rideStatLabel}>Avg Spd</Text>
                </View>
              </View>

              {ride.route_path && ride.route_path.length > 1 && (
                <View style={ts.rideActions}>
                  <TouchableOpacity style={ts.actionBtn} onPress={() => { setMapKey(k => k + 1); setMapModal({ ride }); }}>
                    <Ionicons name="map-outline" size={16} color={colors.text} />
                    <Text style={ts.actionText}>View Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ts.actionBtn, { borderColor: 'rgba(0,214,125,0.2)', backgroundColor: 'rgba(0,214,125,0.05)' }]} onPress={() => navigation.navigate('RideReplay', { ride })}>
                    <Ionicons name="play-outline" size={16} color={colors.accent} />
                    <Text style={[ts.actionText, { color: colors.accent }]}>Relive</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TeslaCard>
          ))
        )}
      </ScrollView>

      {!tracking && (
        <View style={ts.fabContainer}>
          <TouchableOpacity style={ts.startBtn} onPress={startTracking}>
            <Ionicons name="play" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={ts.startBtnText}>START NEW RIDE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SAVE MODAL */}
      <Modal visible={saveModal} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={ts.modalTitle}>Ride Summary</Text>
              <View style={ts.modalMapContainer}>
                <RouteMap coords={coords} height={200} mapKey={String(mapKey)} />
              </View>
              <View style={ts.modalStats}>
                <View style={ts.modalStatRow}>
                  <Text style={ts.modalStatLabel}>Total Distance</Text>
                  <Text style={ts.modalStatValue}>{distance.toFixed(2)} km</Text>
                </View>
                <View style={ts.modalStatRow}>
                  <Text style={ts.modalStatLabel}>Duration</Text>
                  <Text style={ts.modalStatValue}>{fmtTime(elapsed)}</Text>
                </View>
                <View style={ts.modalStatRow}>
                  <Text style={ts.modalStatLabel}>Average Speed</Text>
                  <Text style={ts.modalStatValue}>{avgSpeed} km/h</Text>
                </View>
                <View style={ts.modalStatRow}>
                  <Text style={ts.modalStatLabel}>Max Speed</Text>
                  <Text style={ts.modalStatValue}>{maxSpeed} km/h</Text>
                </View>
              </View>
              <View style={ts.modalActions}>
                <TouchableOpacity style={ts.modalDiscard} onPress={() => { setSaveModal(false); setTracking(false); setCoords([]); }}>
                  <Text style={ts.discardText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ts.modalSave} onPress={saveRide} disabled={saving}>
                  <Text style={ts.saveText}>{saving ? 'Saving...' : 'Save Activity'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MAP DETAIL MODAL */}
      <Modal visible={mapModal !== null} transparent animationType="fade">
        <View style={ts.modalOverlay}>
          <View style={[ts.modalContent, { height: '80%' }]}>
            <View style={ts.modalHeader}>
              <View>
                <Text style={ts.modalTitle}>{mapModal?.ride.title}</Text>
                <Text style={ts.modalSubtitle}>{mapModal?.ride.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setMapModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden', marginVertical: spacing.lg }}>
              <RouteMap coords={mapModal?.ride.route_path || []} height={400} mapKey={String(mapKey)} />
            </View>
            <View style={ts.rideStatsRow}>
              <View style={ts.rideStatItem}>
                <Text style={ts.rideStatValue}>{mapModal?.ride.distance}</Text>
                <Text style={ts.rideStatLabel}>Distance</Text>
              </View>
              <View style={ts.rideStatItem}>
                <Text style={ts.rideStatValue}>{mapModal?.ride.duration}</Text>
                <Text style={ts.rideStatLabel}>Time</Text>
              </View>
              <View style={ts.rideStatItem}>
                <Text style={ts.rideStatValue}>{mapModal?.ride.avg_speed}</Text>
                <Text style={ts.rideStatLabel}>Avg Speed</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE MODAL */}
      <Modal visible={deleteModal !== null} transparent animationType="fade">
        <View style={ts.modalOverlay}>
          <View style={ts.alertContent}>
            <Text style={ts.alertTitle}>Delete Activity?</Text>
            <Text style={ts.alertDesc}>This will permanently remove '{deleteModal?.title}' from your history.</Text>
            <View style={ts.alertActions}>
              <TouchableOpacity style={ts.alertCancel} onPress={() => setDeleteModal(null)}>
                <Text style={ts.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ts.alertDelete} onPress={deleteRide}>
                <Text style={ts.alertDeleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACHIEVEMENT MODAL */}
      <Modal visible={unlockModal.length > 0} transparent animationType="fade">
        <View style={ts.modalOverlay}>
          <View style={ts.achievementBox}>
            <Ionicons name="ribbon" size={64} color={colors.accent} />
            <Text style={ts.achievementTitle}>Achievement Unlocked!</Text>
            {unlockModal.map(id => {
              const ach = ACHIEVEMENTS.find(a => a.id === id);
              if (!ach) return null;
              return (
                <View key={id} style={ts.achievementCard}>
                  <Text style={ts.achievementIcon}>{ach.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.achievementName}>{ach.name}</Text>
                    <Text style={ts.achievementDesc}>{ach.desc}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={ts.achievementClose} onPress={() => setUnlockModal([])}>
              <Text style={ts.achievementCloseText}>SWEET!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  hudBox: { backgroundColor: '#000', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: '#111' },
  hudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginRight: 8 },
  hudStatus: { color: colors.error, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  speedContainer: { alignItems: 'center', marginBottom: spacing.xl },
  speedValue: { color: colors.text, fontSize: 80, fontWeight: '700', lineHeight: 85 },
  speedUnit: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: '#111' },
  statItem: { alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginBottom: 4 },
  statValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  stopBtn: { backgroundColor: colors.error, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  stopBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  scrollPadding: { padding: spacing.lg, paddingBottom: 120 },
  rideCard: { padding: spacing.lg, marginBottom: spacing.md },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  rideDate: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  rideTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  deleteBtn: { padding: 4 },
  rideStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  rideStatItem: { flex: 1, alignItems: 'center' },
  rideStatValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  rideStatLabel: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  rideActions: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#222', backgroundColor: '#111' },
  actionText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  fabContainer: { position: 'absolute', bottom: 40, left: spacing.lg, right: spacing.lg },
  startBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.full, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  startBtnText: { color: '#000', fontWeight: '800', letterSpacing: 1 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: 100 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginTop: 16 },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  modalSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  modalMapContainer: { height: 200, borderRadius: borderRadius.lg, overflow: 'hidden', marginVertical: spacing.xl },
  modalStats: { gap: 16, marginBottom: spacing.xl },
  modalStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalStatLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  modalStatValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 16 },
  modalDiscard: { flex: 1, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333' },
  discardText: { color: colors.textSecondary, fontWeight: '700' },
  modalSave: { flex: 2, backgroundColor: colors.accent, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.md },
  saveText: { color: '#000', fontWeight: '800' },
  alertContent: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, margin: spacing.xl },
  alertTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: 12 },
  alertDesc: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.xl },
  alertActions: { flexDirection: 'row', gap: 16 },
  alertCancel: { flex: 1, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: '#111' },
  alertCancelText: { color: colors.textSecondary, fontWeight: '700' },
  alertDelete: { flex: 1, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: colors.error },
  alertDeleteText: { color: '#fff', fontWeight: '700' },
  achievementBox: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, margin: spacing.xl, alignItems: 'center' },
  achievementTitle: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '800', marginTop: 16, marginBottom: spacing.xl },
  achievementCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#111', padding: spacing.lg, borderRadius: borderRadius.lg, width: '100%', marginBottom: spacing.md },
  achievementIcon: { fontSize: 32 },
  achievementName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  achievementDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  achievementClose: { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md, width: '100%', alignItems: 'center', marginTop: spacing.md },
  achievementCloseText: { color: '#000', fontWeight: '800', letterSpacing: 1 }
});
