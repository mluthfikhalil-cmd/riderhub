import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Card, Badge, SectionTitle, Button } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Bike {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  year: string;
  is_primary: boolean;
}

const GarageScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('is_primary', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          // Table probably doesn't exist yet, show empty or mock
          setBikes([]);
        } else {
          throw error;
        }
      } else {
        setBikes(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching bikes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBike = async () => {
    if (!brand || !model || !plate) {
      Alert.alert('Error', 'Harap isi semua kolom wajib!');
      return;
    }

    setSaving(true);
    try {
      const newBike = {
        user_id: user?.id,
        brand,
        model,
        plate_number: plate,
        year,
        is_primary: bikes.length === 0, // First bike is primary
      };

      const { error } = await supabase.from('bikes').insert([newBike]);
      
      if (error) throw error;

      Alert.alert('Sukses', 'Motor berhasil ditambahkan ke garasi!');
      setIsModalVisible(false);
      resetForm();
      fetchBikes();
    } catch (err: any) {
      Alert.alert('Info', 'Pastikan tabel "bikes" sudah dibuat di Supabase. Menampilkan secara lokal sementara...');
      // Mock local add for preview
      const mockBike: Bike = {
        id: Math.random().toString(),
        brand,
        model,
        plate_number: plate,
        year,
        is_primary: bikes.length === 0,
      };
      setBikes([...bikes, mockBike]);
      setIsModalVisible(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBrand('');
    setModel('');
    setPlate('');
    setYear('');
  };

  const setPrimaryBike = async (id: string) => {
    try {
      // 1. Reset all to false
      await supabase.from('bikes').update({ is_primary: false }).neq('id', id);
      // 2. Set this one to true
      await supabase.from('bikes').update({ is_primary: true }).eq('id', id);
      
      fetchBikes();
    } catch (err) {
      // Local fallback
      setBikes(bikes.map(b => ({ ...b, is_primary: b.id === id })));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏍️ My Garage</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Koleksi Motor Kamu" />
        
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : bikes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏚️</Text>
            <Text style={styles.emptyText}>Garasi kamu masih kosong.</Text>
            <Button 
              title="Tambah Motor Sekarang" 
              onPress={() => setIsModalVisible(true)} 
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </Card>
        ) : (
          bikes.map((bike) => (
            <Card key={bike.id} style={[styles.bikeCard, bike.is_primary && styles.primaryCard]}>
              <View style={styles.bikeHeader}>
                <View style={styles.bikeIconContainer}>
                  <Text style={styles.bikeEmoji}>🏍️</Text>
                </View>
                <View style={styles.bikeDetails}>
                  <Text style={styles.bikeName}>{bike.brand} {bike.model}</Text>
                  <Text style={styles.bikePlate}>{bike.plate_number}</Text>
                  <Text style={styles.bikeYear}>{bike.year || 'Tahun tidak diisi'}</Text>
                </View>
                {bike.is_primary ? (
                  <Badge label="Utama" variant="success" />
                ) : (
                  <TouchableOpacity onPress={() => setPrimaryBike(bike.id)}>
                    <Text style={styles.setPrimaryText}>Set Utama</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Tips RiderHub</Text>
          <Text style={styles.infoText}>Gunakan motor "Utama" untuk perhitungan statistik perjalanan dan pengingat servis otomatis.</Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Add Bike Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Motor Baru</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Brand (Contoh: Honda)" 
              placeholderTextColor={colors.textMuted}
              value={brand}
              onChangeText={setBrand}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Model (Contoh: CBR250RR)" 
              placeholderTextColor={colors.textMuted}
              value={model}
              onChangeText={setModel}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Nomor Plat (B 1234 XYZ)" 
              placeholderTextColor={colors.textMuted}
              value={plate}
              onChangeText={setPlate}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Tahun (Pilihan)" 
              placeholderTextColor={colors.textMuted}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => { setIsModalVisible(false); resetForm(); }}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleAddBike}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: colors.background,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
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
  bikeCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  bikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bikeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bikeEmoji: {
    fontSize: 28,
  },
  bikeDetails: {
    flex: 1,
  },
  bikeName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  bikePlate: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginTop: 2,
  },
  bikeYear: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  setPrimaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  bottomSpace: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.background,
    fontWeight: '700',
  },
});

export default GarageScreen;
