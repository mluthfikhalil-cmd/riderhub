import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Card, Badge, SectionTitle } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';

interface Ride {
  id: string;
  title: string;
  distance: string;
  duration: string;
  date: string;
  route_path?: string;
}

const RideHistoryScreen = ({ navigation }: any) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (err: any) {
      console.log('Using mock data for Ride History');
      // Mock data if table doesn't exist
      setRides([
        { id: '1', title: 'Sunmori Lembang', distance: '45 km', duration: '1j 30m', date: '2026-04-20' },
        { id: '2', title: 'City Ride Jakarta', distance: '12 km', duration: '45m', date: '2026-04-18' },
        { id: '3', title: 'Touring Puncak', distance: '120 km', duration: '4j 00m', date: '2026-04-10' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Riwayat Perjalanan" />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : rides.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏍️</Text>
            <Text style={styles.emptyText}>Belum ada riwayat perjalanan.</Text>
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

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => Alert.alert('Start Ride', 'Fitur GPS Tracking akan segera hadir!')}
      >
        <Text style={styles.floatingButtonText}>+ Start Ride</Text>
      </TouchableOpacity>
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
