import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Alert, ActivityIndicator, FlatList, Linking, Modal, Pressable, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { supabase } from './src/lib/supabase';
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
// WEB-BUTTON COMPONENT (for web compatibility)
// ============================================
const WebButton = ({ title, onPress, style, textStyle, disabled }: any) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPress && !disabled) {
      onPress();
    }
  };
  
  if (Platform.OS === 'web') {
    return (
      <div 
        onClick={handleClick}
        style={{
          backgroundColor: style?.backgroundColor || '#00D4AA',
          color: textStyle?.color || '#FFFFFF',
          padding: '14px 20px',
          borderRadius: style?.borderRadius || 16,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16,
          fontWeight: 700,
          width: '100%',
          marginBottom: 12,
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        {title}
      </div>
    );
  }
  return (
    <TouchableOpacity style={[style, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================
// HOME SCREEN - WITH REAL DATA FETCH
// ============================================
const HomeScreen = ({ navigation }: any) => {
  const [searchText, setSearchText] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(5);
      
      if (eventsData) setEvents(eventsData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (postsData) setPosts(postsData);
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.length > 2) {
      // Navigate to parts search based on text
      navigation.navigate('Parts', { searchQuery: text });
    }
  };

  const handleQuickAction = (action: string) => {
    const destinations: any = {
      'Sunmori': { screen: 'Events', filter: 'Sunmori' },
      'Bengkel': { screen: 'Parts', filter: 'Service' },
      'SPBU': { screen: 'Parts', filter: 'Fuel' },
      'Routes': { screen: 'Home' },
    };
    const dest = destinations[action];
    if (dest) {
      if (dest.filter) {
        navigation.navigate(dest.screen, { filter: dest.filter });
      } else {
        Alert.alert(action, 'Coming soon!');
      }
    }
  };

  const handleFeaturedCard = (event: any) => {
    navigation.navigate('EventDetail', { event });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hey, Rider! 🏍️</Text>
            <Text style={styles.appTitle}>RiderHub</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>R</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            placeholder="Search rides, parts, events..." 
            placeholderTextColor={COLORS.textMuted} 
            style={styles.searchInput} 
            value={searchText} 
            onChangeText={handleSearch} 
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('Sunmori')}>
            <Text style={styles.pillIcon}>⚡</Text>
            <Text style={styles.pillText}>Sunmori</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => handleQuickAction('Bengkel')}>
            <Text style={styles.pillIcon}>🔧</Text>
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
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {events.slice(0, 3).map((event, i) => (
            <TouchableOpacity key={i} style={[styles.featuredCard, { backgroundColor: getEventColor(i) + '15' }]} onPress={() => handleFeaturedCard(event)}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: getEventColor(i) }]}><Text style={styles.badgeText}>{event.status?.toUpperCase() || 'UPCOMING'}</Text></View>
                <Text style={styles.viewers}>{event.participants_count} going</Text>
              </View>
              <Text style={styles.cardEmoji}>{event.image_emoji || '🏍️'}</Text>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardOrg}>{event.organizer_name}</Text>
            </TouchableOpacity>
          ))}
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
        {posts.slice(0, 3).map((post, i) => (
          <TouchableOpacity key={i} style={styles.postCard} onPress={() => navigation.navigate('UserProfile', { user: { user_name: post.user_name, motor: post.motor } })}>
            <View style={styles.postHeader}>
              <TouchableOpacity style={styles.postAvatar} onPress={() => navigation.navigate('UserProfile', { user: { user_name: post.user_name, motor: post.motor } })}>
                <Text style={styles.postInitial}>{post.user_name?.[0] || 'U'}</Text>
              </TouchableOpacity>
              <View style={styles.postInfo}>
                <Text style={styles.postName}>{post.user_name}</Text>
                <Text style={styles.postTime}>{post.motor}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('More', 'More options')}>
                <Text style={styles.moreBtn}>⋮</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postEmoji}>{post.image_emoji}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => handleLike(post.id)}><Text>❤️ {post.likes_count}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Comments', `${post.comments_count} comments`)}><Text>💬 {post.comments_count}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Share', 'Share this post?')}><Text>📤</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const handleLike = async (postId: number) => {
  Alert.alert('Liked! ❤️', 'You liked this post!');
};

const getEventColor = (index: number) => {
  const colors = [COLORS.primary, COLORS.secondary, COLORS.warning];
  return colors[index % colors.length];
};

// ============================================
// EVENTS SCREEN - WITH REAL DATA
// ============================================
const EventsScreen = ({ navigation }: any) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const filters = ['All', 'Sunmori', 'Kopdar', 'Touring', 'Night Ride', 'Race'];
  
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (data) setEvents(data);
    } catch (err) {
      console.log('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
  };

  const filteredEvents = activeFilter === 'All' ? events : events.filter(e => e.category === activeFilter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
          {filteredEvents.map((event, i) => (
            <TouchableOpacity key={i} style={[styles.eventCard, { borderLeftColor: getEventColor(i) }]} onPress={() => {
              // Navigate to event detail - handled by parent navigator
            }}>
              <View style={[styles.eventDate, { backgroundColor: getEventColor(i) + '15' }]}>
                <Text style={[styles.eventDateNum, { color: getEventColor(i) }]}>{new Date(event.event_date).getDate()}</Text>
                <Text style={[styles.eventDateMonth, { color: getEventColor(i) }]}>{new Date(event.event_date).toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventLocation}>📍 {event.location_start}</Text>
                <Text style={styles.eventRiders}>👥 {event.participants_count} riders going</Text>
                <View style={styles.eventButtons}>
                  <TouchableOpacity 
                    style={[styles.joinBtn, { backgroundColor: getEventColor(i) }]} 
                    onPress={() => handleJoin(event)}
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.detailsBtn} 
                    onPress={() => navigation.navigate('EventDetail', { event })}
                  >
                    <Text>Details</Text>
                  </TouchableOpacity>
                </View>
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
// EVENT DETAIL SCREEN - NEW!
// ============================================
const EventDetailScreen = ({ route, navigation }: any) => {
  const { event } = route.params;
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Login required to join events. Go to login?')) {
          navigation.navigate('Login');
        }
      } else {
        Alert.alert('Login Required', 'Please login to join events', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
      }
      return;
    }

    setLoading(true);
    try {
      // Update participant count
      const newCount = (event.participants_count || 0) + 1;
      await supabase
        .from('events')
        .update({ participants_count: newCount })
        .eq('id', event.id);

      setIsRegistered(true);
      setShowSuccess(true);
      
      // Show success in UI instead of Alert
    } catch (err) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Error: Could not register. Please try again.');
      } else {
        Alert.alert('Error', 'Could not register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      const shareText = `🎉 Join me at ${event.title}!\n📅 ${formatDate(event.event_date)}\n📍 ${event.location_start}\n\nCopy this link to share!`;
      if (window.confirm(shareText + '\n\nCopy to clipboard?')) {
        navigator.clipboard?.writeText(`https://riderhub-ten.vercel.app/events/${event.id}`);
        alert('Link copied!');
      }
    } else {
      Alert.alert('Share Event', `Sharing "${event.title}" to your stories?`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.detailHero}>
          <Text style={styles.detailEmoji}>{event.image_emoji || '🏍️'}</Text>
          <View style={[styles.detailBadge, { backgroundColor: getEventColor(0) }]}>
            <Text style={styles.detailBadgeText}>{event.status?.toUpperCase() || 'UPCOMING'}</Text>
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{event.title}</Text>
          <Text style={styles.detailOrg}>By {event.organizer_name}</Text>
          
          <View style={styles.detailStats}>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{event.participants_count}</Text>
              <Text style={styles.detailStatLabel}>Riders</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{event.max_participants}</Text>
              <Text style={styles.detailStatLabel}>Max</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{getDaysLeft(event.event_date)}</Text>
              <Text style={styles.detailStatLabel}>Days Left</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>📅 Date & Time</Text>
            <Text style={styles.detailText}>{formatDate(event.event_date)}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>📍 Location</Text>
            <Text style={styles.detailText}>{event.location_start}</Text>
            {event.location_end && <Text style={styles.detailText}>→ {event.location_end}</Text>}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>📝 Description</Text>
            <Text style={styles.detailText}>{event.description || 'No description provided.'}</Text>
          </View>

          {showSuccess ? (
            <View style={styles.successMessage}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>You're In!</Text>
              <Text style={styles.successText}>You joined "{event.title}"</Text>
              <Text style={styles.successStats}>👥 {event.participants_count + 1} riders going</Text>
            </View>
          ) : (
            <WebButton
              title={loading ? '⏳ Registering...' : '🎉 Join Event'}
              onPress={handleRegister}
              style={styles.registerBtn}
              textStyle={styles.registerBtnText}
              disabled={isRegistered || loading}
            />
          )}

          <WebButton
            title="📤 Share Event"
            onPress={handleShare}
            style={styles.shareBtn}
            textStyle={styles.shareBtnText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// PARTS SCREEN - WITH REAL DATA
// ============================================
const PartsScreen = ({ route, navigation }: any) => {
  const [searchText, setSearchText] = useState(route?.params?.searchQuery || '');
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categories = [
    { emoji: '🔧', label: 'Engine' },
    { emoji: '💨', label: 'Exhaust' },
    { emoji: '🛞', label: 'Tires' },
    { emoji: '⛑️', label: 'Gear' },
  ];
  
  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    if (route?.params?.searchQuery) {
      setSearchText(route.params.searchQuery);
    }
  }, [route?.params?.searchQuery]);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setParts(data);
    } catch (err) {
      console.log('Fetch parts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.length > 2) {
      // Search is handled in display
    }
  };

  const filteredParts = searchText.length > 2 
    ? parts.filter(p => p.title?.toLowerCase().includes(searchText.toLowerCase()) || p.description?.toLowerCase().includes(searchText.toLowerCase()))
    : parts;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Parts Market</Text>
          <Text style={styles.screenSubtitle}>Buy & sell motorcycle parts</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            placeholder="Search parts..." 
            placeholderTextColor={COLORS.textMuted} 
            style={styles.searchInput} 
            value={searchText} 
            onChangeText={handleSearch} 
          />
        </View>

        <View style={styles.categories}>
          {categories.map((cat, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem}>
              <View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{cat.emoji}</Text></View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.productsList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{searchText.length > 2 ? 'Search Results' : 'Latest Listings'}</Text>
          </View>
          {filteredParts.map((part, i) => (
            <TouchableOpacity key={i} style={styles.productCard} onPress={() => navigation.navigate('PartDetail', { part })}>
              <View style={[styles.productImage, { backgroundColor: getEventColor(i) + '15' }]}><Text style={styles.productEmoji}>{part.image_emoji}</Text></View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{part.title}</Text>
                <Text style={styles.productCondition}>{part.condition} • {part.location}</Text>
                <Text style={[styles.productPrice, { color: getEventColor(i) }]}>Rp {part.price?.toLocaleString('id-ID')}</Text>
                <Text style={styles.productTime}>🕐 Posted {formatTimeAgo(part.created_at)}</Text>
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
// PART DETAIL SCREEN - NEW! (Contact Seller)
// ============================================
const PartDetailScreen = ({ route, navigation }: any) => {
  const { part } = route.params;
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);

  const handleContact = () => {
    if (!user) {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Login required to contact sellers. Go to login?')) {
          navigation.navigate('Login');
        }
      } else {
        Alert.alert('Login Required', 'Please login to contact sellers', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
      }
      return;
    }
    setShowContact(true);
  };

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in "${part.title}" - Rp ${part.price?.toLocaleString('id-ID')} listed on RiderHub`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`💬 WhatsApp\n\nMessage:\n${message}\n\nClick OK to open WhatsApp.`)) {
        window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
      }
    } else {
      Alert.alert('WhatsApp', `Message to send:\n\n${message}`);
    }
    setShowContact(false);
  };

  const handleCall = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`📞 Call ${part.seller_name}?\n\nClick OK to call.`)) {
        window.open(`tel:+6281234567890`, '_blank');
      }
    } else {
      Alert.alert('Call Seller', `Calling ${part.seller_name}...`);
    }
    setShowContact(false);
  };

  const handleBuy = () => {
    const priceText = `Rp ${part.price?.toLocaleString('id-ID')}`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`🛒 Purchase\n\n"${part.title}"\nPrice: ${priceText}\n\nProceed to payment?`)) {
        alert('Redirecting to payment... (Demo mode)');
      }
    } else {
      Alert.alert('Purchase', `Buying "${part.title}" for ${priceText}?\n\nProceed to payment?`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.detailHero}>
          <View style={[styles.detailImageLarge, { backgroundColor: getEventColor(0) + '15' }]}>
            <Text style={styles.detailEmojiLarge}>{part.image_emoji}</Text>
          </View>
          <View style={[styles.conditionBadge, { backgroundColor: part.condition === 'New' ? COLORS.primary : COLORS.warning }]}>
            <Text style={styles.conditionBadgeText}>{part.condition}</Text>
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{part.title}</Text>
          
          <Text style={[styles.detailPrice, { color: COLORS.primary }]}>Rp {part.price?.toLocaleString('id-ID')}</Text>
          
          <View style={styles.detailStats}>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{part.condition}</Text>
              <Text style={styles.detailStatLabel}>Condition</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{part.category}</Text>
              <Text style={styles.detailStatLabel}>Category</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatNum}>{part.location}</Text>
              <Text style={styles.detailStatLabel}>Location</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>📝 Description</Text>
            <Text style={styles.detailText}>{part.description || 'No description provided.'}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>👤 Seller</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>{part.seller_name?.[0]}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{part.seller_name}</Text>
                <Text style={styles.sellerLocation}>📍 {part.location}</Text>
              </View>
              <TouchableOpacity style={styles.sellerChat} onPress={() => navigation.navigate('UserProfile', { user: { user_name: part.seller_name, location: part.location } })}>
                <Text>👤 View</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!showContact ? (
            <WebButton
              title="💬 Contact Seller"
              onPress={handleContact}
              style={styles.registerBtn}
              textStyle={styles.registerBtnText}
            />
          ) : (
            <View style={styles.contactOptions}>
              <WebButton
                title="💬 WhatsApp"
                onPress={handleWhatsApp}
                style={styles.contactOption}
                textStyle={styles.contactOptionText}
              />
              <WebButton
                title="📞 Call"
                onPress={handleCall}
                style={styles.contactOption}
                textStyle={styles.contactOptionText}
              />
            </View>
          )}

          <WebButton
            title="🛒 Buy Now"
            onPress={handleBuy}
            style={styles.shareBtn}
            textStyle={styles.shareBtnText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// COMMUNITY SCREEN - WITH REAL DATA
// ============================================
const CommunityScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const stories = ['Rizky', 'Dimas', 'Aldi', 'Farel', 'Budi', 'Andi'];
  
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setPosts(data);
    } catch (err) {
      console.log('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStory = (name: string) => {
    Alert.alert('Story', `Opening ${name}'s story...`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
            <TouchableOpacity key={i} style={styles.storyItem} onPress={() => handleStory(name)}>
              <View style={[styles.storyRing, { borderColor: COLORS.primary }]}><View style={styles.storyIcon}><Text style={styles.storyInitial}>{name[0]}</Text></View></View>
              <Text style={styles.storyLabel}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.postsList}>
          {posts.map((post, i) => (
            <View key={i} style={styles.postCard}>
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={[styles.postAvatar, { backgroundColor: getEventColor(i) + '20' }]} 
                  onPress={() => navigation.navigate('UserProfile', { user: { user_name: post.user_name, motor: post.motor } })}
                >
                  <Text style={[styles.postInitial, { color: getEventColor(i) }]}>{post.user_name?.[0]}</Text>
                </TouchableOpacity>
                <View style={styles.postInfo}>
                  <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { user: { user_name: post.user_name, motor: post.motor } })}>
                    <Text style={styles.postName}>{post.user_name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.postTime}>{post.motor}</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('More', 'More options')}>
                  <Text style={styles.moreBtn}>⋮</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.postEmoji}>{post.image_emoji}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => handleLike(post.id)}>
                  <Text>❤️ {post.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Comments', `${post.comments_count} comments`)}>
                  <Text>💬 {post.comments_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Saved', 'Post saved! 🔖')}>
                  <Text>🔖 Save</Text>
                </TouchableOpacity>
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
// USER PROFILE SCREEN - NEW!
// ============================================
const UserProfileScreen = ({ route, navigation }: any) => {
  const { user: initialUser } = route.params || {};
  const { user: authUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(142);
  const [following, setFollowingCount] = useState(89);

  // If no specific user, show own profile
  const isOwnProfile = !initialUser || (authUser && initialUser.user_name === authUser.email?.split('@')[0]);

  const user = initialUser || { user_name: authUser?.email?.split('@')[0], motor: 'Honda CBR250RR' };

  const handleFollow = () => {
    if (!authUser) {
      Alert.alert('Login Required', 'Please login to follow users', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    setIsFollowing(!isFollowing);
    setFollowers(prev => isFollowing ? prev - 1 : prev + 1);
    
    Alert.alert(
      isFollowing ? 'Unfollowed!' : 'Following!', 
      `You ${isFollowing ? 'unfollowed' : 'followed'} @${user.user_name}`
    );
  };

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.user_name || '');
  const [editMotor, setEditMotor] = useState(user?.motor || 'Honda CBR250RR');
  const [updating, setUpdating] = useState(false);

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { name: editName, motor: editMotor }
      });
      if (error) throw error;
      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
      setIsEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar?')) {
        await signOut();
      }
    } else {
      Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: async () => await signOut() }
      ]);
    }
  };

  const handleMessage = () => {
    if (!authUser) {
      Alert.alert('Login Required', 'Please login to send messages');
      return;
    }
    Alert.alert('Chat', `Membuka percakapan dengan ${user.user_name}... (Fitur Chat segera hadir)`);
  };

  const handleShare = () => {
    Alert.alert('Share Profile', `Share ${user.user_name}'s profile?`);
  };


  // Mock user data
  const userData = {
    rides: 142,
    badges: 5,
    posts: 89,
    joined: 'Jan 2024',
    location: 'Jakarta',
    bio: '🏍️ passionate rider |热爱 Touring | 📍 Jakarta',
  };

  if (!isOwnProfile) {
    // Other user's profile (public)
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <TouchableOpacity>
              <View style={[styles.profileAvatar, { backgroundColor: getEventColor(0) + '20' }]}>
                <Text style={[styles.profileBigInitial, { color: getEventColor(0) }]}>{user.user_name?.[0]}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.profileName}>{user.user_name}</Text>
            {user.motor && <Text style={styles.profileHandle}>{user.motor}</Text>}
            
            <View style={styles.profileStats}>
              <TouchableOpacity onPress={() => Alert.alert('Followers', `${followers} followers`)}>
                <Text style={styles.statNumber}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Following', `${following} following`)}>
                <Text style={styles.statNumber}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Rides', `${userData.rides} rides`)}>
                <Text style={styles.statNumber}>{userData.rides}</Text>
                <Text style={styles.statLabel}>Rides</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.followBtn, isFollowing && styles.followingBtn]} 
                onPress={handleFollow}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                <Text style={styles.messageBtnText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          {userData.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{userData.bio}</Text>
            </View>
          )}

          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>🏆 Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🔥</Text><Text style={styles.badgeTitle}>Early Rider</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>⭐</Text><Text style={styles.badgeTitle}>100 Rides</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🛡️</Text><Text style={styles.badgeTitle}>Safe Rider</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🏔️</Text><Text style={styles.badgeTitle}>Explorer</Text></View>
            </ScrollView>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>🏍️ Joined "Sunmori Jakarta - Bandung"</Text>
              <Text style={styles.activityTime}>2 days ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>❤️ Liked "Weekend ride to Lembang"</Text>
              <Text style={styles.activityTime}>5 days ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>💬 Commented on post</Text>
              <Text style={styles.activityTime}>1 week ago</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Own profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <View style={styles.profileHeaderRow}>
            <Text style={styles.screenTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={handleEdit}>
              <Text>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleEdit}>
            <View style={styles.profileRing}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileBigInitial}>{user.user_name?.[0].toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user.user_name}</Text>
          <Text style={styles.profileHandle}>{user.motor}</Text>
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
            <TouchableOpacity style={styles.badgeCard} onPress={() => Alert.alert('Early Rider', 'Joined in 2024!')}>
              <Text style={styles.badgeEmoji}>🔥</Text>
              <Text style={styles.badgeTitle}>Early Rider</Text>
              <Text style={styles.badgeYear}>2024</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.badgeCard} onPress={() => Alert.alert('100 Rides', 'Completed 100 rides!')}>
              <Text style={styles.badgeEmoji}>⭐</Text>
              <Text style={styles.badgeTitle}>100 Rides</Text>
              <Text style={styles.badgeYear}>Legend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.badgeCard} onPress={() => Alert.alert('Safe Rider', 'No accidents!')}>
              <Text style={styles.badgeEmoji}>🛡️</Text>
              <Text style={styles.badgeTitle}>Safe Rider</Text>
              <Text style={styles.badgeYear}>Gold</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('My Garage', 'Your bikes')}>
            <View style={styles.menuIcon}><Text>🏍️</Text></View>
            <Text style={styles.menuLabel}>My Garage</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Ride History', 'Your rides')}>
            <View style={styles.menuIcon}><Text>🗺️</Text></View>
            <Text style={styles.menuLabel}>Ride History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Insurance', 'Your insurance')}>
            <View style={styles.menuIcon}><Text>🛡️</Text></View>
            <Text style={styles.menuLabel}>Insurance</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Settings', 'App settings')}>
            <View style={styles.menuIcon}><Text>⚙️</Text></View>
            <Text style={styles.menuLabel}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          {authUser && (
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '15' }]}><Text>🚪</Text></View>
              <Text style={[styles.menuLabel, { color: COLORS.error }]}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Profile Modal (UserProfileScreen) */}
        <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editName} 
                onChangeText={setEditName} 
                placeholder="Masukkan nama..."
                placeholderTextColor={COLORS.textMuted}
              />
              
              <Text style={styles.inputLabel}>Motor Utama</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editMotor} 
                onChangeText={setEditMotor} 
                placeholder="Contoh: Honda CBR250RR"
                placeholderTextColor={COLORS.textMuted}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={updating}>
                  <Text style={styles.saveBtnText}>{updating ? 'Menyimpan...' : 'Simpan'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// PROFILE SCREEN (GUEST VERSION)
// ============================================
const ProfileScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  
  const menuItems = [
    { emoji: '🏍️', label: 'My Garage' },
    { emoji: '🗺️', label: 'Ride History' },
    { emoji: '🛡️', label: 'Insurance' },
    { emoji: '⚙️', label: 'Settings' },
  ];

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [editMotor, setEditMotor] = useState(user?.user_metadata?.motor || 'Honda CBR250RR');
  const [updating, setUpdating] = useState(false);

  const handleMenu = (item: string) => {
    Alert.alert(item, `Fitur ${item} akan segera hadir!`);
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { name: editName, motor: editMotor }
      });
      
      if (error) throw error;
      
      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
      setIsEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        await signOut();
      }
    } else {
      Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: async () => await signOut() }
      ]);
    }
  };

  if (user) {
    // Show logged-in user's own profile
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.screenHeader}>
            <View style={styles.profileHeaderRow}>
              <Text style={styles.screenTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn} onPress={handleEdit}>
              <Text>⚙️</Text>
            </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileCard}>
            <TouchableOpacity onPress={handleEdit}>
              <View style={styles.profileRing}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileBigInitial}>{user.email?.[0].toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.profileName}>{user.user_metadata?.name || user.email?.split('@')[0]}</Text>
            <Text style={styles.profileHandle}>{user.email}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.badgeText}>{user.user_metadata?.motor || 'Honda CBR250RR'}</Text>
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
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🔥</Text><Text style={styles.badgeTitle}>Early Rider</Text><Text style={styles.badgeYear}>2024</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>⭐</Text><Text style={styles.badgeTitle}>100 Rides</Text><Text style={styles.badgeYear}>Jan 2025</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🛡️</Text><Text style={styles.badgeTitle}>Safe Rider</Text><Text style={styles.badgeYear}>Feb 2025</Text></View>
              <View style={styles.badgeCard}><Text style={styles.badgeEmoji}>🏔️</Text><Text style={styles.badgeTitle}>Explorer</Text><Text style={styles.badgeYear}>Mar 2025</Text></View>
            </ScrollView>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>My Garage 🏍️</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}><Text>🏍️</Text></View>
              <Text style={styles.menuLabel}>Honda CBR250RR</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Menu</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenu('Ride History')}>
              <View style={styles.menuIcon}><Text>🗺️</Text></View>
              <Text style={styles.menuLabel}>Ride History</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenu('Statistics')}>
              <View style={styles.menuIcon}><Text>📊</Text></View>
              <Text style={styles.menuLabel}>Statistics</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenu('Insurance')}>
              <View style={styles.menuIcon}><Text>🛡️</Text></View>
              <Text style={styles.menuLabel}>Insurance</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenu('Settings')}>
              <View style={styles.menuIcon}><Text>⚙️</Text></View>
              <Text style={styles.menuLabel}>Settings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '15' }]}><Text>🚪</Text></View>
              <Text style={[styles.menuLabel, { color: COLORS.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Modal */}
          <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Profil</Text>
                
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editName} 
                  onChangeText={setEditName} 
                  placeholder="Masukkan nama..."
                  placeholderTextColor={COLORS.textMuted}
                />
                
                <Text style={styles.inputLabel}>Motor Utama</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editMotor} 
                  onChangeText={setEditMotor} 
                  placeholder="Contoh: Honda CBR250RR"
                  placeholderTextColor={COLORS.textMuted}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={updating}>
                    <Text style={styles.saveBtnText}>{updating ? 'Menyimpan...' : 'Simpan'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Guest (not logged in) - show login options
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
          
          <WebButton 
            title="Login" 
            onPress={() => navigation.navigate('Login')} 
            style={{ backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 20, width: '80%' }}
            textStyle={{ color: COLORS.background, fontSize: 16, fontWeight: 700 }}
          />
          
          <WebButton 
            title="Create Account" 
            onPress={() => navigation.navigate('Register')} 
            style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 10, width: '80%', borderWidth: 1, borderColor: COLORS.primary }}
            textStyle={{ color: COLORS.primary, fontSize: 16, fontWeight: 600 }}
          />
        </View>

        <View style={styles.guestMenu}>
          <Text style={styles.sectionTitle}>Explore 🚀</Text>
          <WebButton 
            title="🎉 Browse Events" 
            onPress={() => navigation.navigate('Events')}
            style={styles.menuItem}
            textStyle={{ fontSize: 14, color: COLORS.text }}
          />
          <WebButton 
            title="🛒 Browse Parts" 
            onPress={() => navigation.navigate('Parts')}
            style={styles.menuItem}
            textStyle={{ fontSize: 14, color: COLORS.text }}
          />
          <WebButton 
            title="👥 Browse Community" 
            onPress={() => navigation.navigate('Community')}
            style={styles.menuItem}
            textStyle={{ fontSize: 14, color: COLORS.text }}
          />
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const handleJoin = async (event: any) => {
  try {
    const newCount = (event.participants_count || 0) + 1;
    await supabase
      .from('events')
      .update({ participants_count: newCount })
      .eq('id', event.id);
    
    Alert.alert('Joined! 🎉', `You joined "${event.title}"!\n\nTotal participants: ${newCount}`);
  } catch (err) {
    Alert.alert('Error', 'Could not join event. Please try again.');
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getDaysLeft = (dateStr: string) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

// ============================================
// NAVIGATION SETUP
// ============================================
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

const linking = {
  prefixes: ['https://riderhub-ten.vercel.app', 'riderhub://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Events: 'events',
          Parts: 'parts',
          Community: 'community',
          Profile: 'profile',
        },
      },
      Login: 'login',
      Register: 'register',
      EventDetail: 'event/:id',
      PartDetail: 'part/:id',
      UserProfile: 'user/:id',
    },
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="PartDetail" component={PartDetailScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// ============================================
// STYLES (Expanded for new screens)
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
  featuredCard: { width: 200, minHeight: 160, borderRadius: 16, padding: 16, marginRight: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.background },
  viewers: { fontSize: 12, color: COLORS.textMuted },
  cardEmoji: { fontSize: 24, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
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
  postEmoji: { fontSize: 24, marginBottom: 8 },
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

  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, height: 80, paddingTop: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  tabItem: { alignItems: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabLabel: { fontSize: 10, color: COLORS.textMuted },
  tabLabelFocused: { color: COLORS.primary, fontWeight: '600' },

  loginButton: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, width: '80%' },
  loginButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.background },
  registerButton: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10, width: '80%', borderWidth: 1, borderColor: COLORS.primary },
  registerButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  guestMenu: { paddingHorizontal: 20, marginTop: 24 },
  profileEmoji: { fontSize: 48, marginBottom: 12 },

  // Detail screens styles
  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtnText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  
  detailHero: { alignItems: 'center', paddingVertical: 24 },
  detailEmoji: { fontSize: 64 },
  detailEmojiLarge: { fontSize: 80 },
  detailImageLarge: { width: 160, height: 160, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  detailBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 12 },
  detailBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.background },
  conditionBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  conditionBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.background },
  
  detailContent: { paddingHorizontal: 20 },
  detailTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  detailOrg: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  detailPrice: { fontSize: 28, fontWeight: '900', marginBottom: 16 },
  
  detailStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  detailStatItem: { alignItems: 'center' },
  detailStatNum: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  detailStatLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  detailText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  
  registerBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  registeredBtn: { backgroundColor: COLORS.surface },
  registerBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.background },
  shareBtn: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, alignItems: 'center' },
  shareBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, borderSize: 1, borderColor: COLORS.surfaceLight },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  inputLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 14 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.surfaceLight },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: COLORS.background, fontWeight: '700' },
  sellerInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sellerLocation: { fontSize: 12, color: COLORS.textMuted },
  sellerChat: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 8 },
  
  contactOptions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  contactOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '15', borderRadius: 12, padding: 16 },
  contactOptionIcon: { fontSize: 20, marginRight: 8 },
  contactOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  
  // User profile styles
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  profileActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  followBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  followingBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary },
  followBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.background },
  followingBtnText: { color: COLORS.primary },
  messageBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { fontSize: 18 },
  
  bioSection: { paddingHorizontal: 20, marginTop: 16 },
  bioText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8 },
  activityText: { fontSize: 14, color: COLORS.text },
  activityTime: { fontSize: 12, color: COLORS.textMuted },
  
  // Success message styles
  successMessage: { backgroundColor: COLORS.primary + '20', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary },
  successEmoji: { fontSize: 48, marginBottom: 8 },
  successTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  successText: { fontSize: 14, color: COLORS.text, textAlign: 'center' },
  successStats: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 8 },
});