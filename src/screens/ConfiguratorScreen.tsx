import React, { useState, Suspense } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Bike3DViewer from '../components/Bike3DViewer';
import { BackButton } from '../components/HeaderButtons';
import { ZONE_META, FINISH_OPTIONS, type FinishId, type GarageZone } from '../constants/zoneMeta';
import { BIKE_NAMES } from '../constants/bikeRegistry';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Configurator'>;

export default function ConfiguratorScreen({ navigation }: Props) {
  const [bikeName, setBikeName] = useState('Ducati Panigale V4');
  const [selectedZone, setSelectedZone] = useState<GarageZone>('body_zone');
  const [zoneColors, setZoneColors] = useState<Record<string, string>>({
    body_zone: ZONE_META.body_zone.defaultColor,
    wheels_zone: ZONE_META.wheels_zone.defaultColor,
  });
  const [finish, setFinish] = useState<FinishId>('glossy');
  const [engineOn, setEngineOn] = useState(false);
  const [showBikePicker, setShowBikePicker] = useState(false);

  const currentZoneMeta = selectedZone === 'body_zone'
    ? ZONE_META.body_zone
    : selectedZone === 'wheels_zone'
    ? ZONE_META.wheels_zone
    : null;

  const handleZoneColorChange = (zone: string, hex: string) => {
    setZoneColors((prev) => ({ ...prev, [zone]: hex }));
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={ts.title}>3D Configurator</Text>
          <Text style={ts.subtitle}>Customize Your Ride</Text>
        </View>
        <TouchableOpacity style={ts.engineBtn} onPress={() => setEngineOn((v) => !v)}>
          <MaterialCommunityIcons
            name={engineOn ? 'engine' : 'engine-off'}
            size={20}
            color={engineOn ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* 3D Viewer */}
      <View style={ts.viewerContainer}>
        <Bike3DViewer
          bikeName={bikeName}
          garageColors={zoneColors}
          garageFinish={finish}
          selectedZone={selectedZone}
          engineOn={engineOn}
          height={340}
        />
        {/* Bike switcher overlay */}
        <TouchableOpacity style={ts.bikePickerBtn} onPress={() => setShowBikePicker(true)}>
          <Text style={ts.bikePickerText}>{bikeName}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={ts.controls} showsVerticalScrollIndicator={false}>
        {/* Zone selector */}
        <Text style={ts.sectionLabel}>ZONE</Text>
        <View style={ts.zoneRow}>
          {(['body_zone', 'wheels_zone', 'performance_zone'] as GarageZone[]).map((zone) => {
            const meta = ZONE_META[zone];
            const active = selectedZone === zone;
            return (
              <TouchableOpacity
                key={zone}
                style={[ts.zoneBtn, active && ts.zoneBtnActive]}
                onPress={() => setSelectedZone(zone)}
              >
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={18}
                  color={active ? colors.accent : colors.textSecondary}
                />
                <Text style={[ts.zoneBtnText, active && ts.zoneBtnTextActive]}>
                  {meta.labelId}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color picker for body/wheels zone */}
        {currentZoneMeta && (
          <>
            <Text style={ts.sectionLabel}>COLOR</Text>
            <View style={ts.colorGrid}>
              {currentZoneMeta.availableColors.map((c) => {
                const active = zoneColors[selectedZone] === c.hex;
                return (
                  <TouchableOpacity
                    key={c.hex}
                    style={[ts.colorSwatch, { backgroundColor: c.hex }, active && ts.colorSwatchActive]}
                    onPress={() => handleZoneColorChange(selectedZone, c.hex)}
                  >
                    {active && <Ionicons name="checkmark" size={14} color={c.hex === '#F0F0F0' ? '#000' : '#fff'} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={ts.colorName}>
              {currentZoneMeta.availableColors.find((c) => c.hex === zoneColors[selectedZone])?.name ?? 'Custom'}
            </Text>
          </>
        )}

        {/* Finish selector (body zone only) */}
        {selectedZone === 'body_zone' && (
          <>
            <Text style={ts.sectionLabel}>FINISH</Text>
            <View style={ts.finishRow}>
              {FINISH_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[ts.finishBtn, finish === f.id && ts.finishBtnActive]}
                  onPress={() => setFinish(f.id as FinishId)}
                >
                  <MaterialCommunityIcons
                    name={f.icon as any}
                    size={20}
                    color={finish === f.id ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[ts.finishBtnText, finish === f.id && ts.finishBtnTextActive]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Performance zone info */}
        {selectedZone === 'performance_zone' && (
          <View style={ts.perfInfo}>
            <MaterialCommunityIcons name="flash-outline" size={24} color={colors.warning} />
            <Text style={ts.perfInfoText}>
              Performance upgrades tersedia di Garage screen. Tap Engine button di atas untuk nyalain mesin.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bike picker modal */}
      {showBikePicker && (
        <View style={ts.pickerOverlay}>
          <View style={ts.pickerSheet}>
            <View style={ts.pickerHeader}>
              <Text style={ts.pickerTitle}>Pilih Motor</Text>
              <TouchableOpacity onPress={() => setShowBikePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BIKE_NAMES.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[ts.bikeItem, bikeName === name && ts.bikeItemActive]}
                  onPress={() => { setBikeName(name); setShowBikePicker(false); }}
                >
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={20}
                    color={bikeName === name ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[ts.bikeItemText, bikeName === name && ts.bikeItemTextActive]}>
                    {name}
                  </Text>
                  {bikeName === name && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.xs },
  engineBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  viewerContainer: { position: 'relative' },
  bikePickerBtn: { position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  bikePickerText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  controls: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.md },
  zoneRow: { flexDirection: 'row', gap: 10 },
  zoneBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  zoneBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(0,214,125,0.08)' },
  zoneBtnText: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  zoneBtnTextActive: { color: colors.accent },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  colorSwatchActive: { borderColor: colors.accent, borderWidth: 3 },
  colorName: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 8 },
  finishRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  finishBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  finishBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(0,214,125,0.08)' },
  finishBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  finishBtnTextActive: { color: colors.accent },
  perfInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(235,176,64,0.08)', borderWidth: 1, borderColor: 'rgba(235,176,64,0.3)', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.sm },
  perfInfoText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', zIndex: 999 },
  pickerSheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  pickerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  bikeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  bikeItemActive: { backgroundColor: 'rgba(0,214,125,0.05)' },
  bikeItemText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  bikeItemTextActive: { color: colors.accent },
});
