import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen, RegisterScreen } from './src/auth/AuthScreens';

// Colors
const COLORS = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  primary: '#00D4AA',
  secondary: '#A78BFA',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
};

// ============================================
// HOME SCREEN
// ============================================
const HomeScreen = () => {
  const [searchText, setSearchText] = useState('');
  const { user } = useAuth();

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.length > 2) {
      Alert.alert('Search', `Searching for: ${text}`);
    }
  };

  const handleQuickAction = (action: string) => {
    const actions: any = {
      'Sunmori': 'Sunday Morning Ride',
      'Bengkel': 'Find Mechanic',
      'SPBU': 'Find Fuel Station',
      'Routes': 'View Routes',
    };
    Alert.alert('Quick Action', actions[action] || 'Opening...');
  };

  const handleFeaturedCard = (title: string) => {
    Alert.alert('Featured Event', `Opening: ${title}`);
  };

  const handlePostAction = (action: string, count: number) => {
    Alert.alert(action, action === 'Like' ? 'You liked this post!' : `${action} clicked`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hey, Rider! 🏍️</Text>
            <Text style={styles.appTitle}>
              {user ? user.email?.split('@')[0] : 'RiderHub'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Notifications', 'No new notifications')}>
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => Alert.alert('Profile', 'Opening profile...')}>
              <Text style={styles.avatarText}>{user ? user.email?.[0].toUpperCase() : 'R'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search rides, parts, events..." placeholderTextColor={COLORS.textMuted} style={styles.searchInput} value={searchText} onChangeText={handleSearch} />
          <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filter', 'Opening filters...')}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('Sunmori')}>
            <Text style={styles.pillIcon}>⚡</Text>
            <Text style={styles.pillText}>Sunmori</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('Bengkel')}>
            <Text style={styles.pillIcon}>📍</Text>
            <Text style={styles.pillText}>Bengkel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('SPBU')}>
            <Text style={styles.pillIcon}>⛽</Text>
            <Text style={styles.pillText}>SPBU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('Routes')}>
            <Text style={styles.pillIcon}>🗺️</Text>
            <Text style={styles.pillText}>Routes</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <TouchableOpacity onPress={() => Alert.alert('See All', 'Showing all featured events')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          <TouchableOpacity style={[styles.featuredCard, { backgroundColor: COLORS.primary + '15' }]} onPress={() => handleFeaturedCard('Sunday Morning Ride Jakarta → Bandung')}>
            <View style={styles.badgeRow}><View style={[styles.badge, { backgroundColor: COLORS.primary }]}><Text style={styles.badgeText}>LIVE</Text></View><Text style={styles.viewers}>2.4K watching</Text></View>
            <Text style={styles.cardTitle}>Sunday Morning Ride{'\n'}Jakarta → Bandung</Text>
            <Text style={styles.cardOrg}>MotoSquad ID</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featuredCard, { backgroundColor: COLORS.secondary + '15' }]} onPress={() => handleFeaturedCard('Kopdar CBR Regional Surabaya')}>
            <View style={styles.badgeRow}><View style={[styles.badge, { backgroundColor: COLORS.secondary }]}><Text style={styles.badgeText}>UPCOMING</Text></View><Text style={styles.viewers}>1.8K watching</Text></View>
            <Text style={styles.cardTitle}>Kopdar CBR Regional{'\n'}Surabaya Gathering</Text>
            <Text style={styles.cardOrg}>Bikers United</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featuredCard, { backgroundColor: COLORS.warning + '15' }]} onPress={() => handleFeaturedCard('Bromo Mountain Tour')}>
            <View style={styles.badgeRow}><View style={[styles.badge, { backgroundColor: COLORS.warning }]}><Text style={styles.badgeText}>POPULAR</Text></View><Text style={styles.viewers}>3.2K watching</Text></View>
            <Text style={styles.cardTitle}>Bromo Mountain Tour{'\n'}East Java Adventure</Text>
            <Text style={styles.cardOrg}>Adventure Crew</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Rides 🔥</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
          <TouchableOpacity style={styles.trendingCard} onPress={() => Alert.alert('Bromo Ride', '142 riders joined')}>
            <Text style={styles.trendingEmoji}>⛰️</Text>
            <Text style={styles.trendingTitle}>Bromo Ride</Text>
            <Text style={styles.trendingText}>142 riders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trendingCard} onPress={() => Alert.alert('Pantai Selatan', '89 riders joined')}>
            <Text style={styles.trendingEmoji}>🌊</Text>
            <Text style={styles.trendingTitle}>Pantai Selatan</Text>
            <Text style={styles.trendingText}>89 riders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trendingCard} onPress={() => Alert.alert('Night Ride JKT', '215 riders')}>
            <Text style={styles.trendingEmoji}>🏙️</Text>
            <Text style={styles.trendingTitle}>Night Ride JKT</Text>
            <Text style={styles.trendingText}>215 riders</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
        </View>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.postAvatar} onPress={() => Alert.alert('User', 'MotoVlog_ID profile')}>
              <Text style={styles.postInitial}>M</Text>
            </TouchableOpacity>
            <View style={styles.postInfo}>
              <Text style={styles.postName}>MotoVlog_ID</Text>
              <Text style={styles.postTime}>2 jam lalu</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('More', 'More options')}>
              <Text style={styles.moreBtn}>⋮</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.postContent}>First ride pakai knalpot baru 🔥 suaranya mantep banget bro! Worth every rupiah 💸</Text>
          <View style={styles.postActions}>
            <TouchableOpacity onPress={() => handlePostAction('Like', 234)}><Text>❤️ 234</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handlePostAction('Comment', 45)}><Text>💬 45</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handlePostAction('Share', 12)}><Text>📤 12</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// EVENTS SCREEN
// ============================================
const EventsScreen = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filters = ['All', 'Sunmori', 'Kopdar', 'Touring', 'Race'];
  
  const events = [
    { id: 1, date: '28', month: 'JAN', title: 'Sunmori Bandung Raya', location: 'Start: Dago Pakar', riders: '320 riders going', color: COLORS.primary },
    { id: 2, date: '04', month: 'FEB', title: 'Kopdar CBR250RR SE-Java', location: 'Alun-Alun Surabaya', riders: '185 riders going', color: COLORS.secondary },
    { id: 3, date: '12', month: 'FEB', title: 'Night Ride Jakarta', location: 'Monas → PIK', riders: '450 riders going', color: COLORS.warning },
  ];

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    Alert.alert('Filter', `Showing: ${filter} events`);
  };

  const handleJoin = (eventTitle: string) => {
    Alert.alert('Join Event', `You joined "${eventTitle}"!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Events</Text>
          <Text style={styles.screenSubtitle}>Upcoming rides & meetups</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {filters.map((filter) => (
            <TouchableOpacity key={filter} style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]} onPress={() => handleFilter(filter)}>
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.eventsList}>
          {events.map((event) => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}>
              <View style={[styles.eventDate, { backgroundColor: event.color + '15' }]}>
                <Text style={[styles.eventDateNum, { color: event.color }]}>{event.date}</Text>
                <Text style={[styles.eventDateMonth, { color: event.color }]}>{event.month}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
                <Text style={styles.eventRiders}>👥 {event.riders}</Text>
                <View style={styles.eventButtons}>
                  <TouchableOpacity style={[styles.joinBtn, { backgroundColor: event.color }]} onPress={() => handleJoin(event.title)}>
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailsBtn} onPress={() => Alert.alert('Details', event.title)}>
                    <Text>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// PARTS SCREEN
// ============================================
const PartsScreen = () => {
  const [searchText, setSearchText] = useState('');
  
  const categories = [
    { emoji: '🔧', label: 'Engine' },
    { emoji: '💨', label: 'Exhaust' },
    { emoji: '🛞', label: 'Tires' },
    { emoji: '⛑️', label: 'Gear' },
  ];
  
  const products = [
    { id: 1, emoji: '🔩', title: 'Akrapovic Slip-On R25', condition: '90% • Bandung', price: 'Rp 4.500.000', time: '3h ago', color: COLORS.primary },
    { id: 2, emoji: '🪖', title: 'KYT TT-Course Aleix', condition: 'New • Jakarta', price: 'Rp 2.800.000', time: '5h ago', color: COLORS.secondary },
    { id: 3, emoji: '🛞', title: 'Pirelli Diablo Rosso III', condition: 'New • Surabaya', price: 'Rp 1.200.000', time: '1d ago', color: COLORS.warning },
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.length > 2) {
      Alert.alert('Search', `Searching parts for: ${text}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Parts Market</Text>
          <Text style={styles.screenSubtitle}>Buy & sell motorcycle parts</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput placeholder="Search parts..." placeholderTextColor={COLORS.textMuted} style={styles.searchInput} value={searchText} onChangeText={handleSearch} />
        </View>

        <View style={styles.categories}>
          {categories.map((cat, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem} onPress={() => Alert.alert('Category', cat.label)}>
              <View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{cat.emoji}</Text></View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.productsList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Listings</Text>
          </View>
          {products.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => Alert.alert('Product', `${product.title}\n${product.price}`)}>
              <View style={[styles.productImage, { backgroundColor: product.color + '15' }]}><Text style={styles.productEmoji}>{product.emoji}</Text></View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productCondition}>{product.condition}</Text>
                <Text style={[styles.productPrice, { color: product.color }]}>{product.price}</Text>
                <Text style={styles.productTime}>🕐 Posted {product.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// COMMUNITY SCREEN
// ============================================
const CommunityScreen = () => {
  const stories = ['Rizky', 'Dimas', 'Aldi', 'Farel'];
  
  const [posts, setPosts] = useState([
    { id: 1, initial: 'R', motor: 'CBR250RR', time: '15 min ago', content: 'Baru ganti ECU racing, tarikan bawah langsung beda jauh! 🚀 Ada yang mau review lengkapnya?', likes: 482, comments: 67 },
    { id: 2, initial: 'D', motor: 'Ninja ZX-25R', time: '1 jam lalu', content: 'Weekend ride ke Lembang, jalanan kosong banget pagi-pagi 🌄 Recommended route buat yang suka cornering!', likes: 321, comments: 38 },
  ]);

  const handlePostAction = (postId: number, action: string, currentCount: number) => {
    if (action === 'Like') {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      Alert.alert('Liked!', 'You liked this post! ❤️');
    } else {
      Alert.alert(action, `${currentCount} comments`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Community</Text>
          <Text style={styles.screenSubtitle}>Connect with fellow riders</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
          <TouchableOpacity style={styles.storyItem} onPress={() => Alert.alert('Add Story', 'Create new story?')}>
            <View style={[styles.storyIconAdd, { borderColor: COLORS.primary }]}><Text style={styles.addIcon}>+</Text></View>
            <Text style={styles.storyLabel}>You</Text>
          </TouchableOpacity>
          {stories.map((name, i) => (
            <TouchableOpacity key={i} style={styles.storyItem} onPress={() => Alert.alert('Story', `${name}'s story`)}>
              <View style={[styles.storyRing, { borderColor: COLORS.primary }]}><View style={styles.storyIcon}><Text style={styles.storyInitial}>{name[0]}</Text></View></View>
              <Text style={styles.storyLabel}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.postsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <TouchableOpacity style={styles.postAvatar} onPress={() => Alert.alert('User', post.motor)}>
                  <Text style={styles.postInitial}>{post.initial}</Text>
                </TouchableOpacity>
                <View style={styles.postInfo}>
                  <Text style={styles.postName}>{post.motor}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('More', 'Options')}>
                  <Text style={styles.moreBtn}>⋮</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => handlePostAction(post.id, 'Like', post.likes)}><Text>❤️ {post.likes}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handlePostAction(post.id, 'Comment', post.comments)}><Text>💬 {post.comments}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Saved', 'Post saved! 🔖')}><Text>🔖 Save</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// PROFILE SCREEN
// ============================================
const ProfileScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  
  const badges = [
    { emoji: '🔥', title: 'Early Rider', year: '2023' },
    { emoji: '⭐', title: '100 Rides', year: 'Legend' },
    { emoji: '🛡️', title: 'Safe Rider', year: 'Gold' },
  ];
  
  const menuItems = [
    { emoji: '🏍️', label: 'My Garage' },
    { emoji: '🗺️', label: 'Ride History' },
    { emoji: '🛡️', label: 'Insurance' },
    { emoji: '⚙️', label: 'Settings' },
    { emoji: '❓', label: 'Help & Support' },
  ];

  const handleMenu = (item: string) => {
    Alert.alert(item, `Opening ${item}...`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await signOut() },
    ]);
  };

  const handleLoginPrompt = () => {
    Alert.alert('Login Required', 'Login to access all features!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Login', onPress: () => navigation.navigate('Login') },
    ]);
  };

  // If NOT logged in, show login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>Profile</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileEmoji}>🏍️</Text>
            <Text style={styles.profileName}>Welcome, Rider!</Text>
            <Text style={styles.profileHandle}>Login to access all features</Text>
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guestMenu}>
            <Text style={styles.sectionTitle}>Explore 🚀</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Events', 'Browse events as guest')}>
              <View style={styles.menuIcon}><Text>🎉</Text></View>
              <Text style={styles.menuLabel}>Browse Events</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Parts', 'Browse parts as guest')}>
              <View style={styles.menuIcon}><Text>🛒</Text></View>
              <Text style={styles.menuLabel}>Browse Parts</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Community', 'Browse community as guest')}>
              <View style={styles.menuIcon}><Text>👥</Text></View>
              <Text style={styles.menuLabel}>Browse Community</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If logged in, show profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <View style={styles.profileHeaderRow}>
            <Text style={styles.screenTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => handleMenu('Settings')}>
              <Text>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => Alert.alert('Change Photo', 'Change profile picture?')}>
            <View style={styles.profileRing}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileBigInitial}>{user ? user.email?.[0].toUpperCase() : 'R'}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user ? user.email?.split('@')[0] : 'Rider'}</Text>
          <Text style={styles.profileHandle}>{user ? user.email : '@rider'}</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.badgeText}>Honda CBR250RR</Text>
          </View>
          <View style={styles.profileStats}>
            <TouchableOpacity onPress={() => Alert.alert('Rides', '142 rides completed')}>
              <Text style={styles.statNumber}>142</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Followers', '1.2K followers')}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Following', '348 following')}>
              <Text style={styles.statNumber}>348</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Badges 🏆</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {badges.map((badge, i) => (
              <TouchableOpacity key={i} style={styles.badgeCard} onPress={() => Alert.alert('Badge', `${badge.emoji} ${badge.title}`)}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeYear}>{badge.year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleMenu(item.label)}>
              <View style={styles.menuIcon}><Text>{item.emoji}</Text></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '15' }]}><Text>🚪</Text></View>
            <Text style={[styles.menuLabel, { color: COLORS.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// AUTH CHECK COMPONENT
// ============================================
const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!loading && !user) {
      // Will rely on navigation state
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

// ============================================
// MAIN TABS
// ============================================
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={styles.tabItem}>
    <Text style={styles.tabIcon}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🎉" label="Events" focused={focused} /> }} />
      <Tab.Screen name="Parts" component={PartsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🛒" label="Parts" focused={focused} /> }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Community" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
};

// ============================================
// ROOT NAVIGATOR
// ============================================
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading RiderHub...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always show main app - login is optional in Profile */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ============================================
// APP ENTRY
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  welcomeText: { fontSize: 14, color: COLORS.textMuted },
  appTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12 },
  searchIcon: { fontSize: 16, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  filterIcon: { fontSize: 14 },

  pillsScroll: { marginTop: 16, paddingLeft: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  pillIcon: { fontSize: 14, marginRight: 6 },
  pillText: { fontSize: 12, color: COLORS.textSecondary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  featuredScroll: { paddingLeft: 20, paddingRight: 20 },
  featuredCard: { width: 260, height: 150, borderRadius: 16, padding: 16, marginRight: 12, justifyContent: 'flex-end' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.background },
  viewers: { fontSize: 12, color: COLORS.textMuted },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, lineHeight: 24 },
  cardOrg: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  trendingScroll: { paddingLeft: 20 },
  trendingCard: { width: 130, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginRight: 12 },
  trendingEmoji: { fontSize: 24 },
  trendingTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  trendingText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  postCard: { backgroundColor: COLORS.surface, borderRadius: 16, marginHorizontal: 20, marginTop: 12, padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  postInitial: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  postInfo: { flex: 1 },
  postName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  postTime: { fontSize: 12, color: COLORS.textMuted },
  moreBtn: { fontSize: 18, color: COLORS.textMuted },
  postContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  postActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight },

  screenHeader: { paddingHorizontal: 20, paddingTop: 16 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  screenSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  filtersScroll: { marginTop: 16, paddingLeft: 20 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, marginRight: 8 },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { fontSize: 12, fontWeight: '600', color: COLORS.background },

  eventsList: { paddingHorizontal: 20, marginTop: 16 },
  eventCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4 },
  eventDate: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  eventDateNum: { fontSize: 24, fontWeight: '900' },
  eventDateMonth: { fontSize: 12, fontWeight: '600' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  eventLocation: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  eventRiders: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  eventButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  joinBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.background },
  detailsBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: COLORS.surfaceLight },

  categories: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 16 },
  categoryItem: { alignItems: 'center' },
  categoryIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },

  productsList: { paddingHorizontal: 20, marginTop: 20 },
  productCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  productImage: { width: 80, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  productEmoji: { fontSize: 32 },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  productCondition: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  productPrice: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  productTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  storiesScroll: { marginTop: 16, paddingLeft: 20 },
  storyItem: { alignItems: 'center', marginRight: 16 },
  storyIconAdd: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 20, color: COLORS.primary },
  storyRing: { width: 56, height: 56, borderRadius: 28, padding: 2, borderWidth: 2 },
  storyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  storyInitial: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  storyLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },

  postsList: { paddingHorizontal: 20, marginTop: 20 },

  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: 16, marginHorizontal: 20, marginTop: 16, padding: 24, alignItems: 'center' },
  profileRing: { width: 72, height: 72, borderRadius: 36, padding: 3, borderWidth: 2, borderColor: COLORS.primary },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  profileBigInitial: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  profileHandle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  profileBadge: { marginTop: 12 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: 20, marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight },
  statNumber: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },

  badgesSection: { marginTop: 24 },
  badgesScroll: { paddingLeft: 20, marginTop: 12 },
  badgeCard: { width: 100, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 12 },
  badgeEmoji: { fontSize: 24 },
  badgeTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  badgeYear: { fontSize: 12, color: COLORS.textMuted },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  menuSection: { paddingHorizontal: 20, marginTop: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },
  logoutItem: { marginTop: 8, borderWidth: 1, borderColor: COLORS.error + '30' },
  
  // Login/Register buttons for guest
  loginButton: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, width: '80%' },
  loginButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.background },
  registerButton: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10, width: '80%', borderWidth: 1, borderColor: COLORS.primary },
  registerButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  guestMenu: { paddingHorizontal: 20, marginTop: 24 },
  profileEmoji: { fontSize: 48, marginBottom: 12 },

  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, height: 80, paddingTop: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  tabItem: { alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabLabel: { fontSize: 10, color: COLORS.textMuted },
  tabLabelFocused: { color: COLORS.primary, fontWeight: '600' },
});