import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TeslaCard } from '../components/TeslaCard';
import { BackButton, CloseButton } from '../components/HeaderButtons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'users' | 'events' | 'market' | 'groups' | 'content';

interface Profile {
  id: string;
  name: string | null;
  motor_brand: string | null;
  motor_model: string | null;
  motor_plate: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  location: string | null;
  event_date: string | null;
  status: string;
  organizer_name: string | null;
  image_emoji: string;
  created_at: string;
}

interface Part {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string | null;
  seller_name: string | null;
  location: string | null;
  image_emoji: string;
  affiliate_url: string | null;
  active: boolean;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  organizer_name: string | null;
  member_count: number;
  status: string;
  created_at: string;
}

interface Post {
  id: string;
  user_name: string;
  content: string;
  motor: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface DashStats {
  users: number;
  events: number;
  parts: number;
  posts: number;
  pendingApprovals: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  upcoming: colors.accent,
  active: colors.accent,
  pending: colors.warning,
  rejected: colors.error,
  past: colors.textMuted,
  available: colors.accent,
};

function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_COLORS[status] ?? colors.textMuted;
  return (
    <View style={[badge.wrap, { backgroundColor: bg + '22', borderColor: bg }]}>
      <Text style={[badge.text, { color: bg }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full, borderWidth: 1 },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});

function SectionLabel({ label }: { label: string }) {
  return <Text style={ts.sectionLabel}>{label}</Text>;
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <TeslaCard style={ts.emptyCard}>
      <Ionicons name={icon as any} size={40} color={colors.textMuted} />
      <Text style={ts.emptyText}>{message}</Text>
    </TeslaCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminScreen = ({ navigation }: any) => {
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Data
  const [stats, setStats] = useState<DashStats>({ users: 0, events: 0, parts: 0, posts: 0, pendingApprovals: 0 });
  const [recentActivity, setRecentActivity] = useState<{ label: string; time: string; icon: string }[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [activeGroups, setActiveGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [approvingId, setApprovingId] = useState('');

  // Edit modals
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [addPartModal, setAddPartModal] = useState(false);
  const [newPart, setNewPart] = useState<Partial<Part>>({
    title: '', description: '', price: 0, category: '', seller_name: '',
    location: '', image_emoji: '🔧', affiliate_url: '', active: true,
  });

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        profilesRes, eventsRes, partsRes, postsRes,
        pendingGroupsRes, activeGroupsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('parts').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('groups').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('groups').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      ]);

      const profileList: Profile[] = profilesRes.data ?? [];
      const eventList: Event[] = eventsRes.data ?? [];
      const partList: Part[] = partsRes.data ?? [];
      const postList: Post[] = postsRes.data ?? [];
      const pendingGrpList: Group[] = pendingGroupsRes.data ?? [];
      const activeGrpList: Group[] = activeGroupsRes.data ?? [];

      setProfiles(profileList);
      setEvents(eventList);
      setParts(partList);
      setPosts(postList);
      setPendingGroups(pendingGrpList);
      setActiveGroups(activeGrpList);

      const pendingEvents = eventList.filter(e => e.status === 'pending').length;
      setStats({
        users: profileList.length,
        events: eventList.length,
        parts: partList.length,
        posts: postList.length,
        pendingApprovals: pendingEvents + pendingGrpList.length,
      });

      // Build recent activity from latest items across tables
      const activity: { label: string; time: string; icon: string }[] = [];
      eventList.slice(0, 3).forEach(e =>
        activity.push({ label: `Event: ${e.title}`, time: e.created_at, icon: 'flag-outline' })
      );
      postList.slice(0, 3).forEach(p =>
        activity.push({ label: `Post by ${p.user_name}`, time: p.created_at, icon: 'chatbubble-outline' })
      );
      pendingGrpList.slice(0, 2).forEach(g =>
        activity.push({ label: `Group pending: ${g.name}`, time: g.created_at, icon: 'people-outline' })
      );
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activity.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchAll();
  }, [isLoggedIn, fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const isAdmin = !!data.user?.user_metadata?.is_admin;
      if (!isAdmin) {
        await supabase.auth.signOut({ scope: 'local' });
        setLoginError('Akun ini bukan admin.');
        return;
      }
      setIsLoggedIn(true);
    } catch (e: any) {
      setLoginError(e?.message || 'Gagal login admin.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Keluar dari admin panel?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => setIsLoggedIn(false) },
    ]);
  };

  // ─── Users ─────────────────────────────────────────────────────────────────

  const toggleAdmin = async (id: string, current: boolean) => {
    Alert.alert(
      current ? 'Cabut Admin' : 'Jadikan Admin',
      `${current ? 'Cabut hak admin dari' : 'Berikan hak admin ke'} user ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
            fetchAll();
          },
        },
      ]
    );
  };

  const filteredProfiles = profiles.filter(p =>
    !userSearch || (p.name ?? '').toLowerCase().includes(userSearch.toLowerCase())
  );

  // ─── Events ────────────────────────────────────────────────────────────────

  const saveEvent = async () => {
    if (!editEvent) return;
    await supabase.from('events').update({
      title: editEvent.title,
      location: editEvent.location,
      event_date: editEvent.event_date,
      status: editEvent.status,
    }).eq('id', editEvent.id);
    setEditEvent(null);
    fetchAll();
  };

  const deleteEvent = (id: string, title: string) => {
    Alert.alert('Hapus Event', `Hapus "${title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await supabase.from('events').delete().eq('id', id);
          fetchAll();
        },
      },
    ]);
  };

  // ─── Market ────────────────────────────────────────────────────────────────

  const togglePartActive = async (id: string, current: boolean) => {
    await supabase.from('parts').update({ active: !current }).eq('id', id);
    fetchAll();
  };

  const savePart = async () => {
    if (!editPart) return;
    await supabase.from('parts').update({
      title: editPart.title,
      description: editPart.description,
      price: editPart.price,
      category: editPart.category,
      seller_name: editPart.seller_name,
      location: editPart.location,
      image_emoji: editPart.image_emoji,
      affiliate_url: editPart.affiliate_url,
    }).eq('id', editPart.id);
    setEditPart(null);
    fetchAll();
  };

  const addPart = async () => {
    if (!newPart.title) return;
    await supabase.from('parts').insert({
      title: newPart.title,
      description: newPart.description || null,
      price: newPart.price ?? 0,
      category: newPart.category || null,
      seller_name: newPart.seller_name || null,
      location: newPart.location || null,
      image_emoji: newPart.image_emoji || '🔧',
      affiliate_url: newPart.affiliate_url || null,
      active: true,
    });
    setAddPartModal(false);
    setNewPart({ title: '', description: '', price: 0, category: '', seller_name: '', location: '', image_emoji: '🔧', affiliate_url: '', active: true });
    fetchAll();
  };

  // ─── Groups ────────────────────────────────────────────────────────────────

  const approveGroup = async (id: string) => {
    setApprovingId(id);
    await supabase.from('groups').update({ status: 'active' }).eq('id', id);
    await fetchAll();
    setApprovingId('');
  };

  const rejectGroup = async (id: string) => {
    setApprovingId(id + '_r');
    await supabase.from('groups').update({ status: 'rejected' }).eq('id', id);
    await fetchAll();
    setApprovingId('');
  };

  // ─── Content ───────────────────────────────────────────────────────────────

  const deletePost = (id: string) => {
    Alert.alert('Hapus Post', 'Hapus post ini secara permanen?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await supabase.from('posts').delete().eq('id', id);
          fetchAll();
        },
      },
    ]);
  };


  // ─── Login Gate ────────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={ts.container}>
        <View style={ts.loginBox}>
          <View style={ts.loginLogo}>
            <MaterialCommunityIcons name="shield-key-outline" size={64} color={colors.accent} />
          </View>
          <Text style={ts.loginTitle}>Command Center</Text>
          <Text style={ts.loginSubtitle}>Access restricted to authorized personnel only.</Text>
          <View style={ts.form}>
            <TextInput
              style={ts.input}
              placeholder="Admin Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={ts.input}
              placeholder="Security Key"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {loginError ? <Text style={ts.errorText}>{loginError}</Text> : null}
            <TouchableOpacity style={ts.loginBtn} onPress={handleLogin} disabled={loginLoading}>
              {loginLoading
                ? <ActivityIndicator color="#000" />
                : <Text style={ts.loginBtnText}>AUTHENTICATE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Tab definitions ───────────────────────────────────────────────────────

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'speedometer-outline', label: 'Dash' },
    { id: 'users',     icon: 'people-outline',      label: 'Users' },
    { id: 'events',    icon: 'flag-outline',         label: 'Events' },
    { id: 'market',    icon: 'construct-outline',    label: 'Market' },
    { id: 'groups',    icon: 'shield-outline',       label: 'Groups' },
    { id: 'content',   icon: 'newspaper-outline',    label: 'Content' },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={ts.container}>
      {/* Header */}
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={ts.headerTitle}>Admin Panel</Text>
          <Text style={ts.headerSubtitle}>System Management</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={ts.logoutBtn}>
          <Text style={ts.logoutText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={ts.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[ts.tab, activeTab === tab.id && ts.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? colors.accent : colors.textMuted}
            />
            <Text style={[ts.tabLabel, activeTab === tab.id && ts.activeTabLabel]}>
              {tab.label}
            </Text>
            {tab.id === 'groups' && pendingGroups.length > 0 && (
              <View style={ts.tabBadge} />
            )}
            {tab.id === 'dashboard' && stats.pendingApprovals > 0 && (
              <View style={ts.tabBadge} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={ts.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ts.scrollPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {loading && !refreshing && (
          <View style={ts.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && !loading && (
          <View>
            <SectionLabel label="OVERVIEW" />
            <View style={ts.statsGrid}>
              {[
                { val: stats.users,           label: 'Users',    icon: 'people-outline' },
                { val: stats.events,          label: 'Events',   icon: 'flag-outline' },
                { val: stats.parts,           label: 'Parts',    icon: 'construct-outline' },
                { val: stats.posts,           label: 'Posts',    icon: 'chatbubble-outline' },
                { val: stats.pendingApprovals, label: 'Pending', icon: 'time-outline', accent: true },
              ].map(s => (
                <TeslaCard key={s.label} style={ts.statCard}>
                  <Ionicons name={s.icon as any} size={20} color={s.accent ? colors.accent : colors.textSecondary} />
                  <Text style={[ts.statVal, s.accent && { color: colors.accent }]}>{s.val}</Text>
                  <Text style={ts.statLabel}>{s.label}</Text>
                </TeslaCard>
              ))}
            </View>

            <SectionLabel label="RECENT ACTIVITY" />
            {recentActivity.length === 0
              ? <EmptyState icon="pulse-outline" message="No recent activity" />
              : recentActivity.map((a, i) => (
                <TeslaCard key={i} style={ts.activityCard}>
                  <Ionicons name={a.icon as any} size={16} color={colors.accent} style={{ marginRight: spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Text style={ts.activityLabel}>{a.label}</Text>
                    <Text style={ts.activityTime}>{new Date(a.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </TeslaCard>
              ))
            }
          </View>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && !loading && (
          <View>
            <SectionLabel label="USER MANAGEMENT" />
            <TextInput
              style={ts.searchInput}
              placeholder="Cari nama..."
              placeholderTextColor={colors.textMuted}
              value={userSearch}
              onChangeText={setUserSearch}
            />
            {filteredProfiles.length === 0
              ? <EmptyState icon="people-outline" message="Tidak ada user ditemukan" />
              : filteredProfiles.map(p => (
                <TeslaCard key={p.id} style={ts.userCard}>
                  <View style={ts.userAvatar}>
                    <Text style={ts.userAvatarText}>{(p.name ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={ts.userRow}>
                      <Text style={ts.userName}>{p.name ?? 'No Name'}</Text>
                      {p.is_admin && <StatusBadge status="active" />}
                    </View>
                    {(p.motor_brand || p.motor_model) && (
                      <Text style={ts.userMeta}>
                        {[p.motor_brand, p.motor_model, p.motor_plate].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    <Text style={ts.userMeta}>
                      {new Date(p.created_at).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[ts.adminToggle, p.is_admin && ts.adminToggleActive]}
                    onPress={() => toggleAdmin(p.id, p.is_admin)}
                  >
                    <Ionicons
                      name={p.is_admin ? 'shield' : 'shield-outline'}
                      size={18}
                      color={p.is_admin ? '#000' : colors.textMuted}
                    />
                  </TouchableOpacity>
                </TeslaCard>
              ))
            }
          </View>
        )}

        {/* ── EVENTS ── */}
        {activeTab === 'events' && !loading && (
          <View>
            <SectionLabel label="EVENT CONTROL" />
            {events.length === 0
              ? <EmptyState icon="flag-outline" message="Belum ada event" />
              : events.map(ev => (
                <TeslaCard key={ev.id} style={ts.listCard}>
                  <View style={ts.listCardLeft}>
                    <Text style={ts.listEmoji}>{ev.image_emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={ts.listTitleRow}>
                      <Text style={ts.listTitle} numberOfLines={1}>{ev.title}</Text>
                      <StatusBadge status={ev.status} />
                    </View>
                    <Text style={ts.listMeta}>
                      {[ev.location, ev.organizer_name].filter(Boolean).join(' · ')}
                    </Text>
                    {ev.event_date && (
                      <Text style={ts.listMeta}>
                        {new Date(ev.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  <View style={ts.listActions}>
                    <TouchableOpacity onPress={() => setEditEvent({ ...ev })} style={ts.iconBtn}>
                      <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEvent(ev.id, ev.title)} style={ts.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </TeslaCard>
              ))
            }
          </View>
        )}

        {/* ── MARKET ── */}
        {activeTab === 'market' && !loading && (
          <View>
            <View style={ts.sectionHeader}>
              <SectionLabel label="MARKETPLACE CONTROL" />
              <TouchableOpacity style={ts.addBtn} onPress={() => setAddPartModal(true)}>
                <Ionicons name="add" size={18} color="#000" />
                <Text style={ts.addBtnText}>ADD</Text>
              </TouchableOpacity>
            </View>
            {parts.length === 0
              ? <EmptyState icon="construct-outline" message="Belum ada produk" />
              : parts.map(p => (
                <TeslaCard key={p.id} style={ts.listCard}>
                  <View style={ts.listCardLeft}>
                    <Text style={ts.listEmoji}>{p.image_emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.listTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={ts.listMeta}>
                      {p.category} · Rp {(p.price ?? 0).toLocaleString('id-ID')}
                    </Text>
                    {p.seller_name && <Text style={ts.listMeta}>{p.seller_name}</Text>}
                  </View>
                  <View style={ts.listActions}>
                    <TouchableOpacity onPress={() => togglePartActive(p.id, p.active)} style={ts.iconBtn}>
                      <Ionicons
                        name={p.active ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color={p.active ? colors.accent : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditPart({ ...p })} style={ts.iconBtn}>
                      <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </TeslaCard>
              ))
            }
          </View>
        )}

        {/* ── GROUPS ── */}
        {activeTab === 'groups' && !loading && (
          <View>
            <SectionLabel label="PENDING GROUPS" />
            {pendingGroups.length === 0
              ? <EmptyState icon="checkmark-circle-outline" message="Tidak ada grup pending" />
              : pendingGroups.map(g => (
                <TeslaCard key={g.id} style={[ts.listCard, ts.pendingCard]}>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.listTitle}>{g.name}</Text>
                    <Text style={ts.listMeta}>
                      {[g.category, g.location, g.organizer_name].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={ts.approvalBtns}>
                    <TouchableOpacity
                      style={ts.btnReject}
                      onPress={() => rejectGroup(g.id)}
                      disabled={approvingId === g.id + '_r'}
                    >
                      {approvingId === g.id + '_r'
                        ? <ActivityIndicator size="small" color={colors.textMuted} />
                        : <Text style={ts.btnRejectText}>REJECT</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={ts.btnApprove}
                      onPress={() => approveGroup(g.id)}
                      disabled={approvingId === g.id}
                    >
                      {approvingId === g.id
                        ? <ActivityIndicator size="small" color="#000" />
                        : <Text style={ts.btnApproveText}>APPROVE</Text>}
                    </TouchableOpacity>
                  </View>
                </TeslaCard>
              ))
            }

            <SectionLabel label="ACTIVE GROUPS" />
            {activeGroups.length === 0
              ? <EmptyState icon="people-outline" message="Belum ada grup aktif" />
              : activeGroups.map(g => (
                <TeslaCard key={g.id} style={ts.listCard}>
                  <View style={{ flex: 1 }}>
                    <View style={ts.listTitleRow}>
                      <Text style={ts.listTitle}>{g.name}</Text>
                      <StatusBadge status="active" />
                    </View>
                    <Text style={ts.listMeta}>
                      {[g.category, g.location].filter(Boolean).join(' · ')} · {g.member_count} members
                    </Text>
                  </View>
                </TeslaCard>
              ))
            }
          </View>
        )}

        {/* ── CONTENT ── */}
        {activeTab === 'content' && !loading && (
          <View>
            <SectionLabel label="CONTENT MODERATION" />
            {posts.length === 0
              ? <EmptyState icon="newspaper-outline" message="Belum ada post" />
              : posts.map(post => (
                <TeslaCard key={post.id} style={ts.postCard}>
                  <View style={ts.postHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={ts.postUser}>{post.user_name}</Text>
                      {post.motor && <Text style={ts.postMeta}>{post.motor}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => deletePost(post.id)} style={ts.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <Text style={ts.postContent} numberOfLines={3}>{post.content}</Text>
                  <View style={ts.postFooter}>
                    <Ionicons name="heart-outline" size={13} color={colors.textMuted} />
                    <Text style={ts.postStat}>{post.likes_count}</Text>
                    <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} style={{ marginLeft: 10 }} />
                    <Text style={ts.postStat}>{post.comments_count}</Text>
                    <Text style={[ts.postMeta, { marginLeft: 'auto' }]}>
                      {new Date(post.created_at).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                </TeslaCard>
              ))
            }
          </View>
        )}
      </ScrollView>

      {/* ── EDIT EVENT MODAL ── */}
      <Modal visible={editEvent !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalSheet}>
            <View style={ts.modalHandle} />
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Edit Event</Text>
              <CloseButton onPress={() => setEditEvent(null)} />
            </View>
            {editEvent && (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={ts.inputLabel}>TITLE</Text>
                <TextInput
                  style={ts.modalInput}
                  value={editEvent.title}
                  onChangeText={v => setEditEvent(e => e ? { ...e, title: v } : e)}
                />
                <Text style={ts.inputLabel}>LOCATION</Text>
                <TextInput
                  style={ts.modalInput}
                  value={editEvent.location ?? ''}
                  onChangeText={v => setEditEvent(e => e ? { ...e, location: v } : e)}
                />
                <Text style={ts.inputLabel}>DATE (ISO)</Text>
                <TextInput
                  style={ts.modalInput}
                  value={editEvent.event_date ?? ''}
                  onChangeText={v => setEditEvent(e => e ? { ...e, event_date: v } : e)}
                  placeholder="2025-12-31T08:00:00Z"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={ts.inputLabel}>STATUS</Text>
                <View style={ts.statusPicker}>
                  {['pending', 'upcoming', 'past', 'rejected'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[ts.statusOption, editEvent.status === s && ts.statusOptionActive]}
                      onPress={() => setEditEvent(e => e ? { ...e, status: s } : e)}
                    >
                      <Text style={[ts.statusOptionText, editEvent.status === s && { color: '#000' }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={ts.saveBtn} onPress={saveEvent}>
                  <Text style={ts.saveBtnText}>APPLY CHANGES</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── EDIT PART MODAL ── */}
      <Modal visible={editPart !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalSheet}>
            <View style={ts.modalHandle} />
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Edit Part</Text>
              <CloseButton onPress={() => setEditPart(null)} />
            </View>
            {editPart && (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={ts.inputLabel}>TITLE</Text>
                <TextInput style={ts.modalInput} value={editPart.title}
                  onChangeText={v => setEditPart(p => p ? { ...p, title: v } : p)} />
                <Text style={ts.inputLabel}>DESCRIPTION</Text>
                <TextInput style={[ts.modalInput, { height: 80 }]} value={editPart.description ?? ''}
                  onChangeText={v => setEditPart(p => p ? { ...p, description: v } : p)}
                  multiline />
                <Text style={ts.inputLabel}>PRICE (IDR)</Text>
                <TextInput style={ts.modalInput} value={String(editPart.price ?? '')}
                  onChangeText={v => setEditPart(p => p ? { ...p, price: parseInt(v) || 0 } : p)}
                  keyboardType="numeric" />
                <Text style={ts.inputLabel}>CATEGORY</Text>
                <TextInput style={ts.modalInput} value={editPart.category ?? ''}
                  onChangeText={v => setEditPart(p => p ? { ...p, category: v } : p)} />
                <Text style={ts.inputLabel}>SELLER NAME</Text>
                <TextInput style={ts.modalInput} value={editPart.seller_name ?? ''}
                  onChangeText={v => setEditPart(p => p ? { ...p, seller_name: v } : p)} />
                <Text style={ts.inputLabel}>LOCATION</Text>
                <TextInput style={ts.modalInput} value={editPart.location ?? ''}
                  onChangeText={v => setEditPart(p => p ? { ...p, location: v } : p)} />
                <Text style={ts.inputLabel}>EMOJI</Text>
                <TextInput style={ts.modalInput} value={editPart.image_emoji}
                  onChangeText={v => setEditPart(p => p ? { ...p, image_emoji: v } : p)} />
                <Text style={ts.inputLabel}>AFFILIATE URL</Text>
                <TextInput style={ts.modalInput} value={editPart.affiliate_url ?? ''}
                  onChangeText={v => setEditPart(p => p ? { ...p, affiliate_url: v } : p)}
                  autoCapitalize="none" />
                <TouchableOpacity style={ts.saveBtn} onPress={savePart}>
                  <Text style={ts.saveBtnText}>APPLY CHANGES</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── ADD PART MODAL ── */}
      <Modal visible={addPartModal} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalSheet}>
            <View style={ts.modalHandle} />
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Add New Part</Text>
              <CloseButton onPress={() => setAddPartModal(false)} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {([
                ['TITLE *', 'title', 'text'],
                ['DESCRIPTION', 'description', 'text'],
                ['PRICE (IDR)', 'price', 'numeric'],
                ['CATEGORY', 'category', 'text'],
                ['SELLER NAME', 'seller_name', 'text'],
                ['LOCATION', 'location', 'text'],
                ['EMOJI', 'image_emoji', 'text'],
                ['AFFILIATE URL', 'affiliate_url', 'url'],
              ] as [string, keyof typeof newPart, string][]).map(([label, field, kb]) => (
                <View key={field}>
                  <Text style={ts.inputLabel}>{label}</Text>
                  <TextInput
                    style={ts.modalInput}
                    value={String(newPart[field] ?? '')}
                    onChangeText={v => setNewPart(p => ({ ...p, [field]: kb === 'numeric' ? (parseInt(v) || 0) : v }))}
                    keyboardType={kb as any}
                    autoCapitalize={kb === 'url' ? 'none' : 'sentences'}
                  />
                </View>
              ))}
              <TouchableOpacity style={ts.saveBtn} onPress={addPart}>
                <Text style={ts.saveBtnText}>ADD PART</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


// ─── Styles ───────────────────────────────────────────────────────────────────

const ts = StyleSheet.create({
  // Layout
  container:      { flex: 1, backgroundColor: colors.background },
  content:        { flex: 1 },
  scrollPadding:  { padding: spacing.lg, paddingBottom: 120 },
  loadingWrap:    { paddingVertical: 60, alignItems: 'center' },

  // Login
  loginBox:       { flex: 1, justifyContent: 'center', padding: spacing.xxl },
  loginLogo:      { alignItems: 'center', marginBottom: spacing.xxl },
  loginTitle:     { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  loginSubtitle:  { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  form:           { gap: spacing.lg },
  input:          { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, color: colors.text, fontSize: 16 },
  loginBtn:       { backgroundColor: colors.accent, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginTop: 10 },
  loginBtnText:   { color: '#000', fontWeight: '800', letterSpacing: 2 },
  errorText:      { color: colors.error, fontSize: 12, textAlign: 'center' },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle:    { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  logoutBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.surface },
  logoutText:     { color: colors.error, fontSize: 10, fontWeight: '800' },

  // Tabs
  tabs:           { flexDirection: 'row', backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  activeTab:      { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabLabel:       { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
  activeTabLabel: { color: colors.accent },
  tabBadge:       { position: 'absolute', top: 8, right: '20%', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },

  // Section
  sectionLabel:   { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.sm },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },

  // Stats
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard:       { width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  statVal:        { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel:      { color: colors.textMuted, fontSize: 9, fontWeight: '700' },

  // Activity
  activityCard:   { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: spacing.sm },
  activityLabel:  { color: colors.text, fontSize: 13, fontWeight: '600' },
  activityTime:   { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  // Search
  searchInput:    { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: 14, marginBottom: spacing.md },

  // User card
  userCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, paddingVertical: spacing.md },
  userAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  userRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName:       { color: colors.text, fontSize: 14, fontWeight: '700' },
  userMeta:       { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  adminToggle:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  adminToggleActive: { backgroundColor: colors.accent },

  // List card (events, parts)
  listCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, paddingVertical: spacing.md },
  listCardLeft:   { width: 40, alignItems: 'center' },
  listEmoji:      { fontSize: 24 },
  listTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  listTitle:      { color: colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  listMeta:       { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  listActions:    { flexDirection: 'row', gap: spacing.sm },
  iconBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },

  // Add button
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md },
  addBtnText:     { color: '#000', fontSize: 11, fontWeight: '800' },

  // Pending card
  pendingCard:    { borderLeftWidth: 3, borderLeftColor: colors.warning },

  // Approval buttons
  approvalBtns:   { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnApprove:     { flex: 1, backgroundColor: colors.accent, padding: 10, borderRadius: borderRadius.md, alignItems: 'center', minWidth: 70 },
  btnApproveText: { color: '#000', fontWeight: '800', fontSize: 11 },
  btnReject:      { flex: 1, backgroundColor: colors.surface, padding: 10, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, minWidth: 70 },
  btnRejectText:  { color: colors.textMuted, fontWeight: '800', fontSize: 11 },

  // Post card
  postCard:       { marginBottom: spacing.sm, paddingVertical: spacing.md },
  postHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  postUser:       { color: colors.text, fontSize: 13, fontWeight: '700' },
  postMeta:       { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  postContent:    { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: spacing.sm },
  postFooter:     { flexDirection: 'row', alignItems: 'center' },
  postStat:       { color: colors.textMuted, fontSize: 11, marginLeft: 4 },

  // Empty state
  emptyCard:      { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyText:      { color: colors.textMuted, fontSize: 14 },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '90%' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle:     { color: colors.text, fontSize: 18, fontWeight: '700' },
  inputLabel:     { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  modalInput:     { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, marginBottom: spacing.lg, fontSize: 14 },
  saveBtn:        { backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  saveBtnText:    { color: '#000', fontWeight: '800', letterSpacing: 1 },

  // Status picker
  statusPicker:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statusOption:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  statusOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusOptionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
});

export default AdminScreen;
