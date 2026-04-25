import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  primary: '#00D4AA',
  secondary: '#FF6B35',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
};

// Force button rendering with HTML
const Button = ({ title, onPress, disabled, style, secondary }: any) => {
  return (
    <View style={style}>
      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        style={{
          backgroundColor: secondary ? COLORS.secondary : (disabled ? '#666' : COLORS.primary),
          color: disabled ? '#999' : COLORS.background,
          padding: 16,
          borderRadius: 12,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16,
          fontWeight: 700,
          width: '100%',
        }}
      >
        {title}
      </button>
    </View>
  );
};

// Force link rendering with HTML
const Link = ({ title, onPress, style }: any) => {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        backgroundColor: 'transparent',
        color: COLORS.primary,
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        textDecoration: 'underline',
        padding: 0,
        margin: 0,
        ...style,
      }}
    >
      {title}
    </button>
  );
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('mluthfikhalil@gmail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { signIn, isLocalAuth } = useAuth();

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      window.alert('Error: Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid') || error.message.includes('credentials')) {
        window.alert('Login Failed ❌\n\nInvalid email or password.\n\nPlease check your credentials or create a new account.');
      } else {
        window.alert('Login Failed: ' + error.message);
      }
      return;
    }

    // Success! Show welcome message and redirect to profile
    window.alert('Login Successful! 🎉\n\nWelcome back, rider!');
    
    // Navigate to Profile (use window location for web)
    if (typeof window !== 'undefined') {
      window.location.href = '/profile';
    }
  }, [email, password, signIn, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏍️</Text>
          <Text style={styles.title}>RiderHub</Text>
          <Text style={styles.subtitle}>Welcome back, rider!</Text>
          {isLocalAuth && <Text style={styles.badge}>📱 Local Account</Text>}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              submitBehavior="submit"
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              submitBehavior="submit"
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          <Button
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link
            title="Register"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('mluthfikhalil@gmail.com');
  const [password, setPassword] = useState('123456');
  const [confirmPassword, setConfirmPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { signUp, isLocalAuth } = useAuth();

  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      window.alert('Error: Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      window.alert('Error: Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      window.alert('Error: Passwords do not match');
      return;
    }

    if (password.length < 4) {
      window.alert('Error: Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    
    const { error, needsVerification } = await signUp(email.trim(), password, name.trim());
    
    if (error) {
      setLoading(false);
      if (error.message.includes('already registered')) {
        window.alert('Account Exists ⚠️\n\nThis email is already registered.\n\nTry Login instead.');
      } else {
        window.alert('Registration Failed: ' + error.message);
      }
      return;
    }
    
    setLoading(false);
    
    // Success! Show welcome message and redirect to profile
    window.alert('Welcome to RiderHub! 🎉\n\nAccount created successfully!\n\nYour rider profile is ready. Lets ride! 🏍️');
    
    // Navigate to Profile (use window location for web)
    if (typeof window !== 'undefined') {
      window.location.href = '/profile';
    }
  }, [name, email, password, confirmPassword, signUp, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏍️</Text>
          <Text style={styles.title}>Join RiderHub</Text>
          <Text style={styles.subtitle}>Create your rider account</Text>
          {isLocalAuth && <Text style={styles.badge}>📱 Creating Local Account</Text>}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              submitBehavior="submit"
              onSubmitEditing={handleRegister}
              returnKeyType="done"
            />
          </View>

          <Button
            title={loading ? 'Creating account...' : 'Create Account'}
            onPress={handleRegister}
            disabled={loading}
            style={styles.button}
            secondary
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link
            title="Login"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary },
  badge: { 
    marginTop: 12, 
    fontSize: 12, 
    color: COLORS.primary, 
    backgroundColor: COLORS.surface,
    padding: '6px 12px',
    borderRadius: 20,
  },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: COLORS.text 
  },
  button: { marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
});

export { LoginScreen, RegisterScreen };