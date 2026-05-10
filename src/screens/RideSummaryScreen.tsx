import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Share } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ACHIEVEMENTS, getTierColor } from '../utils/achievements';
import { parseKm } from '../lib/geo';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RideSummary'>;

const CALORIES_PER_KM = 40;

export default function RideSummaryScreen({ route, navigation }: Props) {
  const { ride, newlyUnlocked = [] } = route.params;
  const distanceKm = parseKm(ride.distance);
  const calories = Math.round(distanceKm * CALORIES_PER_KM);
  const distanceBadge = distanceKm >= 10;

  const unlockedBadges = ACHIEVEMENTS.filter((a) => newlyUnlocked.includes(a.id));

  const shareRide = async () => {
    const msg = `🏍️ Just finished a ${ride.distance} ride in ${ride.duration} on RiderHub! Avg ${ride.avg_speed}, burned ~${calories} cal.`;
    try {
      if (Platform.OS === 'web' && (navigator as any).share) {
        await (navigator as any).share({ title: 'RiderHub Ride', text: msg });
      } else if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      } else {
        await Share.share({ message: msg });
      }
    } catch (_) {
      // user cancelled or not supported
    }
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={ts.headerTitle}>Ride Summary</Text>
        <TouchableOpacity onPress={shareRide} style={ts.iconBtn}>
          <Ionicons name="share-outline" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        <View style={ts.hero}>
          <View style={ts.heroIconBox}>
            <MaterialCommunityIcons name="map-marker-path" size={48} color={colors.accent} />
          </View>
          <Text style={ts.heroTitle}>{ride.title}</Text>
          <Text style={ts.heroDate}>{ride.date}</Text>
          <Text style={ts.heroDistance}>{ride.distance}</Text>
        </View>

        <View style={ts.statsGrid}>
          <View style={ts.statCard}>
            <Text style={ts.statLabel}>DURATION</Text>
            <Text style={ts.statValue}>{ride.duration}</Text>
          </View>
          <View style={ts.statCard}>
            <Text style={ts.statLabel}>AVG SPEED</Text>
            <Text style={ts.statValue}>{ride.avg_speed}</Text>
          </View>
          <View style={ts.statCard}>
            <Text style={ts.statLabel}>MAX SPEED</Text>
            <Text style={ts.statValue}>{ride.max_speed}</Text>
          </View>
          <View style={[ts.statCard, ts.caloriesCard]}>
            <Text style={ts.statLabel}>CALORIES</Text>
            <Text style={[ts.statValue, { color: colors.warning }]}>{calories}</Text>
          </View>
        </View>

        {distanceBadge && (
          <View style={ts.milestoneCard}>
            <MaterialCommunityIcons name="medal" size={32} color={colors.warning} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={ts.milestoneTitle}>10KM+ Ride</Text>
              <Text style={ts.milestoneDesc}>You crossed the 10km threshold. Keep riding.</Text>
            </View>
          </View>
        )}

        {unlockedBadges.length > 0 && (
          <View style={ts.unlockSection}>
            <Text style={ts.sectionLabel}>ACHIEVEMENTS UNLOCKED</Text>
            {unlockedBadges.map((b) => (
              <View key={b.id} style={[ts.unlockCard, { borderColor: getTierColor(b.tier) }]}>
                <Text style={ts.unlockIcon}>{b.icon}</Text>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={ts.unlockName}>{b.name}</Text>
                  <Text style={ts.unlockDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={ts.actions}>
          <TouchableOpacity style={ts.replayBtn} onPress={() => navigation.navigate('RideReplay', { ride })}>
            <Ionicons name="play-outline" size={18} color={colors.text} />
            <Text style={ts.replayText}>Relive Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ts.doneBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={ts.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { padding: spacing.lg, paddingBottom: 60 },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,214,125,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  heroDate: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  heroDistance: { color: colors.accent, fontSize: 48, fontWeight: '800', marginTop: spacing.md, letterSpacing: -1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.xl },
  statCard: { width: '47%', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.lg },
  caloriesCard: { borderWidth: 1, borderColor: 'rgba(235,176,64,0.3)' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', marginTop: 6 },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(235,176,64,0.08)', borderWidth: 1, borderColor: 'rgba(235,176,64,0.3)', padding: spacing.lg, borderRadius: borderRadius.lg, marginTop: spacing.lg },
  milestoneTitle: { color: colors.warning, fontSize: fontSize.md, fontWeight: '700' },
  milestoneDesc: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  unlockSection: { marginTop: spacing.xl },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md },
  unlockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  unlockIcon: { fontSize: 32 },
  unlockName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  unlockDesc: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  actions: { marginTop: spacing.xxl, gap: 12 },
  replayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111', padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#222' },
  replayText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  doneBtn: { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center' },
  doneText: { color: '#000', fontSize: fontSize.md, fontWeight: '800', letterSpacing: 1 },
});
