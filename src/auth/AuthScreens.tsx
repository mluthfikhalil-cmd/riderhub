import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
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

const CustomButton = ({ title, onPress, loading, disabled, style, variant = 'primary' }: any) => {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity 
      style={[
        ts.btnBase, 
        isOutline ? ts.btnOutline : ts.btnPrimary,
        disabled && ts.btnDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text style={[ts.btnText, isOutline && ts.btnTextOutline]}>
        {loading ? 'PROCESSING...' : title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn } = useAuth();

  const handleLogin = useCallback(async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Required fields missing');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setErrorMessage(error.message);
  }, [email, password, signIn]);

  return (
    <SafeAreaView style={ts.container}>
      <ScrollView contentContainerStyle={ts.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={ts.hero}>
          <MaterialCommunityIcons name="lightning-bolt" size={48} color={colors.accent} />
          <Text style={ts.brandTitle}>RIDERHUB</Text>
          <Text style={ts.heroSubtitle}>AUTHENTICATION REQUIRED</Text>
        </View>

        <TeslaCard style={ts.formCard}>
          <View style={ts.inputBox}>
            <Text style={ts.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={ts.input}
              placeholder="name@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={ts.inputBox}>
            <Text style={ts.inputLabel}>PASSWORD</Text>
            <TextInput
              style={ts.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {errorMessage ? <Text style={ts.errorText}>{errorMessage}</Text> : null}

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={ts.submitBtn}
          />

          <TouchableOpacity style={ts.forgotBtn}>
            <Text style={ts.forgotText}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>
        </TeslaCard>

        <View style={ts.footer}>
          <Text style={ts.footerText}>New to the platform?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={ts.footerLink}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signUp } = useAuth();

  const handleRegister = useCallback(async () => {
    setErrorMessage('');
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('All fields required');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name);
    setLoading(false);
    if (error) setErrorMessage(error.message);
  }, [name, email, password, signUp]);

  return (
    <SafeAreaView style={ts.container}>
      <ScrollView contentContainerStyle={ts.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={ts.hero}>
          <MaterialCommunityIcons name="account-plus-outline" size={48} color={colors.accent} />
          <Text style={ts.brandTitle}>JOIN COLLECTIVE</Text>
          <Text style={ts.heroSubtitle}>CREATE YOUR RIDER PROFILE</Text>
        </View>

        <TeslaCard style={ts.formCard}>
          <View style={ts.inputBox}>
            <Text style={ts.inputLabel}>FULL NAME</Text>
            <TextInput
              style={ts.input}
              placeholder="John Doe"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={ts.inputBox}>
            <Text style={ts.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={ts.input}
              placeholder="name@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={ts.inputBox}>
            <Text style={ts.inputLabel}>PASSWORD</Text>
            <TextInput
              style={ts.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {errorMessage ? <Text style={ts.errorText}>{errorMessage}</Text> : null}

          <CustomButton
            title="Register"
            onPress={handleRegister}
            loading={loading}
            style={ts.submitBtn}
          />
        </TeslaCard>

        <View style={ts.footer}>
          <Text style={ts.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={ts.footerLink}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 48 },
  brandTitle: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 2, marginTop: 16 },
  heroSubtitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl },
  formCard: { width: '100%' },
  inputBox: { marginBottom: 24 },
  inputLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  input: { 
    backgroundColor: '#000', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: colors.text,
    borderWidth: 1,
    borderColor: '#222'
  },
  btnBase: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.accent },
  btnOutline: { borderWidth: 1, borderColor: '#333' },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  btnTextOutline: { color: colors.text },
  submitBtn: { marginTop: 16 },
  forgotBtn: { alignSelf: 'center', marginTop: 24 },
  forgotText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  footer: { marginTop: 40, alignItems: 'center', gap: 12 },
  footerText: { color: colors.textSecondary, fontSize: 13 },
  footerLink: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});

export { LoginScreen, RegisterScreen };