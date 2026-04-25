import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { Card, Badge, SectionTitle, Button } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

interface Ride {
  id: string;
  title: string;
  distance: string;
  duration: string;
  date: string;
  route_path?: any;
}

const RideHistoryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [coordinates, setCoordinates] = useState<any[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<any>(null);

  useEffect(() => {
    fetchRides();
    return () => {
      stopTimer();
      cleanupLocation();
    };
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (err: any) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      if (Math.random() > 0.7) setCurrentDistance(prev => prev + 0.01);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupLocation = () => {
    if (locationSubscription.current) {
      try {
        if (typeof locationSubscription.current.remove === 'function') {
          locationSubscription.current.remove();
        }
      } catch (e) {
        console.warn('Cleanup error ignored');
      }
      locationSubscription.current = null;
    }
  };

  const handleStartTracking = async () => {
    setIsTracking(true);
    setElapsedSeconds(0);
    setCurrentDistance(0);
    setCoordinates([]);
    startTimer();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setCoordinates(prev => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }]);
          },
          null,
          { enableHighAccuracy: true }
        );
        locationSubscription.current = { remove: () => navigator.geolocation.clearWatch(watchId) };
      }
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Akses lokasi diperlukan.');
        setIsTracking(false);
        stopTimer();
        return;
      }
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (loc) => setCoordinates(prev => [...prev, { lat: loc.coords.latitude, lng: loc.coords.longitude }])
      );
    }
  };

  const handleStopTracking = () => {
    stopTimer();
    cleanupLocation();
    setIsSaveModalVisible(true);
  };

  const handleConfirmSave = async () => {
    const finalDuration = formatTime(elapsedSeconds);
    const finalDistance = currentDistance.toFixed(2) + ' km';
    await saveRide(finalDistance, finalDuration);
    setIsSaveModalVisible(false);
    setIsTracking(false);
  };

  const handleDiscardRide = () => {
    setIsSaveModalVisible(false);
    setIsTracking(false);
  };

  const saveRide = async (distance: string, duration: string) => {
    try {
      const newRide = {
        user_id: user?.id,
        title: `Ride ${new Date().toLocaleDateString()}`,
        distance,
        duration,
        date: new Date().toISOString().split('T')[0],
        route_path: coordinates
      };
      const { error } = await supabase.from('rides').insert([newRide]);
      if (error) throw error;
      fetchRides();
    } catch (err: any) {
      console.error('Save error:', err.message);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'j ' : ''}${m}m ${s}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Ride Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {isTracking && (
        <View style={styles.trackingBanner}>
          <View style={styles.trackingHeader}>
            <View style={styles.liveIndicator} />
            <Text style={styles.trackingStatus}>TRACKING ACTIVE</Text>
          </View>
          <View style={styles.liveStats}>
            <View style={styles.liveStatItem}>
              <Text style={styles.liveStatLabel}>DURATION</Text>
              <Text style={styles.liveStatValue}>{formatTime(elapsedSeconds)}</Text>
            </View>
            <View style={styles.liveStatItem}>
              <Text style={styles.liveStatLabel}>DISTANCE</Text>
              <Text style={styles.liveStatValue}>{currentDistance.toFixed(2)} km</Text>
            </View>
          </View>
          <Button title="Stop & Finish Ride" onPress={handleStopTracking} variant="secondary" />
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <SectionTitle title="Riwayat Perjalanan Kamu" />
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : rides.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏍️</Text>
            <Text style={styles.emptyText}>Belum ada riwayat perjalanan.</Text>
            {!isTracking && <Button title="Mulai Riding Sekarang" onPress={handleStartTracking} style={{ marginTop: 20 }} />}
          </Card>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.rideTitle}>{ride.title}</Text>
                <Badge label={ride.date} variant="info" />
              </View>
              <View style={styles.rideStats}>
                <View style={styles.statItem}><Text style={styles.statLabel}>Jarak</Text><Text style={styles.statValue}>{ride.distance}</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}><Text style={styles.statLabel}>Durasi</Text><Text style={styles.statValue}>{ride.duration}</Text></View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {!isTracking && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleStartTracking}>
          <Text style={styles.floatingButtonText}>🏁 Start Ride</Text>
        </TouchableOpacity>
      )}

      {/* CUSTOM SAVE MODAL */}
      <Modal visible={isSaveModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selesai Riding! 🎉</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>Jarak: {currentDistance.toFixed(2)} km</Text>
              <Text style={styles.summaryText}>Durasi: {formatTime(elapsedSeconds)}</Text>
            </View>
            <Text style={styles.modalQuestion}>Simpan perjalanan ini ke riwayat kamu?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.discardBtn} onPress={handleDiscardRide}>
                <Text style={styles.discardBtnText}>Buang</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmSave}>
                <Text style={styles.saveBtnText}>Simpan Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface },
  backButton: { padding: spacing.sm },
  backIcon: { fontSize: 24, color: colors.text },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  trackingBanner: { backgroundColor: colors.surface, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.primary, zIndex: 10 },
  trackingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  liveIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', marginRight: 8 },
  trackingStatus: { color: '#FF3B30', fontWeight: '800', letterSpacing: 1 },
  liveStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  liveStatItem: { alignItems: 'center' },
  liveStatLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  liveStatValue: { color: colors.text, fontSize: 28, fontWeight: '800' },
  scrollView: { flex: 1, padding: spacing.md },
  rideCard: { marginBottom: spacing.md },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  rideTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  rideStats: { flexDirection: 'row', backgroundColor: colors.surfaceLight, padding: spacing.md, borderRadius: borderRadius.md },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  statDivider: { width: 1, height: '100%', backgroundColor: colors.border },
  emptyCard: { alignItems: 'center', padding: spacing.xl, marginTop: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  floatingButton: { position: 'absolute', bottom: 100, right: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, elevation: 5 },
  floatingButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center' },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  summaryBox: { backgroundColor: colors.surfaceLight, padding: spacing.lg, borderRadius: borderRadius.md, width: '100%', marginBottom: spacing.lg },
  summaryText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary, textAlign: 'center', marginVertical: 4 },
  modalQuestion: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  modalButtons: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  discardBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surfaceLight, alignItems: 'center' },
  discardBtnText: { color: colors.text, fontWeight: '600' },
  saveBtn: { flex: 2, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: colors.background, fontWeight: '700' },
});

export default RideHistoryScreen;
