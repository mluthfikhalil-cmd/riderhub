import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Platform, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import { FeatureCard } from '../components/FeatureCard';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const ControlButton = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={ts.controlBtn} onPress={onPress} activeOpacity={0.7}>
    <View style={[ts.iconCircle, active && ts.iconCircleActive]}>
      <MaterialCommunityIcons name={icon} size={24} color={active ? colors.accent : colors.textSecondary} />
    </View>
    <Text style={ts.controlLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';

  const [bikeName, setBikeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (user?.id) {
      const { data } = await supabase.from('bikes').select('*').eq('user_id', user.id).eq('is_primary', true).maybeSingle();
      if (data) setBikeName(`${data.brand} ${data.model}`);
      else setBikeName(user?.user_metadata?.motor || 'Motor Anda');
    } else {
      setBikeName('Motor Anda');
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={ts.container}>
      {/* Cyberpunk Header */}
      <View style={ts.header}>
        {/* Neon accent line */}
        <View style={ts.neonLine} />
        <View style={ts.headerContent}>
          <View>
            <Text style={ts.greetText}>WELCOME BACK</Text>
            <TouchableOpacity style={ts.bikeSelector}>
              <Text style={ts.bikeTitle}>{loading ? '...' : (bikeName || 'Motor Anda')}</Text>
              <Ionicons name="chevron-down" size={16} color="#a855f7" />
            </TouchableOpacity>
            <View style={ts.statusRow}>
              <View style={ts.neonDot} />
              <Text style={ts.statusText}>ONLINE · SENTRY ACTIVE</Text>
            </View>
          </View>
          <View style={ts.headerIcons}>
            <TouchableOpacity style={ts.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#e879f9" />
            </TouchableOpacity>
            <TouchableOpacity style={ts.headerIconBtn} onPress={() => navigation.navigate('Profile')}>
              <View style={ts.avatarCircle}>
                <Text style={ts.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ts.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Hero Image */}
        <View style={ts.heroContainer}>
          <Image 
            source={require('../../assets/ducati-hero.png')} 
            style={ts.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Quick Actions */}
        <View style={ts.controlsGrid}>
          <ControlButton icon="map-marker-path" label="Ride" active onPress={() => navigation.navigate('RideHistory')} />
          <ControlButton icon="wrench" label="Servis" onPress={() => navigation.navigate('ServiceTracker')} />
          <ControlButton icon="trophy-outline" label="Badges" onPress={() => navigation.navigate('Achievements')} />
          <ControlButton icon="palette" label="3D" onPress={() => navigation.navigate('Configurator')} />
        </View>

        {/* Info Card */}
        <TeslaCard style={ts.infoCard}>
          <View style={ts.cardHeader}>
            <Text style={ts.cardTitle}>Status Kendaraan: 80% · Siap</Text>
            <Text style={ts.cardSubtitle}>Standby · Mesin Dingin</Text>
          </View>
          
          <View style={ts.progressContainer}>
            <View style={ts.progressBarBg}>
              <View style={[ts.progressBarFill, { width: '80%' }]} />
            </View>
            <View style={ts.progressThumb} />
          </View>

          <View style={ts.infoTipRow}>
            <View style={ts.tipIcon}>
              <Ionicons name="information-circle" size={18} color={colors.accent} />
            </View>
            <View style={ts.tipTextContainer}>
              <Text style={ts.tipTitle}>Tips Perawatan</Text>
              <Text style={ts.tipText}>Untuk menjaga performa mesin, pastikan panaskan mesin minimal 2 menit sebelum digunakan di pagi hari.</Text>
            </View>
          </View>

          <View style={ts.actionButtonsRow}>
            <TouchableOpacity style={ts.secondaryActionBtn} onPress={() => navigation.navigate('RideHistory')}>
              <Text style={ts.secondaryActionText}>Mulai Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ts.secondaryActionBtn} onPress={() => navigation.navigate('ServiceTracker')}>
              <Text style={ts.secondaryActionText}>Cek Servis</Text>
            </TouchableOpacity>
          </View>
        </TeslaCard>

        {/* Feature cards */}
        <Text style={ts.sectionLabel}>JELAJAHI FITUR</Text>

        <View style={ts.featureGrid}>
          <FeatureCard
            title="3D Configurator"
            subtitle="Custom warna & velg motor virtual"
            icon={{ lib: 'mci', name: 'palette' }}
            accentColor={colors.accent}
            badge="3D"
            badgeTone="accent"
            variant="hero"
            onPress={() => navigation.navigate('Configurator')}
          />

          <FeatureCard
            title="Ride History & Tracker"
            subtitle="GPS live tracking + statistik"
            icon={{ lib: 'mci', name: 'map-marker-path' }}
            accentColor="#FF453A"
            variant="hero"
            onPress={() => navigation.navigate('RideHistory')}
          />

          <View style={ts.grid2}>
            <FeatureCard
              title="Servis"
              subtitle="Oli, ban, rem"
              icon={{ lib: 'mci', name: 'tools' }}
              accentColor="#EBB040"
              variant="compact"
              onPress={() => navigation.navigate('ServiceTracker')}
              style={ts.gridItem}
            />
            <FeatureCard
              title="Leaderboard"
              subtitle="Segment & group ride"
              icon={{ lib: 'mci', name: 'podium' }}
              accentColor="#A855F7"
              variant="compact"
              onPress={() => navigation.navigate('Leaderboard')}
              style={ts.gridItem}
            />
            <FeatureCard
              title="Achievements"
              subtitle="Badge rider"
              icon={{ lib: 'ion', name: 'trophy-outline' }}
              accentColor="#0A84FF"
              variant="compact"
              onPress={() => navigation.navigate('Achievements')}
              style={ts.gridItem}
            />
            <FeatureCard
              title="Garage"
              subtitle="Motor kolekasi"
              icon={{ lib: 'mci', name: 'garage' }}
              accentColor="#10B981"
              variant="compact"
              onPress={() => navigation.navigate('Garage')}
              style={ts.gridItem}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0d0221',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(135deg, #0d0221 0%, #1a0533 40%, #0a1628 70%, #001a2e 100%)',
    } as any : {}),
  },
  neonLine: {
    height: 2,
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  greetText: { color: '#a855f7', fontSize: 9, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  bikeSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bikeTitle: { color: '#ffffff', fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.5,
    textShadowColor: '#e879f9', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  neonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88',
    shadowColor: '#00ff88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  statusText: { color: '#00ff88', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  headerIconBtn: { padding: 4 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(168,85,247,0.2)',
    borderWidth: 1.5, borderColor: '#a855f7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#e879f9', fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  heroContainer: { 
    height: 220, 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginVertical: spacing.lg
  },
  heroImage: { width: width * 0.9, height: 200 },
  controlsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl
  },
  controlBtn: { alignItems: 'center', width: 60 },
  iconCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#111', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8
  },
  iconCircleActive: { backgroundColor: 'rgba(0,214,125,0.1)' },
  controlLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '500' },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl
  },
  infoCard: { padding: spacing.lg },
  cardHeader: { marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  cardSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  progressContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: spacing.md,
    position: 'relative'
  },
  progressBarBg: { flex: 1, height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.accent },
  progressThumb: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#FFF', 
    position: 'absolute', 
    left: '80%', 
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5
  },
  infoTipRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  tipIcon: { marginTop: 2 },
  tipTextContainer: { flex: 1 },
  tipTitle: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  tipText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  secondaryActionBtn: { 
    flex: 1, 
    backgroundColor: '#222', 
    paddingVertical: 12, 
    borderRadius: borderRadius.md, 
    alignItems: 'center' 
  },
  secondaryActionText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#111'
  },
  menuIcon: { marginRight: spacing.md },
  menuText: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '500' },

  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  featureGrid: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  gridItem: { flexBasis: '48%', flexGrow: 1 },
});