import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import PartsScreen from '../screens/PartsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors, spacing, fontSize, borderRadius } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Events: undefined;
  Parts: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Screen config
const screens = [
  { name: 'Home', component: HomeScreen, icon: '🏠', label: 'Home' },
  { name: 'Events', component: EventsScreen, icon: '🎉', label: 'Event' },
  { name: 'Parts', component: PartsScreen, icon: '🛒', label: 'Parts' },
  { name: 'Community', component: CommunityScreen, icon: '👥', label: 'Komunitas' },
  { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profil' },
];

// Check if web/desktop
const isDesktop = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768;
  }
  return false;
};

// Desktop Sidebar Component
interface SidebarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🏍️</Text>
        <Text style={styles.logoText}>RiderHub</Text>
      </View>

      {/* Navigation */}
      <View style={styles.navItems}>
        {screens.map((screen) => (
          <TouchableOpacity
            key={screen.name}
            style={[
              styles.navItem,
              activeTab === screen.name && styles.navItemActive,
            ]}
            onPress={() => onTabPress(screen.name)}
          >
            <Text style={styles.navIcon}>{screen.icon}</Text>
            <Text style={[
              styles.navLabel,
              activeTab === screen.name && styles.navLabelActive,
            ]}>
              {screen.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.sidebarFooter}>
        <Text style={styles.footerText}>RiderHub v1.0.0</Text>
      </View>
    </View>
  );
};

// Desktop Layout
interface DesktopLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ activeTab, setActiveTab }) => {
  const ActiveScreen = screens.find(s => s.name === activeTab)?.component || HomeScreen;

  return (
    <View style={styles.desktopContainer}>
      <Sidebar activeTab={activeTab} onTabPress={setActiveTab} />
      <View style={styles.desktopContent}>
        <ActiveScreen />
      </View>
    </View>
  );
};

// Mobile Tab Navigator
const MobileLayout: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.mobileTabBar,
        tabBarShowLabel: false,
      }}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name as keyof RootTabParamList}
          component={screen.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabIconContainer}>
                <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                  {screen.icon}
                </Text>
                <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                  {screen.label}
                </Text>
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const [desktop, setDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    // Check screen size on mount and resize
    const checkScreenSize = () => {
      setDesktop(isDesktop());
    };

    checkScreenSize();

    // Add resize listener for web
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  return (
    <NavigationContainer>
      {desktop ? (
        <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <MobileLayout />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  // Desktop styles
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    height: '100%',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  navItems: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  navItemActive: {
    backgroundColor: colors.primary + '20',
  },
  navIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  navLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  desktopContent: {
    flex: 1,
    overflow: 'hidden',
  },

  // Mobile styles
  mobileTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    height: 80,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AppNavigator;