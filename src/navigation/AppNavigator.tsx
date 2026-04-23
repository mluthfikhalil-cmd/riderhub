import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import PartsScreen from '../screens/PartsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors, fontSize } from '../theme';

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

// Tab Icon Component
interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, label, focused }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
};

// Main Navigator - Mobile First (Always Bottom Tabs)
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
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
                <TabIcon 
                  icon={screen.icon} 
                  label={screen.label} 
                  focused={focused} 
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  // Mobile Tab Bar styles
  tabBar: {
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
    elevation: 0,
    shadowOpacity: 0,
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