import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Platform, ImageBackground, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TeslaCard = ({ children, style }: any) => (
  <View style={[ts.card, style]}>
    {children}
  </View>
);

const features = [
  { icon: 'garage', title: 'Digital Garage', desc: 'Manage your bikes, service schedules, and documents.' },
  { icon: 'map-marker-path', title: 'Ride History', desc: 'Track your routes, distance, and performance stats.' },
  { icon: 'account-group', title: 'Community', desc: 'Join rider crews and discover local sunmori groups.' },
  { icon: 'flag-checkered', title: 'Events', desc: 'Participate in track days and national rallies.' },
  { icon: 'wrench', title: 'Marketplace', desc: 'Shop verified spare parts and high-quality gear.' },
  { icon: 'shield-check', title: 'Security', desc: 'Secure document storage for insurance and registration.' },
];

export default function LandingScreen() {
  const { signIn, signUp } = useAuth();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const openLogin = () => { setModal('login'); setErr(''); setEmail(''); setPass(''); };
  const openReg = () => { setModal('register'); setErr(''); setEmail(''); setPass(''); setName(''); };

  const doLogin = async () => {
    if (!email || !pass) { setErr('Email and password are required.'); return; }
    setBusy(true); setErr('');
    const { error: e } = await signIn(email, pass);
    if (e) setErr(e.message || 'Login failed.');
    setBusy(false);
  };

  const doReg = async () => {
    if (!name || !email || !pass) { setErr('All fields are required.'); return; }
    if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true); setErr('');
    const { error: e, needsVerification } = await signUp(email, pass, name);
    if (e) { setErr(e.message || 'Registration failed.'); setBusy(false); return; }
    if (needsVerification && Platform.OS === 'web') window.alert('📧 Check your email for verification!');
    setBusy(false); setModal(null);
  };

  return (
    <SafeAreaView style={ts.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={ts.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=2000' }}
            style={ts.heroImage}
          >
            <View style={ts.heroOverlay}>
              <View style={ts.nav}>
                <Text style={ts.brand}>RIDERHUB</Text>
                <TouchableOpacity style={ts.navLoginBtn} onPress={openLogin}>
                  <Text style={ts.navLoginText}>Login</Text>
                </TouchableOpacity>
              </View>

              <View style={ts.heroContent}>
                <Text style={ts.heroTitle}>The Future of{'\n'}Riding</Text>
                <Text style={ts.heroSubtitle}>Premium motorcycle ecosystem for the modern rider. Track, connect, and optimize your journey.</Text>
                
                <View style={ts.heroActions}>
                  <TouchableOpacity style={ts.primaryBtn} onPress={openReg}>
                    <Text style={ts.primaryBtnText}>Get Started</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ts.secondaryBtn} onPress={openLogin}>
                    <Text style={ts.secondaryBtnText}>Existing Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={ts.heroFooter}>
                <Ionicons name="chevron-down" size={24} color="#FFF" style={ts.scrollIcon} />
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* STATS SECTION */}
        <View style={ts.statsContainer}>
          <View style={ts.statItem}>
            <Text style={ts.statValue}>45K+</Text>
            <Text style={ts.statLabel}>RIDERS</Text>
          </View>
          <View style={ts.statDivider} />
          <View style={ts.statItem}>
            <Text style={ts.statValue}>120+</Text>
            <Text style={ts.statLabel}>EVENTS</Text>
          </View>
          <View style={ts.statDivider} />
          <View style={ts.statItem}>
            <Text style={ts.statValue}>500+</Text>
            <Text style={ts.statLabel}>PARTS</Text>
          </View>
        </View>

        {/* FEATURES GRID */}
        <View style={ts.section}>
          <Text style={ts.sectionLabel}>ECOSYSTEM</Text>
          <Text style={ts.sectionTitle}>Everything you need{'\n'}for the road.</Text>
          
          <View style={ts.featuresGrid}>
            {features.map((f, i) => (
              <TeslaCard key={i} style={ts.featureCard}>
                <MaterialCommunityIcons name={f.icon as any} size={32} color={colors.accent} style={ts.featureIcon} />
                <Text style={ts.featureTitle}>{f.title}</Text>
                <Text style={ts.featureDesc}>{f.desc}</Text>
              </TeslaCard>
            ))}
          </View>
        </View>

        {/* FOOTER */}
        <View style={ts.footer}>
          <Text style={ts.footerBrand}>RIDERHUB</Text>
          <Text style={ts.footerCopyright}>© 2026 RiderHub ID. All rights reserved.</Text>
          <View style={ts.footerLinks}>
            <Text style={ts.footerLink}>Privacy</Text>
            <Text style={ts.footerLink}>Terms</Text>
            <Text style={ts.footerLink}>Contact</Text>
          </View>
        </View>
      </ScrollView>

      {/* AUTH MODAL */}
      <Modal visible={modal !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>{modal === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {modal === 'register' && (
              <View style={ts.inputGroup}>
                <Text style={ts.inputLabel}>FULL NAME</Text>
                <TextInput style={ts.input} placeholder="Budi Setiawan" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
              </View>
            )}

            <View style={ts.inputGroup}>
              <Text style={ts.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={ts.input} placeholder="name@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={ts.inputGroup}>
              <Text style={ts.inputLabel}>PASSWORD</Text>
              <TextInput style={ts.input} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={pass} onChangeText={setPass} secureTextEntry />
            </View>

            {err ? <Text style={ts.errorText}>{err}</Text> : null}

            <TouchableOpacity style={ts.modalSubmitBtn} onPress={modal === 'login' ? doLogin : doReg} disabled={busy}>
              <Text style={ts.modalSubmitText}>{busy ? 'Processing...' : (modal === 'login' ? 'Sign In' : 'Create Account')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={ts.modalSwitchBtn} onPress={modal === 'login' ? openReg : openLogin}>
              <Text style={ts.modalSwitchText}>
                {modal === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroContainer: { height: Dimensions.get('window').height },
  heroImage: { flex: 1 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: spacing.xl },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 80 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  navLoginBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  navLoginText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  heroContent: { flex: 1, justifyContent: 'center', paddingBottom: 100 },
  heroTitle: { color: colors.text, fontSize: 48, fontWeight: '700', lineHeight: 56 },
  heroSubtitle: { color: '#E0E0E0', fontSize: fontSize.md, marginTop: 24, lineHeight: 24, maxWidth: 300 },
  heroActions: { marginTop: 48, gap: 16 },
  primaryBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  primaryBtnText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  secondaryBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  heroFooter: { height: 80, alignItems: 'center' },
  scrollIcon: { opacity: 0.6 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#000', paddingVertical: spacing.xxl, borderBottomWidth: 1, borderBottomColor: '#111' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: '#222', alignSelf: 'center' },
  section: { paddingHorizontal: spacing.lg, paddingVertical: 80 },
  sectionLabel: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 32, fontWeight: '700', lineHeight: 40 },
  featuresGrid: { marginTop: 48, gap: 20 },
  card: { backgroundColor: '#111', borderRadius: borderRadius.lg, padding: spacing.xl },
  featureCard: { borderExWidth: 1, borderColor: '#222' },
  featureIcon: { marginBottom: 16 },
  featureTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  featureDesc: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 8, lineHeight: 20 },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: 60, borderTopWidth: 1, borderTopColor: '#111', alignItems: 'center' },
  footerBrand: { color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  footerCopyright: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 12 },
  footerLinks: { flexDirection: 'row', gap: 24, marginTop: 24 },
  footerLink: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: 16, color: colors.text, fontSize: fontSize.md },
  errorText: { color: colors.error, fontSize: fontSize.sm, textAlign: 'center', marginBottom: 16 },
  modalSubmitBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  modalSubmitText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' },
  modalSwitchBtn: { marginTop: 24, alignItems: 'center' },
  modalSwitchText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' }
});

