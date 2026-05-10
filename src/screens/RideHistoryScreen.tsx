import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { syncAchievements } from '../utils/achievements';
import { haversineKm, formatDuration } from '../lib/geo';
import type { Coord, Ride } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { TeslaCard } from '../components/TeslaCard';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RideHistory'>;

const OSM_SIMPLIFY_CAP = 98;

// Ensure Leaflet is loaded on web (once, lazy)
let leafletPromise: Promise<any> | null = null;
const loadLeaflet = (): Promise<any> => {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.async = true;
    s.onload = () => resolve((window as any).L);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return leafletPromise;
};

const snapToRoad = async (pts: Coord[]): Promise<[number, number][]> => {
  if (pts.length < 2) return pts.map((p) => [p.lat, p.lng]);
  let sampled = pts;
  if (pts.length > OSM_SIMPLIFY_CAP) {
    const step = Math.ceil(pts.length / OSM_SIMPLIFY_CAP);
    sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  }
  const coordStr = sampled.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  try {
    const r = await fetch(`https://router.project-osrm.org/match/v1/driving/${coordStr}?overview=full&geometries=geojson&tidy=true`);
    const d = await r.json();
    if (d.code === 'Ok' && d.matchings?.[0]) {
      return d.matchings[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
  } catch (_) { /* fall through */ }
  return pts.map((p) => [p.lat, p.lng]);
};

const RouteMap = ({ coords, height = 280, mapKey }: { coords: Coord[]; height?: number; mapKey?: string }) => {
  const ref = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || coords.length < 2) return;
    let cancelled = false;
    loadLeaflet().then(async (L) => {
      if (cancelled || !L || !ref.current) return;
      if (mapRef.current) { try { mapRef.current.remove(); } catch (_) { /* noop */ } mapRef.current = null; }
      const node = ref.current;
      node.style.height = `${height}px`;

      const map = L.map(node, { zoomControl: false, attributionControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

      const latlngs = coords.map((c) => [c.lat, c.lng]);
      const fitPoly = L.polyline(latlngs, { opacity: 0 }).addTo(map);
      map.fitBounds(fitPoly.getBounds(), { padding: [20, 20] });
      fitPoly.remove();

      const snapped = await snapToRoad(coords);
      L.polyline(snapped, { color: 'rgba(0, 214, 125, 0.3)', weight: 8, lineCap: 'round' }).addTo(map);
      L.polyline(snapped, { color: colors.accent, weight: 3, lineCap: 'round' }).addTo(map);

      setTimeout(() => map.invalidateSize(), 100);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      try { mapRef.current?.remove(); } catch (_) { /* noop */ }
      mapRef.current = null;
    };
  }, [coords, height, mapKey]);

  if (Platform.OS !== 'web' || coords.length < 2) return (
    <View style={{ height, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="map-outline" size={32} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>No GPS Data</Text>
    </View>
  );
  return <View ref={ref} style={{ height, backgroundColor: '#000' }} />;
};

export default function RideHistoryScreen({ navigation }: Props) {
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
  const [mapKey, setMapKey] = useState(0);
  const [gpsStatus, setGpsStatusState] = useState<'idle' | 'acquiring' | 'locked' | 'lost' | 'denied' | 'simulated'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const gpsStatusRef = useRef<typeof gpsStatus>('idle');
  const setGpsStatusSync = (s: typeof gpsStatus) => {
    gpsStatusRef.current = s;
    setGpsStatusState(s);
  };
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const timerRef = useRef<any>(null);
  const watchRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);
  const trackingRef = useRef<boolean>(false);
  const prevCoord = useRef<Coord | null>(null);
  const prevTime = useRef<number>(0);
  const lastFixTimeRef = useRef<number>(0);
  const speedHistory = useRef<number[]>([]);
  const fixCountRef = useRef<number>(0);
  const gpsWatchdogRef = useRef<any>(null);

  const fetchRides = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('rides').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setRides((data || []) as Ride[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchRides(); return () => stopAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAll = () => {
    trackingRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (simIntervalRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; }
    if (gpsWatchdogRef.current) { clearInterval(gpsWatchdogRef.current); gpsWatchdogRef.current = null; }
    if (watchRef.current != null) {
      try {
        if (typeof watchRef.current?.remove === 'function') {
          watchRef.current.remove();
        } else if (typeof watchRef.current === 'number' && typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchRef.current);
        }
      } catch (err) {
        console.warn('[Ride] stopAll watch cleanup failed:', err);
      }
      watchRef.current = null;
    }
    prevCoord.current = null;
  };

  const processCoord = useCallback((lat: number, lng: number, speedMs?: number, accuracy?: number) => {
    // Loose accuracy filter: drop only clearly broken fixes (>150m).
    // First ~3 fixes often have poor accuracy while GPS settles — keep them.
    if (accuracy != null && accuracy > 150 && fixCountRef.current > 3) return;

    fixCountRef.current += 1;
    lastFixTimeRef.current = Date.now();

    // Upgrade status to locked after we have a stable fix
    if (fixCountRef.current === 1) {
      setGpsStatusSync(gpsStatusRef.current === 'simulated' ? 'simulated' : 'locked');
      setGpsMessage('');
    }

    const now = Date.now();
    const prev = prevCoord.current;
    const timeDeltaMs = now - prevTime.current;
    // Debounce very-rapid duplicate callbacks (some browsers fire 2x)
    if (prevTime.current > 0 && timeDeltaMs < 500) return;

    if (prev) {
      const d = haversineKm(prev.lat, prev.lng, lat, lng);
      // accept realistic movement; reject teleports
      if (d >= 0.005 && d < 2.0) setDistance((x) => x + d);
    }

    let spd = 0;
    if (speedMs != null && speedMs >= 0 && speedMs < 70) {
      spd = speedMs * 3.6;
    } else if (prev && timeDeltaMs > 0) {
      const d = haversineKm(prev.lat, prev.lng, lat, lng);
      spd = d / (timeDeltaMs / 3600000);
      if (spd > 220) spd = 0;
    }
    speedHistory.current.push(spd);
    if (speedHistory.current.length > 5) speedHistory.current.shift();
    const smooth = Math.round(speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length);
    setCurrentSpeed(smooth);
    setMaxSpeed((mx) => Math.max(mx, smooth));

    prevCoord.current = { lat, lng };
    prevTime.current = now;
    setCoords((c) => [...c, { lat, lng, speed: smooth }]);
  }, []);

  const simulateGPS = () => {
    if (simIntervalRef.current) return; // already simulating
    setGpsStatusSync('simulated');
    setGpsMessage('Mode simulasi: GPS tidak tersedia');
    let lat = -2.9923, lng = 104.7636, heading = 45; // Ampera Palembang
    const INTERVAL = 3000;
    simIntervalRef.current = setInterval(() => {
      if (!trackingRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; return; }
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
  };

  const handleGeoError = (err: GeolocationPositionError) => {
    // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
    console.warn('[Ride] geolocation error:', err.code, err.message);
    if (err.code === 1) {
      setGpsStatusSync('denied');
      setGpsMessage('Izin lokasi ditolak. Aktifkan di browser settings.');
      return;
    }
    if (err.code === 2) {
      setGpsStatusSync('lost');
      setGpsMessage('Sinyal GPS tidak tersedia. Cek koneksi / coba di luar ruangan.');
      return;
    }
    if (err.code === 3) {
      setGpsStatusSync('lost');
      setGpsMessage('GPS timeout. Mencari sinyal...');
      return;
    }
  };

  const startTracking = async () => {
    if (trackingRef.current) return; // already tracking
    trackingRef.current = true;
    setTracking(true);
    setElapsed(0);
    setDistance(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setCoords([]);
    setGpsStatusSync('acquiring');
    setGpsMessage('Mencari sinyal GPS...');
    prevCoord.current = null;
    prevTime.current = 0;
    speedHistory.current = [];
    fixCountRef.current = 0;
    lastFixTimeRef.current = 0;

    // Elapsed timer — runs regardless of GPS state
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGpsStatusSync('lost');
        setGpsMessage('Browser tidak support geolocation.');
        return;
      }
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => processCoord(pos.coords.latitude, pos.coords.longitude, pos.coords.speed ?? undefined, pos.coords.accuracy),
          handleGeoError,
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
        );
        watchRef.current = id;
      } catch (e) {
        console.error('[Ride] watchPosition threw:', e);
        setGpsStatusSync('lost');
        setGpsMessage('Geolocation gagal dimulai.');
        return;
      }

      // Watchdog: check every 5s if we've lost signal (no fix in last 15s)
      gpsWatchdogRef.current = setInterval(() => {
        if (!trackingRef.current) return;
        const now = Date.now();
        const sinceLastFix = lastFixTimeRef.current > 0 ? now - lastFixTimeRef.current : Infinity;

        if (fixCountRef.current === 0) {
          // Never got a fix; update hint every 5s (stays in 'acquiring' state)
          if (gpsStatusRef.current === 'acquiring') {
            setGpsMessage('Belum ada sinyal GPS. Pastikan izin lokasi aktif & coba di area terbuka.');
          }
        } else if (sinceLastFix > 15000) {
          setGpsStatusSync('lost');
          setGpsMessage('Sinyal GPS hilang. Jalan terus, akan reconnect otomatis.');
        } else if (gpsStatusRef.current === 'lost' && sinceLastFix <= 5000) {
          // recovered
          setGpsStatusSync('locked');
          setGpsMessage('');
        }
      }, 5000);
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsStatusSync('denied');
          setGpsMessage('Izin lokasi ditolak.');
          return;
        }
        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 },
          (loc) => processCoord(loc.coords.latitude, loc.coords.longitude, loc.coords.speed ?? undefined, loc.coords.accuracy ?? undefined),
        );
      } catch (e) {
        console.error('[Ride] native location failed:', e);
        setGpsStatusSync('lost');
        setGpsMessage('Gagal memulai tracking.');
      }
    }
  };

  const stopTracking = () => {
    // Immediately kill trackers and hide HUD before showing save modal
    stopAll();
    setTracking(false);
    setGpsStatusSync('idle');
    setGpsMessage('');
    setSaveModal(true);
  };

  const saveRide = async () => {
    if (!user?.id) { setSaveError('Session expired. Please login again.'); return; }
    if (coords.length < 2) {
      setSaveError('Ride terlalu pendek untuk disimpan — tidak ada data GPS.');
      return;
    }
    setSaving(true); setSaveError('');
    const avgSpd = elapsed > 0 ? (distance / (elapsed / 3600)).toFixed(1) : '0';
    const payload = {
      user_id: user.id,
      title: `Ride ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      distance: `${distance.toFixed(2)} km`,
      duration: formatDuration(elapsed),
      avg_speed: `${avgSpd} km/h`,
      max_speed: `${maxSpeed} km/h`,
      date: new Date().toISOString().split('T')[0],
      route_path: coords.length > 0 ? coords.slice(-500) : null,
    };
    const { data, error } = await supabase.from('rides').insert([payload]).select();
    if (error || !data) {
      setSaveError(`Failed to save: ${error?.message || 'unknown'}`);
      setSaving(false);
      return;
    }

    const savedRide = data[0] as Ride;
    setSaving(false); setSaveModal(false); setTracking(false); setCoords([]);

    if (savedRide?.id) {
      detectSegments(coords, savedRide.id);
      // group ride detection disabled until we have proper overlap logic
      // detectGroupRide(savedRide.id);
    }

    // Sync achievements and navigate to summary
    const { data: allRides } = await supabase.from('rides').select('*').eq('user_id', user.id);
    let newlyUnlocked: string[] = [];
    if (allRides) newlyUnlocked = await syncAchievements(user.id, allRides);

    fetchRides();
    navigation.navigate('RideSummary', { ride: savedRide, newlyUnlocked });
  };

  const detectSegments = async (routeCoords: Coord[], rideId: string) => {
    if (routeCoords.length < 2) return;
    const { data: segs } = await supabase.from('segments').select('*');
    if (!segs || segs.length === 0) return;

    const MATCH_RADIUS_KM = 0.25;
    const MIN_SAMPLES_BETWEEN = 3;
    const SAMPLE_INTERVAL_SEC = 3; // our processCoord throttle

    for (const seg of segs) {
      let entryIdx = -1, bestEntry = MATCH_RADIUS_KM;
      for (let i = 0; i < routeCoords.length; i++) {
        const c = routeCoords[i];
        const d = haversineKm(c.lat, c.lng, seg.start_lat, seg.start_lng);
        if (d < bestEntry) { bestEntry = d; entryIdx = i; }
      }
      if (entryIdx < 0) continue;

      let exitIdx = -1, bestExit = MATCH_RADIUS_KM;
      for (let i = entryIdx + MIN_SAMPLES_BETWEEN; i < routeCoords.length; i++) {
        const c = routeCoords[i];
        const d = haversineKm(c.lat, c.lng, seg.end_lat, seg.end_lng);
        if (d < bestExit) { bestExit = d; exitIdx = i; }
      }
      if (exitIdx < 0) continue;

      const samples = exitIdx - entryIdx;
      if (samples < MIN_SAMPLES_BETWEEN) continue;
      const elapsedSec = samples * SAMPLE_INTERVAL_SEC;
      const avgSpdKmh = seg.distance_km / (elapsedSec / 3600);
      if (avgSpdKmh > 200 || avgSpdKmh < 5) continue; // sanity check

      await supabase.from('segment_efforts').insert([{
        segment_id: seg.id,
        ride_id: rideId,
        user_id: user?.id,
        user_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider',
        elapsed_seconds: elapsedSec,
        avg_speed: parseFloat(avgSpdKmh.toFixed(1)),
        date: new Date().toISOString().split('T')[0],
      }]);
    }
  };

  const deleteRide = async () => {
    if (!deleteModal || !user?.id) return;
    setDeleting(true);
    await supabase.from('rides').delete().eq('id', deleteModal.id).eq('user_id', user.id);
    setRides((prev) => prev.filter((r) => r.id !== deleteModal.id));
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
            <View style={[
              ts.recordingDot,
              gpsStatus === 'locked' && { backgroundColor: colors.error },
              gpsStatus === 'acquiring' && { backgroundColor: colors.warning },
              gpsStatus === 'lost' && { backgroundColor: colors.warning },
              gpsStatus === 'denied' && { backgroundColor: colors.textMuted },
              gpsStatus === 'simulated' && { backgroundColor: colors.accent },
            ]} />
            <Text style={[
              ts.hudStatus,
              gpsStatus === 'locked' && { color: colors.error },
              gpsStatus === 'acquiring' && { color: colors.warning },
              gpsStatus === 'lost' && { color: colors.warning },
              gpsStatus === 'denied' && { color: colors.textMuted },
              gpsStatus === 'simulated' && { color: colors.accent },
            ]}>
              {gpsStatus === 'locked' && 'RECORDING LIVE'}
              {gpsStatus === 'acquiring' && 'ACQUIRING GPS...'}
              {gpsStatus === 'lost' && 'GPS LOST — TRYING TO RECONNECT'}
              {gpsStatus === 'denied' && 'GPS PERMISSION DENIED'}
              {gpsStatus === 'simulated' && 'SIMULATED ROUTE'}
              {gpsStatus === 'idle' && 'STARTING...'}
            </Text>
          </View>

          {gpsMessage ? <Text style={ts.hudMessage}>{gpsMessage}</Text> : null}

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
              <Text style={ts.statValue}>{formatDuration(elapsed)}</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statLabel}>FIXES</Text>
              <Text style={ts.statValue}>{fixCountRef.current}</Text>
            </View>
          </View>

          {(gpsStatus === 'denied' || (gpsStatus === 'acquiring' && elapsed >= 30)) && (
            <TouchableOpacity style={ts.simBtn} onPress={simulateGPS}>
              <Ionicons name="flash-outline" size={16} color={colors.accent} />
              <Text style={ts.simBtnText}>Use Simulated GPS</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={ts.stopBtn} onPress={stopTracking}>
            <Ionicons name="stop" size={18} color="#fff" style={{ marginRight: 8 }} />
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
          rides.map((ride) => (
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
                  <TouchableOpacity style={ts.actionBtn} onPress={() => { setMapKey((k) => k + 1); setMapModal({ ride }); }}>
                    <Ionicons name="map-outline" size={16} color={colors.text} />
                    <Text style={ts.actionText}>View Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ts.actionBtn, { borderColor: 'rgba(0,214,125,0.2)', backgroundColor: 'rgba(0,214,125,0.05)' }]} onPress={() => navigation.navigate('RideReplay', { ride })}>
                    <Ionicons name="play-outline" size={16} color={colors.accent} />
                    <Text style={[ts.actionText, { color: colors.accent }]}>Relive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ts.actionBtn, { borderColor: 'rgba(235,176,64,0.2)', backgroundColor: 'rgba(235,176,64,0.05)' }]} onPress={() => navigation.navigate('RideSummary', { ride })}>
                    <Ionicons name="stats-chart-outline" size={16} color={colors.warning} />
                    <Text style={[ts.actionText, { color: colors.warning }]}>Summary</Text>
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
                  <Text style={ts.modalStatValue}>{formatDuration(elapsed)}</Text>
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
              {saveError ? <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 12 }}>{saveError}</Text> : null}
              <View style={ts.modalActions}>
                <TouchableOpacity style={ts.modalDiscard} onPress={() => { setSaveModal(false); setCoords([]); setElapsed(0); setDistance(0); setCurrentSpeed(0); setMaxSpeed(0); }}>
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
          </View>
        </View>
      </Modal>

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
  stopBtn: { backgroundColor: colors.error, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, flexDirection: 'row', justifyContent: 'center' },
  stopBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  hudMessage: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginBottom: spacing.md, lineHeight: 16 },
  simBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginTop: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(0,214,125,0.3)', backgroundColor: 'rgba(0,214,125,0.05)' },
  simBtnText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  scrollPadding: { padding: spacing.lg, paddingBottom: 120 },
  rideCard: { padding: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  rideDate: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  rideTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  deleteBtn: { padding: 4 },
  rideStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  rideStatItem: { flex: 1, alignItems: 'center' },
  rideStatValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  rideStatLabel: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  rideActions: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#222', backgroundColor: '#111' },
  actionText: { color: colors.text, fontSize: 11, fontWeight: '600' },
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
  alertActions: { flexDirection: 'row', gap: 12 },
  alertCancel: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  alertCancelText: { color: colors.textSecondary, fontWeight: '700' },
  alertDelete: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.error, alignItems: 'center' },
  alertDeleteText: { color: '#fff', fontWeight: '800' },
});
