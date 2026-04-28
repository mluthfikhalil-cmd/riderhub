import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const InsuranceScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await supabase.from('bikes').select('*').eq('user_id', user.id);
      
      if (data && data.length > 0) {
        const docs = data.flatMap((bike: any) => [
          { 
            id: `stnk-${bike.id}`, 
            type: `STNK`, 
            name: `${bike.brand} ${bike.model}`,
            expiry: '2025-12-01', 
            status: 'warning',
            plate: bike.plate_number
          },
          { 
            id: `tax-${bike.id}`, 
            type: `PAJAK TAHUNAN`, 
            name: bike.plate_number,
            expiry: '2025-06-15', 
            status: 'active',
            plate: bike.plate_number
          }
        ]);
        setDocuments(docs);
      }
    } catch (error) {
      console.warn('Error fetching docs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={ts.titleBox}>
          <Text style={ts.title}>Security & Docs</Text>
          <Text style={ts.subtitle}>INSURANCE · COMPLIANCE · SAFETY</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={ts.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        <Text style={ts.sectionTitle}>VEHICLE DOCUMENTS</Text>
        
        {loading ? (
          <Text style={ts.loadingText}>Fetching documents...</Text>
        ) : documents.length === 0 ? (
          <TeslaCard style={ts.emptyCard}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={ts.emptyText}>No documents found</Text>
            <TouchableOpacity style={ts.addBtn} onPress={() => navigation.navigate('Garage')}>
              <Text style={ts.addBtnText}>ADD VEHICLE</Text>
            </TouchableOpacity>
          </TeslaCard>
        ) : (
          documents.map((doc) => (
            <TeslaCard key={doc.id} style={ts.docCard}>
              <View style={ts.docHeader}>
                <View style={ts.docIconBox}>
                  <MaterialCommunityIcons 
                    name={doc.type === 'STNK' ? 'card-account-details-outline' : 'calendar-check-outline'} 
                    size={24} 
                    color={doc.status === 'active' ? colors.accent : colors.warning} 
                  />
                </View>
                <View style={ts.docMain}>
                  <Text style={ts.docType}>{doc.type}</Text>
                  <Text style={ts.docName}>{doc.name}</Text>
                  <Text style={ts.docExpiry}>EXPIRES: {doc.expiry}</Text>
                </View>
                <View style={[ts.statusBadge, { borderColor: doc.status === 'active' ? colors.accent : colors.warning }]}>
                  <Text style={[ts.statusText, { color: doc.status === 'active' ? colors.accent : colors.warning }]}>
                    {doc.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={ts.docActions}>
                <TouchableOpacity style={ts.actionBtn}>
                  <Text style={ts.actionBtnText}>VIEW DIGITAL COPY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ts.actionBtn}>
                  <Text style={ts.actionBtnText}>RENEW</Text>
                </TouchableOpacity>
              </View>
            </TeslaCard>
          ))
        )}

        <Text style={ts.sectionTitle}>PERSONAL PROTECTION</Text>
        <TeslaCard style={ts.promoCard}>
          <View style={ts.promoHeader}>
            <MaterialCommunityIcons name="shield-airplane-outline" size={32} color={colors.accent} />
            <View>
              <Text style={ts.promoTitle}>Rider Protection Plan</Text>
              <Text style={ts.promoSubtitle}>Comprehensive personal accident coverage</Text>
            </View>
          </View>
          <Text style={ts.promoDesc}>Keep yourself protected during long rides and tours with our partner insurance programs tailored for motorcyclists.</Text>
          <TouchableOpacity style={ts.promoBtn}>
            <Text style={ts.promoBtnText}>EXPLORE PLANS</Text>
          </TouchableOpacity>
        </TeslaCard>

        <View style={ts.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  titleBox: { alignItems: 'center' },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  scrollView: { flex: 1 },
  scrollPadding: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.lg },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
  docCard: { marginBottom: spacing.md, padding: spacing.lg },
  docHeader: { flexDirection: 'row', gap: 16 },
  docIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111' },
  docMain: { flex: 1 },
  docType: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  docName: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  docExpiry: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, height: 24 },
  statusText: { fontSize: 9, fontWeight: '900' },
  docActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: '#111' },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#111', alignItems: 'center' },
  actionBtnText: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginVertical: 16 },
  addBtn: { backgroundColor: colors.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { color: colors.background, fontSize: 12, fontWeight: '800' },
  promoCard: { padding: spacing.xl },
  promoHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: spacing.lg },
  promoTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  promoSubtitle: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  promoDesc: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: spacing.xl },
  promoBtn: { backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  promoBtnText: { color: '#000', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  bottomSpace: { height: 100 },
});

export default InsuranceScreen;

