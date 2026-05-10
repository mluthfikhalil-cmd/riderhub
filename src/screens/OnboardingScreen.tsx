import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const MOTOR_BRANDS = [
  'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'KTM',
  'Royal Enfield', 'Ducati', 'BMW', 'Triumph', 'Harley-Davidson',
  'Vespa', 'Benelli', 'CFMoto', 'Bajaj', 'TVS', 'Kymco', 'Modenas',
  'Aprilia', 'Moto Guzzi', 'Indian', 'Can-Am', 'Husqvarna',
];

const MODELS: Record<string, string[]> = {
  Honda: ['BeAT', 'Scoopy', 'Vario 125', 'Vario 160', 'PCX 160', 'ADV 160', 'Forza 350', 'CBR150R', 'CBR250RR', 'CBR500R', 'CBR600RR', 'CBR1000RR-R', 'CB150R', 'CB300R', 'CB500F', 'CB500X', 'CB650R', 'CB1000R', 'CRF150L', 'CRF250L', 'CRF250 Rally', 'Africa Twin 1100', 'Revo X', 'Blade 125', 'Sonic 150R', 'Supra GTR 150'],
  Yamaha: ['Mio M3', 'Mio S', 'Fazzio', 'Fino 125', 'Lexi 125', 'NMAX 155', 'NMAX Turbo', 'Aerox 155', 'XMAX 250', 'XMAX 300', 'TMax 560', 'R15 V4', 'R15M', 'R25', 'R3', 'R7', 'R9', 'YZF-R1', 'MT-15', 'MT-25', 'MT-03', 'MT-07', 'MT-09', 'MT-10', 'XSR 155', 'XSR 700', 'XSR 900', 'WR 155 R', 'Tenere 700', 'MX King 150'],
  Kawasaki: ['Ninja 250', 'Ninja 400', 'Ninja ZX-25R', 'Ninja ZX-4R', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja ZX-14R', 'Ninja H2', 'Z250', 'Z400', 'Z650', 'Z900', 'Z900RS', 'Z1000', 'Z H2', 'Versys 250', 'Versys 650', 'Versys 1000', 'KLX 150', 'KLX 230', 'KLX 300', 'W175', 'W800', 'Vulcan S'],
  Suzuki: ['Satria F150', 'GSX-R150', 'GSX-S150', 'GSX-R250', 'GSX-S250', 'GSX-R600', 'GSX-R750', 'GSX-R1000', 'GSX-S750', 'GSX-S1000', 'V-Strom 250', 'V-Strom 650', 'V-Strom 1050', 'Hayabusa', 'Address 125', 'Nex II', 'Burgman 200', 'Burgman 400'],
  KTM: ['Duke 125', 'Duke 200', 'Duke 250', 'Duke 390', 'Duke 790', 'Duke 890', 'Duke 1290', 'RC 125', 'RC 200', 'RC 390', 'Adventure 390', 'Adventure 790', 'Adventure 890', 'Adventure 1290'],
  'Royal Enfield': ['Meteor 350', 'Classic 350', 'Hunter 350', 'Bullet 350', 'Himalayan', 'Himalayan 450', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650', 'Guerrilla 450', 'Bear 650'],
  Ducati: ['Monster', 'Scrambler Icon', 'Scrambler Nightshift', 'Panigale V2', 'Panigale V4', 'Panigale V4 S', 'Streetfighter V2', 'Streetfighter V4', 'Multistrada V2', 'Multistrada V4', 'Diavel V4', 'Hypermotard 698', 'Hypermotard 950', 'DesertX'],
  BMW: ['G 310 R', 'G 310 GS', 'F 900 R', 'F 900 XR', 'F 800 GS', 'F 850 GS', 'S 1000 RR', 'S 1000 R', 'S 1000 XR', 'R 1250 GS', 'R 1250 GS Adventure', 'M 1000 RR', 'K 1600 GT', 'R 18'],
  Triumph: ['Trident 660', 'Street Triple R', 'Street Triple RS', 'Speed Triple 1200 RS', 'Tiger 660', 'Tiger 900', 'Tiger 1200', 'Bonneville T100', 'Bonneville T120', 'Scrambler 400X', 'Rocket 3 R', 'Speed 400'],
  'Harley-Davidson': ['Sportster S', 'Nightster', 'Street Bob', 'Fat Bob', 'Low Rider S', 'Fat Boy', 'Heritage Classic', 'Road Glide', 'Street Glide', 'Pan America 1250', 'Breakout'],
  Vespa: ['S 125', 'S 150', 'Sprint S 125', 'Sprint S 150', 'Primavera 125', 'Primavera 150', 'GTS Super 125', 'GTS Super 150', 'GTS Super 300', 'GTS 300 HPE', 'Elettrica', 'LX 125', 'LX 150'],
  Benelli: ['TNT 249S', 'TNT 300', 'TNT 600', 'Leoncino 250', 'Leoncino 500', 'Leoncino 800', 'TRK 251', 'TRK 502', 'TRK 502X', 'TRK 800X', '302S', '302R'],
  CFMoto: ['250SR', '300SR', '450SR', '450SS', '250NK', '300NK', '400NK', '650NK', '800NK', '650MT', '800MT', '800MT Sport', '450CL-C', '700CL-X'],
  Bajaj: ['Pulsar 125', 'Pulsar 150', 'Pulsar 200 NS', 'Pulsar N250', 'Pulsar RS200', 'Dominar 250', 'Dominar 400', 'Avenger 160', 'Avenger 220'],
  TVS: ['Ronin', 'Ronin 225', 'Apache RTR 160', 'Apache RTR 200', 'Apache RR 310', 'Ntorq 125', 'Jupiter 125', 'Raider 125', 'iQube Electric'],
  Kymco: ['Like 125i', 'Like 150i', 'Downtown 125i', 'Downtown 250i', 'Downtown 350i', 'AK 550', 'X-Town 250i', 'X-Town 300i', 'Xciting S 400'],
  Modenas: ['Kriss 110', 'Pulsar NS200', 'Pulsar RS200', 'Dominar 400', 'GT 128', 'Elegan 250', 'V15'],
  Aprilia: ['RS 457', 'RS 660', 'RS 660 Extrema', 'Tuono 660', 'Tuono V4', 'Shiver 900', 'Dorsoduro 900', 'SR GT 125', 'SR GT 200', 'Tuareg 660'],
  'Moto Guzzi': ['V7 Stone', 'V7 Special', 'V9 Bobber', 'V9 Roamer', 'V85 TT', 'V85 TT Travel', 'Stelvio', 'V100 Mandello'],
  Indian: ['Scout', 'Scout Bobber', 'Chief', 'Chief Bobber', 'Chieftain', 'Challenger', 'FTR 1200', 'Springfield'],
  'Can-Am': ['Ryker 600', 'Ryker 900', 'Spyder F3', 'Spyder F3-S', 'Spyder RT'],
  Husqvarna: ['Vitpilen 401', 'Vitpilen 701', 'Svartpilen 401', 'Svartpilen 701', 'Norden 901', 'TE 150', 'TE 250', 'TE 300', 'FE 350', 'FE 450', 'FE 501'],
};

const getModels = (brand: string): string[] => MODELS[brand] || [];

export default function OnboardingScreen({ navigation: _nav }: any) {
  const { user, signOut, refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [oilChangeKm, setOilChangeKm] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!plate.trim()) { setError('Plate number is required.'); return; }
    if (!user?.id) { setError('Session hilang, login ulang dulu.'); return; }
    setSaving(true);
    setError('');
    const uid = user.id;
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Rider';
    const odoNum = parseInt(odometer) || 0;
    const oilNum = parseInt(oilChangeKm) || 0;

    try {
      await supabase.from('profiles').upsert({
        id: uid,
        name: userName,
        motor_brand: brand,
        motor_model: model,
        motor_plate: plate.toUpperCase(),
        onboarded: true,
        updated_at: new Date().toISOString(),
      });

      // Insert primary bike (no upsert — the partial unique index on (user_id) where is_primary=true
      // means we should first demote any existing primary, then insert)
      await supabase.from('bikes').update({ is_primary: false }).eq('user_id', uid).eq('is_primary', true);
      await supabase.from('bikes').insert({
        user_id: uid,
        brand,
        model,
        plate_number: plate.toUpperCase(),
        year: String(new Date().getFullYear()),
        odometer_km: odoNum,
        oil_change_km: oilNum,
        is_primary: true,
      });

      await supabase.auth.updateUser({
        data: {
          motor: `${brand} ${model}`,
          plate: plate.toUpperCase(),
          onboarded: true,
        },
      });

      setStep(4);
    } catch (e: any) {
      setError(e?.message || 'Failed to save data.');
    } finally {
      setSaving(false);
    }
  };

  const finishAndEnter = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } });
    await refresh();
    // App.tsx will re-render and swap the navigator automatically
  };

  const skipOnboarding = async () => {
    await supabase.auth.updateUser({ data: { onboarded: true } });
    await refresh();
  };

  return (
    <SafeAreaView style={ts.container}>
      <ScrollView contentContainerStyle={ts.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={ts.header}>
          <View style={{ flex: 1 }}>
            <Text style={ts.brandTitle}>RIDERHUB</Text>
            <Text style={ts.headerSubtitle}>VEHICLE REGISTRATION</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={ts.exitBtn}>
            <Text style={ts.exitText}>EXIT</Text>
          </TouchableOpacity>
        </View>

        <View style={ts.progressRow}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[ts.progressSegment, step >= s && ts.activeSegment]} />
          ))}
        </View>

        {step === 1 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 01 / 04</Text>
            <Text style={ts.stepTitle}>Select Vehicle{'\n'}Brand</Text>
            <Text style={ts.stepDesc}>Choose the primary manufacturer of your motorcycle.</Text>
            <View style={ts.grid}>
              {MOTOR_BRANDS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[ts.gridItem, brand === b && ts.activeGridItem]}
                  onPress={() => { setBrand(b); setModel(''); setModelSearch(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={[ts.gridItemText, brand === b && ts.activeGridItemText]}>{b}</Text>
                  {brand === b && <Ionicons name="checkmark-circle" size={14} color={colors.accent} style={{ marginTop: 4 }} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[ts.primaryBtn, !brand && ts.disabledBtn]} disabled={!brand} onPress={() => setStep(2)}>
              <Text style={ts.primaryBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 02 / 04</Text>
            <Text style={ts.stepTitle}>{brand} Model</Text>
            <Text style={ts.stepDesc}>Which specific model do you ride?</Text>
            <TextInput
              style={ts.searchInput}
              placeholder="Search model..."
              placeholderTextColor={colors.textMuted}
              value={modelSearch}
              onChangeText={setModelSearch}
            />
            <View style={ts.modelListContainer}>
              {getModels(brand)
                .filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase()))
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
            </View>
            <View style={ts.btnRow}>
              <TouchableOpacity style={ts.secondaryBtn} onPress={() => setStep(1)}>
                <Text style={ts.secondaryBtnText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ts.primaryBtn, { flex: 2 }, !model && ts.disabledBtn]} disabled={!model} onPress={() => setStep(3)}>
                <Text style={ts.primaryBtnText}>CONTINUE →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={ts.stepContainer}>
            <Text style={ts.stepTag}>STEP 03 / 04</Text>
            <Text style={ts.stepTitle}>Vehicle Details</Text>
            <Text style={ts.stepDesc}>Plate number, odometer, and last oil change reading.</Text>

            <TeslaCard style={[ts.card, ts.plateCard]}>
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

            <TeslaCard style={[ts.card, { backgroundColor: '#111', padding: spacing.lg }]}>
              <Text style={ts.fieldLabel}>CURRENT ODOMETER (KM)</Text>
              <TextInput
                style={ts.numericInput}
                placeholder="12500"
                placeholderTextColor={colors.textMuted}
                value={odometer}
                onChangeText={(v) => setOdometer(v.replace(/[^\d]/g, ''))}
                keyboardType="numeric"
                maxLength={7}
              />
              <Text style={ts.fieldHint}>Kilometer yang terlihat di speedometer.</Text>
            </TeslaCard>

            <TeslaCard style={[ts.card, { backgroundColor: '#111', padding: spacing.lg, marginTop: spacing.md }]}>
              <Text style={ts.fieldLabel}>LAST OIL CHANGE (KM)</Text>
              <TextInput
                style={ts.numericInput}
                placeholder="10000"
                placeholderTextColor={colors.textMuted}
                value={oilChangeKm}
                onChangeText={(v) => setOilChangeKm(v.replace(/[^\d]/g, ''))}
                keyboardType="numeric"
                maxLength={7}
              />
              <Text style={ts.fieldHint}>Optional. Pakai buat tracking service interval.</Text>
            </TeslaCard>

            {error ? <Text style={ts.errorText}>{error}</Text> : null}

            <View style={[ts.btnRow, { marginTop: spacing.xl }]}>
              <TouchableOpacity style={ts.secondaryBtn} onPress={() => setStep(2)}>
                <Text style={ts.secondaryBtnText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ts.primaryBtn, { flex: 2 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={ts.primaryBtnText}>FINISH SETUP</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={ts.skipBtn} onPress={skipOnboarding}>
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
              Setup complete. Your {brand} sudah ditambahkan ke garage.
            </Text>

            <TeslaCard style={[ts.card, ts.finalCard]}>
              <View style={ts.finalRow}>
                <MaterialCommunityIcons name="motorbike" size={24} color={colors.accent} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={ts.finalTitle}>{brand} {model}</Text>
                  <Text style={ts.finalPlate}>{plate}</Text>
                </View>
              </View>
            </TeslaCard>

            <TouchableOpacity style={[ts.primaryBtn, { width: '100%' }]} onPress={finishAndEnter}>
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
  modelListContainer: { marginBottom: 24 },
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
  fieldLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  fieldHint: { color: colors.textMuted, fontSize: 10, marginTop: 8 },
  numericInput: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: 12 },
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
