import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceTracker'>;

interface ServiceType {
  key: string;
  label: string;
  icon: string;
  intervalKm: number;
  intervalDays: number;
  desc: string;
}

const SERVICES: ServiceType[] = [
  { key: 'oli',     label: 'Ganti Oli',     icon: 'oil',           intervalKm: 2500,  intervalDays: 90,  desc: 'Oli mesin setiap 2500 km atau 3 bulan' },
  { key: 'ban',     label: 'Ban',           icon: 'tire',          intervalKm: 15000, intervalDays: 730, desc: 'Cek tekanan mingguan, ganti tiap 15K km' },
  { key: 'rem',     label: 'Kampas Rem',    icon: 'disc-brake',    intervalKm: 10000, intervalDays: 365, desc: 'Ganti kampas rem setiap 10K km' },
  { key: 'busi',    label: 'Busi',          icon: 'flash',         intervalKm: 8000,  intervalDays: 365, desc: 'Busi diganti tiap 8K km' },
  { key: 'filter',  label: 'Filter Udara',  icon: 'air-filter',    intervalKm: 12000, intervalDays: 365, desc: 'Ganti filter udara tiap 12K km' },
  { key: 'rantai',  label: 'Rantai',        icon: 'cog',           intervalKm: 20000, intervalDays: 730, desc: 'Rantai & gear set tiap 20K km' },
  { key: 'aki',     label: 'Aki',           icon: 'car-battery',   intervalKm: 0,     intervalDays: 730, desc: 'Aki motor umumnya 2 tahun' },
];

interface ServiceRecord {
  id: string;
  type: string;
  odometer_km: number | null;
  notes: string | null;
  cost: number | null;
  service_date: string;
}

interface Bike {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  odometer_km: number | null;
  is_primary: boolean;
}

const daysSince = (dateStr: string) => {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
};

export default function ServiceTrackerScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [bike, setBike] = useState<Bike | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ServiceType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ odometer: '', cost: '', notes: '' });

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [bikeRes, recRes] = await Promise.all([
      supabase.from('bikes').select('*').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
      supabase.from('service_records').select('*').eq('user_id', user.id).order('service_date', { ascending: false }),
    ]);
    setBike(bikeRes.data || null);
    setRecords(recRes.data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = (svc: ServiceType) => {
    setForm({
      odometer: bike?.odometer_km ? String(bike.odometer_km) : '',
      cost: '',
      notes: '',
    });
    setModal(svc);
  };

  const saveRecord = async () => {
    if (!modal || !user?.id) return;
    setSaving(true);
    const odometerKm = parseInt(form.odometer) || null;
    const { error } = await supabase.from('service_records').insert([{
      user_id: user.id,
      bike_id: bike?.id || null,
      type: modal.key,
      odometer_km: odometerKm,
      cost: parseInt(form.cost) || null,
      notes: form.notes.trim() || null,
      service_date: new Date().toISOString().split('T')[0],
    }]);
    if (error) {
      const msg = `Gagal simpan: ${error.message}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } else if (odometerKm && bike) {
      // Update bike odometer if service reading is higher
      if (!bike.odometer_km || odometerKm > bike.odometer_km) {
        await supabase.from('bikes').update({ odometer_km: odometerKm }).eq('id', bike.id);
      }
    }
    setSaving(false);
    setModal(null);
    fetchAll();
  };

  const getStatus = (svc: ServiceType) => {
    const last = records.find((r) => r.type === svc.key);
    if (!last) return { status: 'due', lastDays: null, lastKm: null, progress: 1 };
    const d = daysSince(last.service_date);
    const kmSince = bike?.odometer_km && last.odometer_km ? Math.max(0, bike.odometer_km - last.odometer_km) : 0;
    const dayRatio = svc.intervalDays > 0 ? d / svc.intervalDays : 0;
    const kmRatio = svc.intervalKm > 0 ? kmSince / svc.intervalKm : 0;
    const progress = Math.max(dayRatio, kmRatio);
    let status: 'ok' | 'soon' | 'due' = 'ok';
    if (progress >= 1) status = 'due';
    else if (progress >= 0.8) status = 'soon';
    return { status, lastDays: d, lastKm: kmSince, progress };
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Service Tracker</Text>
          <Text style={ts.headerSubtitle}>Maintenance & Perawatan</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
      ) : !bike ? (
        <View style={ts.emptyState}>
          <MaterialCommunityIcons name="garage-variant" size={64} color={colors.textMuted} />
          <Text style={ts.emptyText}>Tambahkan motor primer dulu untuk tracking servis.</Text>
          <TouchableOpacity style={ts.ctaBtn} onPress={() => navigation.navigate('Garage')}>
            <Text style={ts.ctaText}>Go to Garage</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
          <View style={ts.bikeCard}>
            <MaterialCommunityIcons name="motorbike" size={28} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ts.bikeTitle}>{bike.brand} {bike.model}</Text>
              <Text style={ts.bikePlate}>{bike.plate_number} · {bike.odometer_km ? `${bike.odometer_km.toLocaleString('id-ID')} km` : 'odometer belum diset'}</Text>
            </View>
          </View>

          <Text style={ts.sectionLabel}>SCHEDULE</Text>
          {SERVICES.map((svc) => {
            const s = getStatus(svc);
            const barColor =
              s.status === 'due' ? colors.error :
              s.status === 'soon' ? colors.warning : colors.accent;
            return (
              <TouchableOpacity key={svc.key} style={ts.serviceCard} onPress={() => openAdd(svc)} activeOpacity={0.85}>
                <View style={ts.serviceHead}>
                  <View style={ts.serviceIconBox}>
                    <MaterialCommunityIcons name={svc.icon as any} size={22} color={barColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.serviceLabel}>{svc.label}</Text>
                    <Text style={ts.serviceMeta}>
                      {s.lastDays !== null ? `${s.lastDays}d ago · ${s.lastKm} km` : 'Belum pernah direcord'}
                    </Text>
                  </View>
                  <View style={[ts.statusDot, { backgroundColor: barColor }]} />
                </View>
                <View style={ts.barBg}>
                  <View style={[ts.barFill, { width: `${Math.min(100, s.progress * 100)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={ts.serviceDesc}>{svc.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={modal !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Record {modal?.label}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={ts.inputLabel}>ODOMETER SAAT INI (km)</Text>
            <TextInput style={ts.input} value={form.odometer} onChangeText={(v) => setForm({ ...form, odometer: v.replace(/[^\d]/g, '') })} placeholder="12500" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <Text style={ts.inputLabel}>BIAYA (Rp, opsional)</Text>
            <TextInput style={ts.input} value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v.replace(/[^\d]/g, '') })} placeholder="85000" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <Text style={ts.inputLabel}>CATATAN (opsional)</Text>
            <TextInput style={[ts.input, { height: 80, textAlignVertical: 'top' }]} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Bengkel, merek oli, dll..." placeholderTextColor={colors.textMuted} multiline />

            <TouchableOpacity style={ts.saveBtn} onPress={saveRecord} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={ts.saveText}>SIMPAN RECORD</Text>}
            </TouchableOpacity>
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
  scrollPadding: { padding: spacing.lg, paddingBottom: 80 },
  bikeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  bikeTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  bikePlate: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md },
  serviceCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  serviceHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  serviceIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  serviceMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  barBg: { height: 4, backgroundColor: '#1C1C1E', borderRadius: 2, marginBottom: spacing.sm },
  barFill: { height: 4, borderRadius: 2 },
  serviceDesc: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', marginVertical: spacing.lg },
  ctaBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.md },
  ctaText: { color: '#000', fontSize: fontSize.sm, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg },
  saveBtn: { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center' },
  saveText: { color: '#000', fontSize: fontSize.md, fontWeight: '800', letterSpacing: 1 },
});
