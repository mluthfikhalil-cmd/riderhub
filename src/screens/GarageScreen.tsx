import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import { BackButton, CloseButton, CreateButton } from '../components/HeaderButtons';
import type { Bike } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Garage'>;

const alert = (msg: string) => {
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert('RiderHub', msg);
};

export default function GarageScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBikes = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Garage] fetch failed:', error.message);
      setBikes([]);
    } else {
      setBikes((data || []) as Bike[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchBikes(); }, [fetchBikes]);

  const handleAddBike = async () => {
    if (!user?.id) { alert('Login dulu buat nambah motor.'); return; }
    if (!brand || !model || !plate) { alert('Brand, model, dan plat wajib diisi.'); return; }

    setSaving(true);
    try {
      const isFirst = bikes.length === 0;
      const { error } = await supabase.from('bikes').insert({
        user_id: user.id,
        brand,
        model,
        plate_number: plate.toUpperCase(),
        year,
        is_primary: isFirst,
      });
      if (error) throw error;
      setIsModalVisible(false);
      resetForm();
      await fetchBikes();
    } catch (e: any) {
      alert(`Gagal menyimpan: ${e?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setPlate(''); setYear('');
  };

  const setPrimaryBike = async (id: string) => {
    if (!user?.id) return;
    // Demote current primary, then promote target. Partial unique index prevents double-primary.
    const { error: demoteErr } = await supabase
      .from('bikes')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);
    if (demoteErr) { alert(`Gagal: ${demoteErr.message}`); return; }

    const { error: promoteErr } = await supabase
      .from('bikes')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (promoteErr) { alert(`Gagal: ${promoteErr.message}`); return; }

    fetchBikes();
  };

  const deleteBike = async (bike: Bike) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`Hapus ${bike.brand} ${bike.model}?`)
      : true; // native uses Alert.alert below
    if (!confirm) return;
    const { error } = await supabase.from('bikes').delete().eq('id', bike.id).eq('user_id', user!.id);
    if (error) alert(`Gagal hapus: ${error.message}`);
    else fetchBikes();
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Garage</Text>
          <Text style={ts.headerSubtitle}>Manage your vehicles</Text>
        </View>
        <CreateButton onPress={() => setIsModalVisible(true)} label="Tambah motor" />
      </View>

      <ScrollView style={ts.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        <Text style={ts.sectionLabel}>YOUR COLLECTION</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : bikes.length === 0 ? (
          <TeslaCard style={[ts.card, ts.emptyCard]}>
            <MaterialCommunityIcons name="garage-variant" size={64} color={colors.textMuted} />
            <Text style={ts.emptyText}>Your garage is empty.</Text>
            <TouchableOpacity style={ts.emptyAction} onPress={() => setIsModalVisible(true)}>
              <Text style={ts.emptyActionText}>Add Your First Bike</Text>
            </TouchableOpacity>
          </TeslaCard>
        ) : (
          bikes.map((bike) => (
            <TeslaCard key={bike.id} style={[ts.card, ts.bikeCard, bike.is_primary && ts.primaryCard]}>
              <View style={ts.bikeHeader}>
                <View style={ts.bikeIconBox}>
                  <MaterialCommunityIcons name="motorbike" size={32} color={bike.is_primary ? colors.accent : colors.textMuted} />
                </View>
                <View style={ts.bikeInfo}>
                  <Text style={ts.bikeBrand}>{bike.brand}</Text>
                  <Text style={ts.bikeModel}>{bike.model}</Text>
                  <View style={ts.plateBox}>
                    <Text style={ts.plateText}>{bike.plate_number}</Text>
                  </View>
                </View>
                {bike.is_primary ? (
                  <View style={ts.primaryBadge}>
                    <Text style={ts.primaryBadgeText}>PRIMARY</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setPrimaryBike(bike.id)} style={ts.setPrimaryBtn}>
                    <Text style={ts.setPrimaryText}>Set Default</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={ts.bikeStatsRow}>
                <View style={ts.bikeStat}>
                  <Text style={ts.statLabel}>YEAR</Text>
                  <Text style={ts.statValue}>{bike.year || 'N/A'}</Text>
                </View>
                <View style={ts.bikeStat}>
                  <Text style={ts.statLabel}>ODOMETER</Text>
                  <Text style={ts.statValue}>{bike.odometer_km ? `${bike.odometer_km.toLocaleString('id-ID')} km` : '—'}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteBike(bike)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TeslaCard>
          ))
        )}

        <TeslaCard style={[ts.card, ts.tipsCard]}>
          <Ionicons name="bulb-outline" size={24} color={colors.accent} style={{ marginBottom: 12 }} />
          <Text style={ts.tipsTitle}>Pro Tip</Text>
          <Text style={ts.tipsDesc}>Set motor harian lo sebagai "Primary" biar Home & Service Tracker auto-pakai motor itu.</Text>
        </TeslaCard>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Add Vehicle</Text>
              <CloseButton onPress={() => { setIsModalVisible(false); resetForm(); }} />
            </View>

            <View style={ts.form}>
              <Text style={ts.inputLabel}>BRAND</Text>
              <TextInput style={ts.input} placeholder="e.g. Honda, Yamaha, Kawasaki" placeholderTextColor={colors.textMuted} value={brand} onChangeText={setBrand} />

              <Text style={ts.inputLabel}>MODEL</Text>
              <TextInput style={ts.input} placeholder="e.g. CBR250RR, R25, ZX25R" placeholderTextColor={colors.textMuted} value={model} onChangeText={setModel} />

              <Text style={ts.inputLabel}>PLATE NUMBER</Text>
              <TextInput style={ts.input} placeholder="B 1234 XYZ" placeholderTextColor={colors.textMuted} value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} autoCapitalize="characters" />

              <Text style={ts.inputLabel}>YEAR (OPTIONAL)</Text>
              <TextInput style={ts.input} placeholder="2024" placeholderTextColor={colors.textMuted} value={year} onChangeText={setYear} keyboardType="numeric" />

              <TouchableOpacity style={ts.saveBtn} onPress={handleAddBike} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={ts.saveBtnText}>ADD TO GARAGE</Text>}
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollPadding: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl, backgroundColor: '#111' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.lg, fontWeight: '600' },
  emptyAction: { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.accent },
  emptyActionText: { color: colors.accent, fontWeight: '700' },
  bikeCard: { padding: spacing.lg, borderWidth: 1, borderColor: '#111' },
  primaryCard: { borderColor: colors.accent, backgroundColor: '#0A0A0A' },
  bikeHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bikeIconBox: { width: 56, height: 56, borderRadius: borderRadius.md, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  bikeInfo: { flex: 1 },
  bikeBrand: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bikeModel: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginTop: 2 },
  plateBox: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#1C1C1E', alignSelf: 'flex-start', borderRadius: 4 },
  plateText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  primaryBadge: { backgroundColor: 'rgba(0,214,125,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  primaryBadgeText: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  setPrimaryBtn: { padding: 8 },
  setPrimaryText: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
  bikeStatsRow: { flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#1C1C1E', alignItems: 'center' },
  bikeStat: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  statValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
  tipsCard: { backgroundColor: '#111', marginTop: spacing.xl },
  tipsTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: 4 },
  tipsDesc: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  form: { gap: spacing.lg },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: spacing.lg, color: colors.text, fontSize: fontSize.md },
  saveBtn: { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#000', fontWeight: '800', letterSpacing: 1 },
});
