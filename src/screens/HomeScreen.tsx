import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Platform, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

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

  const [bikeName, setBikeName] = useState('Ducati Panigale V4');
  const [battery, setBattery] = useState(85);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isLightsOn, setIsLightsOn] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Simulate fetching
    setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <View>
          <TouchableOpacity style={ts.bikeSelector}>
            <Text style={ts.bikeTitle}>{bikeName}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={ts.statusRow}>
            <View style={[ts.batteryBar, { backgroundColor: battery > 20 ? colors.accent : colors.error, width: 24 }]} />
            <Text style={[ts.statusText, { color: battery > 20 ? colors.accent : colors.error }]}>{battery}%</Text>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.accent} />
          </View>
          <Text style={ts.parkedText}>Parkir · Dipantau Sentry</Text>
        </View>
        <View style={ts.headerIcons}>
          <TouchableOpacity style={ts.headerIconBtn}>
            <Ionicons name="chatbox-ellipses-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={ts.headerIconBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="menu-outline" size={26} color={colors.text} />
          </TouchableOpacity>
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
            source={{ uri: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&w=800&q=80' }} 
            style={ts.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Quick Controls Grid */}
        <View style={ts.controlsGrid}>
          <ControlButton 
            icon={isLocked ? "lock" : "lock-open"} 
            label={isLocked ? "Terkunci" : "Terbuka"} 
            active={!isLocked} 
            onPress={() => setIsLocked(!isLocked)} 
          />
          <ControlButton icon="fan" label="Fan" active={false} />
          <ControlButton 
            icon="flashlight" 
            label="Lampu" 
            active={isLightsOn} 
            onPress={() => setIsLightsOn(!isLightsOn)} 
          />
          <ControlButton icon="car-sports" label="Bagasi" active={false} />
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
            <TouchableOpacity style={ts.secondaryActionBtn}>
              <Text style={ts.secondaryActionText}>Mulai Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ts.secondaryActionBtn}>
              <Text style={ts.secondaryActionText}>Buka Bagasi</Text>
            </TouchableOpacity>
          </View>
        </TeslaCard>

        {/* Bottom Menu Items */}
        <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('RideHistory')}>
          <MaterialCommunityIcons name="steering" size={22} color={colors.textSecondary} style={ts.menuIcon} />
          <Text style={ts.menuText}>Kontrol & Mode Berkendara</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('Leaderboard')}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.textSecondary} style={ts.menuIcon} />
          <Text style={ts.menuText}>Keamanan & Sentry Mode</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('Garage')}>
          <MaterialCommunityIcons name="tools" size={22} color={colors.textSecondary} style={ts.menuIcon} />
          <Text style={ts.menuText}>Servis & Perawatan</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={ts.menuItem} onPress={() => navigation.navigate('Achievements')}>
          <MaterialCommunityIcons name=" trophy-outline" size={22} color={colors.textSecondary} style={ts.menuIcon} />
          <Text style={ts.menuText}>Achievement & Reward</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md,
    paddingBottom: spacing.sm
  },
  bikeSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bikeTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  batteryBar: { height: 10, borderRadius: 2 },
  statusText: { fontSize: fontSize.md, fontWeight: '700' },
  parkedText: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  headerIconBtn: { padding: 4 },
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
  menuText: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '500' }
});