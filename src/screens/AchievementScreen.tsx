import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ACHIEVEMENTS, buildStats, fetchUserAchievements, getTierColor } from '../utils/achievements';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const TIER_LABELS: Record<string, string> = { bronze:'BRONZE', silver:'SILVER', gold:'GOLD', platinum:'PLATINUM' };

export default function AchievementScreen({ navigation }: any) {
  const { user } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('all');

  const load = async () => {
    if (!user?.id) return;
    try {
      const [{ data: rides }, ids] = await Promise.all([
        supabase.from('rides').select('*').eq('user_id', user.id),
        fetchUserAchievements(user.id),
      ]);
      setUnlockedIds(ids);
      if (rides) setStats(buildStats(rides));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedIds.length;
  const pct = Math.round((unlocked / total) * 100);

  const tiers = ['all', 'bronze', 'silver', 'gold', 'platinum'];
  const visible = filterTier === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.tier === filterTier);

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Achievements</Text>
          <Text style={ts.headerSubtitle}>Badge Collection</Text>
        </View>
      </View>

      <ScrollView
        style={ts.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ts.scrollPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      >
        <TeslaCard style={ts.progressCard}>
          <View style={ts.progressTop}>
            <View style={ts.progressInfo}>
              <Text style={ts.progressVal}>{unlocked}<Text style={{ color: colors.textSecondary, fontSize: 16 }}>/{total}</Text></Text>
              <Text style={ts.progressLabel}>Badges Unlocked</Text>
            </View>
            <View style={ts.pctBox}>
              <Text style={ts.pctVal}>{pct}%</Text>
              <Text style={ts.pctLabel}>RANK</Text>
            </View>
          </View>
          <View style={ts.progressTrack}>
            <View style={[ts.progressBar, { width: `${pct}%` }]} />
          </View>

          {stats && (
            <View style={ts.statsRow}>
              {[
                { l: 'RIDES', v: stats.totalRides },
                { l: 'KM', v: stats.totalDistanceKm.toFixed(0) },
                { l: 'MAX', v: Math.round(stats.maxSpeedKmh) },
                { l: 'BEST', v: stats.longestRideKm.toFixed(0) },
              ].map((st, i) => (
                <View key={i} style={ts.statCol}>
                  <Text style={ts.statVal}>{st.v}</Text>
                  <Text style={ts.statLabel}>{st.l}</Text>
                </View>
              ))}
            </View>
          )}
        </TeslaCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ts.tierScroll}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {tiers.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setFilterTier(t)}
                style={[ts.tierBtn, filterTier === t && ts.activeTierBtn]}
              >
                <Text style={[ts.tierBtnText, filterTier === t && ts.activeTierBtnText]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={ts.sectionLabel}>COLLECTION</Text>
        
        <View style={ts.badgeGrid}>
          {visible.map(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            const tierColor = getTierColor(ach.tier);
            return (
              <TeslaCard
                key={ach.id}
                style={[ts.badgeCard, isUnlocked && { borderColor: tierColor }]}
              >
                {!isUnlocked && <View style={ts.lockOverlay} />}
                
                <View style={ts.badgeHeader}>
                   <Text style={[ts.tierBadge, { color: isUnlocked ? tierColor : colors.textMuted }]}>
                    {TIER_LABELS[ach.tier]}
                  </Text>
                </View>

                <View style={ts.iconBox}>
                  <Text style={[ts.badgeIcon, !isUnlocked && { opacity: 0.3 }]}>
                    {ach.secret && !isUnlocked ? '?' : ach.icon}
                  </Text>
                </View>

                <Text style={[ts.badgeName, !isUnlocked && { color: colors.textMuted }]}>
                  {ach.secret && !isUnlocked ? '???' : ach.name}
                </Text>
                <Text style={ts.badgeDesc} numberOfLines={2}>
                  {ach.secret && !isUnlocked ? 'Hidden secret badge' : ach.desc}
                </Text>

                {isUnlocked && (
                  <View style={[ts.unlockedTag, { backgroundColor: tierColor }]}>
                    <Text style={ts.unlockedText}>UNLOCKED</Text>
                  </View>
                )}
              </TeslaCard>
            );
          })}
        </View>

        {stats && (() => {
          const next = ACHIEVEMENTS.find(a => !unlockedIds.includes(a.id) && !a.secret);
          if (!next) return null;
          return (
            <TeslaCard style={ts.nextCard}>
              <Text style={ts.nextLabel}>NEXT MILESTONE</Text>
              <View style={ts.nextRow}>
                <Text style={ts.nextIcon}>{next.icon}</Text>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={ts.nextTitle}>{next.name}</Text>
                  <Text style={ts.nextDesc}>{next.desc}</Text>
                </View>
                <View style={[ts.nextTier, { borderColor: getTierColor(next.tier) }]}>
                  <Text style={{ color: getTierColor(next.tier), fontSize: 9, fontWeight: '800' }}>{TIER_LABELS[next.tier]}</Text>
                </View>
              </View>
            </TeslaCard>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollPadding: { padding: spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  progressCard: { backgroundColor: '#111', padding: spacing.xl },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  progressVal: { color: colors.text, fontSize: 32, fontWeight: '800' },
  progressLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  pctBox: { alignItems: 'flex-end' },
  pctVal: { color: colors.accent, fontSize: 24, fontWeight: '800' },
  pctLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: '#000', borderRadius: 2, marginBottom: spacing.xl },
  progressBar: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#222', paddingTop: spacing.lg },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { color: colors.text, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', marginTop: 4 },
  tierScroll: { marginBottom: spacing.xl },
  tierBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  activeTierBtn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tierBtnText: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  activeTierBtnText: { color: '#000' },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.lg },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '48%', padding: spacing.md, borderWidth: 1, borderColor: '#111', backgroundColor: '#0A0A0A', overflow: 'hidden' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 },
  badgeHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  tierBadge: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  iconBox: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badgeIcon: { fontSize: 40 },
  badgeName: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  badgeDesc: { color: colors.textSecondary, fontSize: 10, lineHeight: 14 },
  unlockedTag: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 8, paddingVertical: 4, borderBottomRightRadius: 8 },
  unlockedText: { color: '#000', fontSize: 7, fontWeight: '900' },
  nextCard: { marginTop: spacing.xl, backgroundColor: '#050505', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333' },
  nextLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  nextRow: { flexDirection: 'row', alignItems: 'center' },
  nextIcon: { fontSize: 32 },
  nextTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  nextDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  nextTier: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }
});

export default AchievementScreen;
