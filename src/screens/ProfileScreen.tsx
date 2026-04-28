import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { buildStats, ACHIEVEMENTS, fetchUserAchievements, getTierColor } from '../utils/achievements';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';
  const motorFromMeta = user?.user_metadata?.motor || '';

  const [rides, setRides] = useState<any[]>([]);
  const [bike, setBike] = useState<any>(null);
  const [achIds, setAchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit state
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editBio, setEditBio] = useState(user?.user_metadata?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    const [ridesRes, bikeRes, ids] = await Promise.all([
      supabase.from('rides').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bikes').select('*').eq('user_id', user.id).eq('is_primary', true).single(),
      fetchUserAchievements(user.id),
    ]);
    if (ridesRes.data) setRides(ridesRes.data);
    if (bikeRes.data) setBike(bikeRes.data);
    setAchIds(ids);
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = buildStats(rides);
  const recentBadges = ACHIEVEMENTS.filter(a => achIds.includes(a.id)).slice(0, 6);

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg('');
    const { error } = await supabase.auth.updateUser({
      data: { name: editName.trim(), bio: editBio.trim() }
    });
    if (error) { setSaveMsg('Gagal: ' + error.message); }
    else { setSaveMsg('✅ Profil tersimpan!'); setTimeout(() => { setEditModal(false); setSaveMsg(''); }, 1200); }
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); };

  const motorLabel = bike ? `${bike.brand} ${bike.model}` : (motorFromMeta || 'Belum ada motor');

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <View>
          <Text style={ts.headerTitle}>Account</Text>
          <Text style={ts.headerSubtitle}>Personal Profile & Statistics</Text>
        </View>
        <TouchableOpacity style={ts.editBtn} onPress={() => { setEditName(displayName); setEditBio(user?.user_metadata?.bio || ''); setEditModal(true); }}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={ts.scrollPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
      >
        {/* Avatar + Identity */}
        <View style={ts.avatarSection}>
          <View style={ts.avatarCircle}>
            <Text style={ts.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={ts.userName}>{displayName}</Text>
          <Text style={ts.userEmail}>{user?.email}</Text>
          {user?.user_metadata?.bio ? (
            <Text style={ts.userBio}>{user.user_metadata.bio}</Text>
          ) : null}
          
          <View style={ts.bikeBadge}>
            <MaterialCommunityIcons name="motorbike" size={18} color={colors.accent} />
            <Text style={ts.bikeBadgeText}>{loading ? '…' : motorLabel}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <TeslaCard style={ts.statsCard}>
          <Text style={ts.sectionLabel}>LIFETIME STATISTICS</Text>
          <View style={ts.statsGrid}>
            <View style={ts.statItem}>
              <Text style={ts.statValue}>{loading ? '…' : stats.totalRides}</Text>
              <Text style={ts.statLabel}>RIDES</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statValue}>{loading ? '…' : stats.totalDistanceKm.toFixed(0)}</Text>
              <Text style={ts.statLabel}>KM</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statValue}>{loading ? '…' : Math.round(stats.maxSpeedKmh)}</Text>
              <Text style={ts.statLabel}>MAX SPD</Text>
            </View>
            <View style={ts.statItem}>
              <Text style={ts.statValue}>{loading ? '…' : stats.longestRideKm.toFixed(0)}</Text>
              <Text style={ts.statLabel}>LONGEST</Text>
            </View>
          </View>
        </TeslaCard>

        {/* Achievements Preview */}
        <TeslaCard style={ts.badgeCard} onPress={() => navigation.navigate('Achievements')}>
          <View style={ts.badgeHeader}>
            <Text style={ts.sectionLabel}>RECENT BADGES</Text>
            <Text style={ts.badgeCount}>{achIds.length}/{ACHIEVEMENTS.length}</Text>
          </View>
          
          {recentBadges.length > 0 ? (
            <View style={ts.badgeList}>
              {recentBadges.map(a => (
                <View key={a.id} style={ts.badgeIconWrapper}>
                  <Text style={ts.badgeIcon}>{a.icon}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={ts.emptyBadges}>Belum ada badge. Mulai riding! 🏍️</Text>
          )}
          <View style={ts.cardFooter}>
            <Text style={ts.footerAction}>View All Badges</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </TeslaCard>

        {/* Menu Items */}
        <View style={ts.menuGroup}>
          <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('Garage')}>
            <MaterialCommunityIcons name="garage" size={20} color={colors.textSecondary} style={ts.menuIcon} />
            <Text style={ts.menuText}>Garage Saya</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('Leaderboard')}>
            <MaterialCommunityIcons name="podium" size={20} color={colors.textSecondary} style={ts.menuIcon} />
            <Text style={ts.menuText}>Leaderboard</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('RideHistory')}>
            <MaterialCommunityIcons name="history" size={20} color={colors.textSecondary} style={ts.menuIcon} />
            <Text style={ts.menuText}>Riwayat Riding</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={ts.signOutBtn} onPress={handleSignOut}>
          <Text style={ts.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={ts.fieldContainer}>
              <Text style={ts.fieldLabel}>DISPLAY NAME</Text>
              <TextInput style={ts.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
            </View>

            <View style={ts.fieldContainer}>
              <Text style={ts.fieldLabel}>BIO</Text>
              <TextInput style={[ts.input, ts.inputBio]} value={editBio} onChangeText={setEditBio} placeholder="Tell us about yourself..." placeholderTextColor={colors.textMuted} multiline />
            </View>

            {saveMsg ? <Text style={ts.saveMsg}>{saveMsg}</Text> : null}

            <TouchableOpacity style={ts.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              <Text style={ts.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md 
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  editBtn: { padding: 4 },
  scrollPadding: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginVertical: spacing.xl },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarInitial: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '700' },
  userName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  userEmail: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  userBio: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: 12, paddingHorizontal: spacing.xxl, lineHeight: 20 },
  bikeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, marginTop: spacing.lg },
  bikeBadgeText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, padding: spacing.lg, marginBottom: spacing.lg },
  statsCard: { paddingVertical: spacing.lg },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.lg },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 4 },
  badgeCard: { padding: spacing.lg },
  badgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeCount: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  badgeList: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  badgeIconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  badgeIcon: { fontSize: 18 },
  emptyBadges: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-end' },
  footerAction: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600' },
  menuGroup: { marginTop: spacing.sm },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.xl, 
    paddingVertical: spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: '#111' 
  },
  menuIcon: { marginRight: spacing.md },
  menuText: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '500' },
  signOutBtn: { marginHorizontal: spacing.md, marginTop: spacing.xxl, paddingVertical: 16, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  signOutText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  fieldContainer: { marginBottom: spacing.lg },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: 12, color: colors.text, fontSize: fontSize.md },
  inputBio: { height: 80, textAlignVertical: 'top' },
  saveMsg: { color: colors.accent, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  saveBtn: { backgroundColor: colors.text, paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' }
});