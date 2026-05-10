import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Ride, Community } from '../types';

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Parts: undefined;
  Community: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Garage: undefined;
  RideHistory: undefined;
  Insurance: undefined;
  Notifications: undefined;
  Support: undefined;
  CommunityDetail: { community: Community } | undefined;
  Cart: undefined;
  Admin: undefined;
  RideReplay: { ride: Ride };
  RideSummary: { ride: Ride; newlyUnlocked?: string[] };
  Leaderboard: undefined;
  Achievements: undefined;
  Configurator: undefined;
  ServiceTracker: undefined;
};

// Augment the react-navigation ParamList so every `useNavigation` is typed
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
