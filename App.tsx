import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { colors } from './src/theme';
import { initPWA } from './src/lib/pwa';
import {
  HomeScreen,
  EventsScreen,
  PartsScreen,
  CommunityScreen,
  ProfileScreen,
  GarageScreen,
  RideHistoryScreen,
  InsuranceScreen,
  NotificationsScreen,
  SupportScreen,
  CommunityDetailScreen,
  CartScreen,
  AdminScreen,
  LandingScreen,
  OnboardingScreen,
  RideReplayScreen,
  RideSummaryScreen,
  LeaderboardScreen,
  AchievementScreen,
  ConfiguratorScreen,
  ServiceTrackerScreen,
} from './src/screens';

// RiderHub build version - tied to git commit at build time if available
const BUILD_VERSION = process.env.EXPO_PUBLIC_BUILD_VERSION || 'recovery-dev';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://riderhub-ten.vercel.app', 'riderhub://'],
  config: {
    screens: {
      Landing: 'welcome',
      Login: 'login',
      Register: 'register',
      Onboarding: 'onboarding',
      Main: {
        path: 'app',
        screens: {
          Home: 'home',
          Events: 'events',
          Parts: 'parts',
          Community: 'community',
          Profile: 'profile',
        },
      },
      Garage: 'garage',
      RideHistory: 'history',
      Insurance: 'insurance',
      Notifications: 'notifications',
      Support: 'support',
      CommunityDetail: 'community-detail',
      Cart: 'cart',
      Admin: 'admin',
      RideReplay: 'ride-replay',
      RideSummary: 'ride-summary',
      Leaderboard: 'leaderboard',
      Achievements: 'achievements',
      Configurator: 'configurator',
      ServiceTracker: 'service',
    },
  },
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TabIcon = ({
  iconFocused,
  iconBlur,
  label,
  focused,
}: {
  iconFocused: IoniconName;
  iconBlur: IoniconName;
  label: string;
  focused: boolean;
}) => (
  <View style={styles.tabIconContainer}>
    <Ionicons name={focused ? iconFocused : iconBlur} size={20} color={focused ? colors.accent : colors.textMuted} />
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar }}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconFocused="home" iconBlur="home-outline" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="Events"
      component={EventsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconFocused="calendar" iconBlur="calendar-outline" label="Events" focused={focused} /> }}
    />
    <Tab.Screen
      name="Parts"
      component={PartsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconFocused="construct" iconBlur="construct-outline" label="Parts" focused={focused} /> }}
    />
    <Tab.Screen
      name="Community"
      component={CommunityScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconFocused="people" iconBlur="people-outline" label="Explore" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon iconFocused="person-circle" iconBlur="person-circle-outline" label="Account" focused={focused} /> }}
    />
  </Tab.Navigator>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  const [forceReady, setForceReady] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] init did not resolve within 3s, forcing UI ready');
      }
      setForceReady(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !forceReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>RiderHub</Text>
        <Text style={styles.loadingSubtitle}>Minimalist Riding Experience</Text>
      </View>
    );
  }

  const needsOnboarding = !!user && !user.user_metadata?.onboarded;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Landing" component={LandingScreen} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Garage" component={GarageScreen} />
            <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
            <Stack.Screen name="Insurance" component={InsuranceScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="RideReplay" component={RideReplayScreen} />
            <Stack.Screen name="RideSummary" component={RideSummaryScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Achievements" component={AchievementScreen} />
            <Stack.Screen name="Configurator" component={ConfiguratorScreen} />
            <Stack.Screen name="ServiceTracker" component={ServiceTrackerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    console.log('[RiderHub] Build:', BUILD_VERSION);
    initPWA();
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <AppContent />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  loadingSubtitle: { color: '#8E8E93', fontSize: 12, marginTop: 8, fontWeight: '500' },
  tabBar: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    position: 'absolute',
  },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, color: '#8E8E93', marginTop: 6, fontWeight: '500' },
  tabLabelFocused: { color: '#FFF', fontWeight: '700' },
});
