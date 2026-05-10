import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TeslaCard } from '../components/TeslaCard';
import { BackButton } from '../components/HeaderButtons';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const SupportScreen = ({ navigation }: any) => {

  const handleWhatsApp = () => {
    const waUrl = 'https://wa.me/6281234567890?text=Halo%20Tim%20RiderHub,%20saya%20butuh%20bantuan';
    if (Platform.OS === 'web') window.open(waUrl, '_blank');
    else Linking.openURL(waUrl);
  };

  const faqs = [
    { q: 'Bagaimana cara mendaftarkan motor?', a: 'Buka menu Garage, klik tombol "+ Tambah Motor", lalu isi detail kendaraan Anda.', icon: 'motorbike' },
    { q: 'Mengapa tracking saya tidak akurat?', a: 'Pastikan aplikasi memiliki izin lokasi (Location Permission) yang disetel ke "Selalu Izinkan".', icon: 'crosshairs-gps' },
    { q: 'Apakah aplikasi ini berbayar?', a: 'RiderHub 100% gratis untuk semua fitur standar komunitas dan tracking.', icon: 'gift-outline' },
    { q: 'Bagaimana cara claim badge achievement?', a: 'Badge terunlock otomatis begitu kriteria tercapai (jarak, ride count, top speed, dll).', icon: 'trophy' },
    { q: 'Saya mau jual parts di marketplace, gimana?', a: 'Marketplace saat ini kurasi oleh tim. Nanti akan ada fitur seller account untuk rider.', icon: 'store' },
  ];

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={ts.titleBox}>
          <Text style={ts.title}>Support</Text>
          <Text style={ts.subtitle}>HELP CENTER · FAQ · CONTACT</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={ts.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        <TeslaCard style={[ts.card, ts.contactCard]}>
          <MaterialCommunityIcons name="chat-processing-outline" size={48} color={colors.accent} />
          <Text style={ts.contactTitle}>Need Assistance?</Text>
          <Text style={ts.contactDesc}>Our support team is available 24/7 to help you with technical issues or general inquiries.</Text>
          <TouchableOpacity style={ts.waBtn} onPress={handleWhatsApp}>
            <Text style={ts.waBtnText}>CHAT VIA WHATSAPP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ts.emailBtn} onPress={() => Linking.openURL('mailto:support@riderhub.id')}>
            <Text style={ts.emailBtnText}>EMAIL SUPPORT</Text>
          </TouchableOpacity>
        </TeslaCard>

        <Text style={ts.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
        
        {faqs.map((faq, index) => (
          <TeslaCard key={index} style={[ts.card, ts.faqCard]}>
            <View style={ts.faqHeader}>
              <View style={ts.faqIconBox}>
                <MaterialCommunityIcons name={faq.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={ts.faqQ}>{faq.q}</Text>
            </View>
            <Text style={ts.faqA}>{faq.a}</Text>
          </TeslaCard>
        ))}

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
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
  contactCard: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.xl },
  contactTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: spacing.lg },
  contactDesc: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: spacing.md, lineHeight: 22, marginBottom: spacing.xl },
  waBtn: { width: '100%', height: 50, borderRadius: 25, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  waBtnText: { color: '#000', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  emailBtn: { width: '100%', height: 50, borderRadius: 25, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  emailBtnText: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.lg },
  faqCard: { marginBottom: spacing.md },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  faqIconBox: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: 'rgba(0,214,125,0.1)', borderWidth: 1, borderColor: 'rgba(0,214,125,0.3)', justifyContent: 'center', alignItems: 'center' },
  faqQ: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  faqA: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginLeft: 48 },
  bottomSpace: { height: 100 },
});

export default SupportScreen;

