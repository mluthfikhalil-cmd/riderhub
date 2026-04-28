import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Modal, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const MOTOR_BRANDS = [
  'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'KTM',
  'Royal Enfield', 'Ducati', 'BMW', 'Triumph', 'Harley-Davidson',
  'Vespa', 'Benelli', 'CFMoto', 'Bajaj', 'TVS', 'Kymco', 'Modenas',
];

const MODELS: Record<string, string[]> = {
  Honda: ['BeAT', 'Scoopy', 'Vario 160', 'PCX 160', 'ADV 160', 'CBR150R', 'CBR250RR', 'CRF150L', 'CB150R', 'CB500X', 'CB650R'],
  Yamaha: ['Mio M3', 'Fazzio', 'NMAX 155', 'Aerox 155', 'XMAX 250', 'XSR 155', 'MT-15', 'MT-25', 'R15 V4', 'R25', 'MT-09'],
  Kawasaki: ['Ninja 250', 'Ninja ZX-25R', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z900', 'Versys 250', 'KLX 150', 'W175'],
  Suzuki: ['Satria F150', 'GSX-R150', 'V-Strom 250', 'Address 125', 'Hayabusa', 'GSX-S1000'],
  KTM: ['Duke 200', 'Duke 250', 'Duke 390', 'RC 390', 'Adventure 390', 'Duke 790'],
  'Royal Enfield': ['Meteor 350', 'Classic 350', 'Hunter 350', 'Himalayan', 'Interceptor 650', 'Super Meteor 650'],
  Ducati: ['Monster', 'Scrambler Icon', 'Panigale V4', 'Streetfighter V4', 'Multistrada V4', 'Diavel V4'],
  BMW: ['G 310 R', 'G 310 GS', 'F 900 R', 'S 1000 RR', 'R 1250 GS', 'M 1000 RR'],
  Triumph: ['Trident 660', 'Street Triple RS', 'Tiger 900', 'Bonneville T120', 'Scrambler 400X'],
  'Harley-Davidson': ['Sportster S', 'Nightster', 'Street Bob', 'Fat Boy', 'Road Glide', 'Pan America'],
  Vespa: ['Sprint S 150', 'Primavera 150', 'GTS Super 150', 'GTS 300 HPE', 'S 125'],
  Benelli: ['TNT 249S', 'Leoncino 250', 'TRK 502X', 'Patagonian Eagle'],
  CFMoto: ['250SR', '450SR', '650NK', '800MT'],
  Bajaj: ['Pulsar NS200', 'Dominar 400', 'Pulsar RS200'],
  TVS: ['Ronin', 'Apache RR 310', 'Apache RTR 200', 'Ntorq 125'],
  Kymco: ['Like 150i', 'Downtown 250i', 'AK 550'],
  Modenas: ['Kriss 110', 'Pulsar RS200', 'Dominar 400'],
};

const getModels = (brand: string): string[] => MODELS[brand] || [];

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

export default function OnboardingScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  const handleSave = async () => {
    if (!plate.trim()) { setError('Plate number is required.'); return; }
    setSaving(true);
    try {
      await supabase.from('profiles').upsert({
        id: user?.id,
        name: user?.user_metadata?.name,
        motor_brand: brand,
        motor_model: model,
        motor_plate: plate.toUpperCase(),
        onboarded: true,
        updated_at: new Date().toISOString(),
      });
      await supabase.auth.updateUser({
        data: { motor: `${brand} ${model}`, plate: plate.toUpperCase(), onboarded: true }
      });
      setStep(4);
    } catch (e: any) {
      setError(e?.message || 'Failed to save data.');
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } });
  };

  return (
    <SafeAreaView style={ts.container}>
      <ScrollView contentContainerStyle={ts.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={ts.header}>
          <View style={{ flex: 1 }}>
            <Text style={ts.brandTitle}>RIDERHUB</Text>
            <Text style={ts.headerSubtitle}>VEHICLE REGISTRATION</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={ts.exitBtn}>
            <Text style={ts.exitText}>EXIT</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={ts.progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[ts.progressSegment, step >= s && ts.activeSegment]} />
          ))}
        </View>

        {step === 1 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 01 / 03</Text>
            <Text style={ts.stepTitle}>Select Vehicle{'\n'}Brand</Text>
            <Text style={ts.stepDesc}>Choose the primary manufacturer of your motorcycle.</Text>
            
            <View style={ts.grid}>
              {MOTOR_BRANDS.map((b) => (
                <TouchableOpacity 
                  key={b} 
                  style={[ts.gridItem, brand === b && ts.activeGridItem]} 
                  onPress={() => setBrand(b)}
                >
                  <Text style={[ts.gridItemText, brand === b && ts.activeGridItemText]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[ts.primaryBtn, !brand && ts.disabledBtn]}
              disabled={!brand}
              onPress={() => setStep(2)}
            >
              <Text style={ts.primaryBtnText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 02 / 03</Text>
            <Text style={ts.stepTitle}>{brand} Model</Text>
            <Text style={ts.stepDesc}>Which specific model do you ride?</Text>
            
            <TextInput
              style={ts.searchInput}
              placeholder="Search model..."
              placeholderTextColor={colors.textMuted}
              value={modelSearch}
              onChangeText={setModelSearch}
            />
            
            <ScrollView style={ts.modelList} nestedScrollEnabled={true}>
              {getModels(brand)
                .filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
                .map((m) => (
                <TouchableOpacity 
                  key={m} 
                  style={[ts.modelItem, model === m && ts.activeModelItem]} 
                  onPress={() => setModel(m)}
                >
                  <Text style={[ts.modelItemText, model === m && ts.activeModelItemText]}>{m}</Text>
                  {model === m && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={ts.btnRow}>
              <TouchableOpacity style={ts.secondaryBtn} onPress={() => setStep(1)}>
                <Text style={ts.secondaryBtnText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[ts.primaryBtn, { flex: 2 }, !model && ts.disabledBtn]} 
                disabled={!model} 
                onPress={() => setStep(3)}
              >
                <Text style={ts.primaryBtnText}>CONTINUE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 03 / 03</Text>
            <Text style={ts.stepTitle}>License Plate</Text>
            <Text style={ts.stepDesc}>Enter your official vehicle identification number.</Text>
            
            <TeslaCard style={ts.plateCard}>
              <Text style={ts.plateLabel}>REGISTRATION NUMBER</Text>
              <TextInput
                style={ts.plateInput}
                placeholder="B 1234 XYZ"
                placeholderTextColor={colors.textMuted}
                value={plate}
                onChangeText={(t) => setPlate(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={12}
              />
            </TeslaCard>

            <TeslaCard style={ts.summaryCard}>
              <Text style={ts.summaryLabel}>VEHICLE PROFILE</Text>
              <View style={ts.summaryRow}>
                <View style={ts.vehicleIconBox}>
                  <MaterialCommunityIcons name="motorbike" size={32} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ts.summaryTitle}>{brand} {model}</Text>
                  <Text style={ts.summaryPlate}>{plate || 'PENDING'}</Text>
                </View>
              </View>
            </TeslaCard>

            {error ? <Text style={ts.errorText}>{error}</Text> : null}

            <View style={ts.btnRow}>
              <TouchableOpacity style={ts.secondaryBtn} onPress={() => setStep(2)}>
                <Text style={ts.secondaryBtnText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ts.primaryBtn, { flex: 2 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={ts.primaryBtnText}>FINISH SETUP</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={ts.skipBtn} onPress={handleSkip}>
              <Text style={ts.skipText}>Complete later</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={[ts.stepContainer, { alignItems: 'center', paddingTop: 60 }]}>
            <View style={ts.successIconBox}>
              <Ionicons name="checkmark-done" size={64} color={colors.accent} />
            </View>
            <Text style={ts.successTitle}>Ready to Ride</Text>
            <Text style={ts.successDesc}>
              Setup complete! Your {brand} has been added to your garage.
            </Text>
            
            <TeslaCard style={ts.finalCard}>
              <View style={ts.finalRow}>
                <MaterialCommunityIcons name="motorbike" size={24} color={colors.accent} />
                <View style={{ marginLeft: 16 }}>
                  <Text style={ts.finalTitle}>{brand} {model}</Text>
                  <Text style={ts.finalPlate}>{plate}</Text>
                </View>
              </View>
            </TeslaCard>

            <TouchableOpacity style={[ts.primaryBtn, { width: '100%' }]} onPress={handleSkip}>
              <Text style={ts.primaryBtnText}>ENTER RIDERHUB</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandTitle: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  headerSubtitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  exitBtn: { padding: 8 },
  exitText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  progressSegment: { flex: 1, height: 3, backgroundColor: '#111', borderRadius: 2 },
  activeSegment: { backgroundColor: colors.accent },
  stepContainer: { flex: 1 },
  stepTag: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  stepTitle: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 12 },
  stepDesc: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  gridItem: { width: '47%', padding: 16, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  activeGridItem: { borderColor: colors.accent, backgroundColor: 'rgba(0, 214, 125, 0.05)' },
  gridItemText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  activeGridItemText: { color: colors.accent },
  primaryBtn: { backgroundColor: colors.accent, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  disabledBtn: { opacity: 0.3 },
  searchInput: { backgroundColor: '#111', borderRadius: 8, padding: 16, color: colors.text, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  modelList: { maxHeight: 350, marginBottom: 40 },
  modelItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#111', borderRadius: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  activeModelItem: { backgroundColor: '#161616', borderLeftColor: colors.accent },
  modelItemText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
  activeModelItemText: { color: colors.text },
  btnRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },
  plateCard: { backgroundColor: '#111', padding: 24, marginBottom: 16 },
  plateLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  plateInput: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 4 },
  summaryCard: { backgroundColor: '#0A0A0A', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', padding: 20, marginBottom: 40 },
  summaryLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  vehicleIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  summaryTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  summaryPlate: { color: colors.accent, fontSize: 14, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center', marginBottom: 16 },
  skipBtn: { alignItems: 'center', marginTop: 24, padding: 8 },
  skipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  successIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0, 214, 125, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  successDesc: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  finalCard: { width: '100%', padding: 20, backgroundColor: '#111', marginBottom: 40 },
  finalRow: { flexDirection: 'row', alignItems: 'center' },
  finalTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  finalPlate: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
});
