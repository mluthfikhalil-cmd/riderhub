import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const RANK_COLORS = [colors.accent, '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];
const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;

const SEGMENT_ROUTES: Record<string, { start: string; end: string }> = {
  'Jembatan Ampera Sprint': { start: 'BKB', end: 'Seberang Ulu' },
  'Jakabaring Circuit': { start: 'Main Gate', end: 'Finish Line' },
  'Bukit Siguntang Climb': { start: 'Lower Gate', end: 'Summit' },
  'Palembang - Indralaya': { start: 'Polda Junction', end: 'UNSRI Gate' },
  'Simpang Polda Sprint': { start: 'Polda', end: 'RS Charitas' },
  'Prabumulih Highway': { start: 'Kramasan Toll', end: 'Prabumulih Toll' },
  'Kayu Agung Loop': { start: 'Alun-alun', end: 'OPI Bridge' },
  'Sriwijaya Route': { start: 'Monpera', end: 'Masjid Agung' },
};

export default function LeaderboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';

  const [segments, setSegments] = useState<any[]>([]);
  const [efforts, setEfforts] = useState<Record<string, any[]>>({});
  const [groupRides, setGroupRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'segment' | 'group'>('segment');
  const [selectedSeg, setSelectedSeg] = useState<any | null>(null);
  const [segEfforts, setSegEfforts] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [segRes, grpRes] = await Promise.all([
      supabase.from('segments').select('*').order('city').order('name'),
      supabase.from('group_rides')
        .select('*, group_ride_members(user_name, ride_id)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    const segs = segRes.data || [];
    setSegments(segs);
    setGroupRides(grpRes.data || []);

    const effortMap: Record<string, any[]> = {};
    await Promise.all(segs.map(async (seg: any) => {
      const { data } = await supabase
        .from('segment_efforts')
        .select('*')
        .eq('segment_id', seg.id)
        .order('elapsed_seconds', { ascending: true })
        .limit(3);
      effortMap[seg.id] = data || [];
    }));
    setEfforts(effortMap);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const openSegment = async (seg: any) => {
    setSelectedSeg(seg);
    const { data } = await supabase
      .from('segment_efforts')
      .select('*')
      .eq('segment_id', seg.id)
      .order('elapsed_seconds', { ascending: true })
      .limit(50);
    setSegEfforts(data || []);
  };

  const userBestForSeg = (segId: string) => efforts[segId]?.find(e => e.user_id === user?.id);
  const isKing = (segId: string) => efforts[segId]?.[0]?.user_id === user?.id;

  return (
    <SafeAreaView style={ts.container}>
      {/* Header */}
      <View style={ts.header}>
        <View>
          <Text style={ts.headerTitle}>Performance</Text>
          <Text style={ts.headerSubtitle}>Leaderboards & Rankings</Text>
        </View>
      </View>

      <View style={ts.tabBar}>
        <TouchableOpacity style={[ts.tabItem, tab === 'segment' && ts.tabActive]} onPress={() => setTab('segment')}>
          <Text style={[ts.tabText, tab === 'segment' && ts.tabActiveText]}>Segments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ts.tabItem, tab === 'group' && ts.tabActive]} onPress={() => setTab('group')}>
          <Text style={[ts.tabText, tab === 'group' && ts.tabActiveText]}>Group Rides</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ts.scrollPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.accent} />}
      >
        {tab === 'segment' && (
          <View style={ts.content}>
            {/* Summary Card */}
            <TeslaCard style={ts.summaryCard}>
              <View style={ts.summaryHeader}>
                <View style={ts.avatarCircle}>
                  <Ionicons name="trophy-outline" size={24} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ts.summaryName}>{userName}</Text>
                  <Text style={ts.summaryMeta}>
                    {Object.values(efforts).filter(e => e[0]?.user_id === user?.id).length} Segments Conquered
                  </Text>
                </View>
                {Object.values(efforts).some(e => e[0]?.user_id === user?.id) && (
                  <View style={ts.kingBadge}>
                    <Text style={ts.kingEmoji}>👑</Text>
                    <Text style={ts.kingLabel}>KING</Text>
                  </View>
                )}
              </View>
            </TeslaCard>

            <Text style={ts.sectionLabel}>ACTIVE SEGMENTS</Text>

            {loading ? (
              <Text style={ts.loadingText}>Loading leaderboard data...</Text>
            ) : (
              segments.map((seg) => {
                const topEfforts = efforts[seg.id] || [];
                const iAmKing = isKing(seg.id);
                const myBest = userBestForSeg(seg.id);
                const route = SEGMENT_ROUTES[seg.name];
                
                return (
                  <TeslaCard key={seg.id} onPress={() => openSegment(seg)} style={ts.segCard}>
                    <View style={ts.segHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[ts.segTitle, iAmKing && { color: colors.accent }]}>
                          {iAmKing && '👑 '}{seg.name}
                        </Text>
                        <View style={ts.segLocation}>
                          <Text style={ts.segCity}>{seg.city?.toUpperCase()}</Text>
                          <Text style={ts.segDot}>•</Text>
                          <Text style={ts.segDistance}>{seg.distance_km} KM</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>

                    {route && (
                      <View style={ts.routeVisual}>
                        <View style={ts.routeNode}>
                          <View style={[ts.routePoint, { backgroundColor: colors.success }]} />
                          <Text style={ts.routeLabel}>{route.start}</Text>
                        </View>
                        <View style={ts.routeLine}>
                          <View style={ts.routeProgress} />
                        </View>
                        <View style={ts.routeNode}>
                          <View style={[ts.routePoint, { backgroundColor: colors.error }]} />
                          <Text style={ts.routeLabel}>{route.end}</Text>
                        </View>
                      </View>
                    )}

                    <View style={ts.topThree}>
                      {topEfforts.length === 0 ? (
                        <Text style={ts.emptyEfforts}>No efforts recorded yet</Text>
                      ) : (
                        topEfforts.map((e, i) => (
                          <View key={e.id} style={ts.effortRow}>
                            <Text style={ts.effortRank}>{RANK_ICONS[i] || `#${i + 1}`}</Text>
                            <Text style={[ts.effortName, e.user_id === user?.id && { color: colors.accent }]} numberOfLines={1}>
                              {e.user_name} {e.user_id === user?.id ? '(You)' : ''}
                            </Text>
                            <Text style={[ts.effortTime, { color: RANK_COLORS[i] || colors.textMuted }]}>
                              {fmtTime(e.elapsed_seconds)}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                    
                    {myBest && !topEfforts.slice(0, 3).find(e => e.user_id === user?.id) && (
                      <View style={ts.myBestRow}>
                        <Text style={ts.myBestLabel}>Your Best: {fmtTime(myBest.elapsed_seconds)}</Text>
                      </View>
                    )}
                  </TeslaCard>
                );
              })
            )}
          </View>
        )}

        {tab === 'group' && (
          <View style={ts.content}>
            <TeslaCard style={ts.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color={colors.accent} style={{ marginBottom: 12 }} />
              <Text style={ts.infoTitle}>Automatic Detection</Text>
              <Text style={ts.infoDesc}>
                We automatically detect riders traveling together. When we see you on the same route at the same time, we group you into an event.
              </Text>
            </TeslaCard>

            <Text style={ts.sectionLabel}>LATEST GROUP RIDES</Text>

            {groupRides.length === 0 ? (
              <TeslaCard style={ts.emptyGroupCard}>
                <MaterialCommunityIcons name="bike-fast" size={48} color={colors.textMuted} />
                <Text style={ts.emptyGroupText}>No group rides detected recently.</Text>
              </TeslaCard>
            ) : (
              groupRides.map((grp) => {
                const members = grp.group_ride_members || [];
                return (
                  <TeslaCard key={grp.id} style={ts.groupCard}>
                    <View style={ts.groupHeader}>
                      <View style={ts.groupIconBox}>
                        <Ionicons name="people" size={24} color={colors.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={ts.groupName}>{grp.name}</Text>
                        <Text style={ts.groupMeta}>{grp.date} • {members.length} Riders</Text>
                      </View>
                    </View>
                    <View style={ts.memberList}>
                      {members.slice(0, 10).map((m: any, i: number) => (
                        <View key={i} style={[ts.memberChip, m.user_id === user?.id && ts.memberChipActive]}>
                          <Text style={[ts.memberText, m.user_id === user?.id && ts.memberTextActive]}>
                            {m.user_name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TeslaCard>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Segment Detail Modal */}
      <Modal visible={selectedSeg !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <View>
                <Text style={ts.modalTitle}>{selectedSeg?.name}</Text>
                <Text style={ts.modalSubtitle}>{selectedSeg?.city} • {selectedSeg?.distance_km} KM</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSeg(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {segEfforts.length === 0 ? (
                <View style={ts.emptyModal}>
                  <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
                  <Text style={ts.emptyModalText}>No one has finished this segment yet.</Text>
                </View>
              ) : (
                segEfforts.map((e, i) => (
                  <View key={e.id} style={[
                    ts.effortItem,
                    e.user_id === user?.id && ts.effortItemActive,
                    i === 0 && { borderColor: colors.accent, borderWidth: 1 }
                  ]}>
                    <View style={ts.effortRankBox}>
                      {i < 3 ? (
                        <Text style={{ fontSize: 24 }}>{RANK_ICONS[i]}</Text>
                      ) : (
                        <Text style={ts.rankText}>#{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ts.effortItemName, e.user_id === user?.id && { color: colors.accent }]}>
                        {e.user_name} {e.user_id === user?.id ? '(You)' : ''}
                      </Text>
                      <Text style={ts.effortItemDate}>{e.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[ts.effortItemTime, i === 0 && { color: colors.accent }]}>
                        {fmtTime(e.elapsed_seconds)}
                      </Text>
                      <Text style={ts.effortItemSpeed}>{e.avg_speed?.toFixed(1)} km/h</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 24, marginTop: spacing.md, borderBottomWidth: 1, borderBottomColor: '#111' },
  tabItem: { paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  tabActiveText: { color: colors.text },
  scrollPadding: { paddingBottom: 100 },
  content: { padding: spacing.lg },
  summaryCard: { marginBottom: spacing.xl, backgroundColor: '#111' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  summaryName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  summaryMeta: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  kingBadge: { alignItems: 'center' },
  kingEmoji: { fontSize: 24 },
  kingLabel: { color: colors.accent, fontSize: 10, fontWeight: '800', marginTop: 2 },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.md },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  segCard: { padding: spacing.lg },
  segHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  segTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  segLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  segCity: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  segDot: { color: colors.textMuted, fontSize: 10 },
  segDistance: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  routeVisual: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: spacing.md, marginVertical: spacing.md, flexDirection: 'row', alignItems: 'center' },
  routeNode: { alignItems: 'center', width: 60 },
  routePoint: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  routeLabel: { color: colors.textSecondary, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  routeLine: { flex: 1, height: 1, backgroundColor: '#333', marginHorizontal: 8 },
  routeProgress: { width: '60%', height: 1, backgroundColor: colors.accent },
  topThree: { gap: 10 },
  emptyEfforts: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: 'italic' },
  effortRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  effortRank: { width: 24, fontSize: fontSize.sm },
  effortName: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  effortTime: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  myBestRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  myBestLabel: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  infoCard: { backgroundColor: '#111' },
  infoTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: 4 },
  infoDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  emptyGroupCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyGroupText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  groupCard: { padding: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: spacing.lg },
  groupIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  groupName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  groupMeta: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: { backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#222' },
  memberChipActive: { borderColor: colors.accent },
  memberText: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
  memberTextActive: { color: colors.accent },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  modalSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  emptyModal: { alignItems: 'center', paddingVertical: 80 },
  emptyModalText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: 16 },
  effortItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: '#111', borderRadius: borderRadius.md, marginBottom: spacing.sm, gap: 12 },
  effortItemActive: { borderColor: colors.accent, borderWidth: 1 },
  effortRankBox: { width: 40, alignItems: 'center' },
  rankText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
  effortItemName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  effortItemDate: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  effortItemTime: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  effortItemSpeed: { color: colors.textSecondary, fontSize: 10, marginTop: 2 }
});
