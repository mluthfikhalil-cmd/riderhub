import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [coordinates, setCoordinates] = useState<any[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<any>(null);

  useEffect(() => {
    fetchRides();
    return () => {
      stopTimer();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
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
      console.log('Ride History fallback to empty');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      // Simulate distance increment for demo/web if moving
      if (Math.random() > 0.7) {
        setCurrentDistance(prev => prev + 0.01);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Akses lokasi diperlukan untuk tracking perjalanan.');
      return;
    }

    setIsTracking(true);
    setElapsedSeconds(0);
    setCurrentDistance(0);
    setCoordinates([]);
    startTimer();

    // Start Location Watching
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        setCoordinates(prev => [...prev, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp
        }]);
      }
    );
  };

  const handleStopTracking = async () => {
    stopTimer();
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
      } catch (e) {
        console.log('Error removing subscription:', e);
      }
    }
    
    const finalDuration = formatTime(elapsedSeconds);
    const finalDistance = currentDistance.toFixed(2) + ' km';
    
    // For Web, window.confirm is much more reliable than Alert.alert
    const shouldSave = Platform.OS === 'web' 
      ? window.confirm(`Selesai Riding!\nJarak: ${finalDistance}\nDurasi: ${finalDuration}\n\nSimpan perjalanan ini?`)
      : true; // In native, we'll just save for now to avoid the Alert bug

    if (shouldSave) {
      await saveRide(finalDistance, finalDuration);
    }
    
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
      Alert.alert('Info', 'Gagal menyimpan ke cloud. Pastikan tabel "rides" sudah dibuat.');
      // Local preview add
      setRides(prev => [{ id: Date.now().toString(), ...newRide }, ...prev]);
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
          <Button 
            title="Stop & Finish Ride" 
            onPress={handleStopTracking} 
            variant="secondary"
            style={styles.stopButton}
          />
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Riwayat Perjalanan Kamu" />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : rides.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏍️</Text>
            <Text style={styles.emptyText}>Belum ada riwayat perjalanan.</Text>
            {!isTracking && (
              <Button 
                title="Mulai Riding Sekarang" 
                onPress={handleStartTracking} 
                style={{ marginTop: 20 }}
              />
            )}
          </Card>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.rideTitle}>{ride.title}</Text>
                <Badge label={ride.date} variant="info" />
              </View>
              <View style={styles.rideStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Jarak</Text>
                  <Text style={styles.statValue}>{ride.distance}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Durasi</Text>
                  <Text style={styles.statValue}>{ride.duration}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {!isTracking && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={handleStartTracking}
        >
          <Text style={styles.floatingButtonText}>🏁 Start Ride</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  trackingBanner: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    elevation: 10,
    zIndex: 10,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  trackingStatus: {
    color: '#FF3B30',
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  liveStatItem: {
    alignItems: 'center',
  },
  liveStatLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveStatValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  stopButton: {
    backgroundColor: colors.secondary,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  rideCard: {
    marginBottom: spacing.md,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rideTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  rideStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  bottomSpace: {
    height: 150,
  },
});

export default RideHistoryScreen;
