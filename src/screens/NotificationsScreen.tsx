import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

interface Notification {
  id: string;
  user_id: string;
  icon: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  System: colors.accent,
  Event: '#A855F7',
  Store: '#F59E0B',
  Community: '#10B981',
  Vehicle: '#EF4444',
  Service: '#EBB040',
};

const formatTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
};

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Event', 'Store', 'Community', 'Vehicle', 'System', 'Service'];

  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setNotifications((data || []) as Notification[]);
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = notifications.filter((n) => activeFilter === 'All' || n.category === activeFilter);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  const openNotif = async (notif: Notification) => {
    setSelectedNotif(notif);
    if (!notif.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    }
  };

  const deleteNotif = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotif(null);
    await supabase.from('notifications').delete().eq('id', id);
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Notifications</Text>
          <Text style={ts.headerSubtitle}>{unreadCount} UNREAD ALERTS</Text>
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={ts.readAllBtn}>
          <Text style={ts.readAllText}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ts.filterScroll} contentContainerStyle={ts.filterContent}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[ts.filterPill, activeFilter === cat && ts.filterPillActive]} onPress={() => setActiveFilter(cat)}>
              <Text style={[ts.filterText, activeFilter === cat && ts.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ts.scrollPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} tintColor={colors.accent} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
        ) : filtered.length === 0 ? (
          <View style={ts.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color={colors.textMuted} />
            <Text style={ts.emptyText}>No alerts in this category</Text>
          </View>
        ) : (
          filtered.map((notif) => (
            <TeslaCard key={notif.id} onPress={() => openNotif(notif)} style={[ts.card, ts.notifCard, !notif.is_read && ts.unreadCard]}>
              <View style={ts.notifRow}>
                <View style={[ts.iconBox, { backgroundColor: '#111' }]}>
                  <Ionicons name={notif.icon as any} size={22} color={notif.is_read ? colors.textSecondary : colors.accent} />
                </View>
                <View style={ts.notifContent}>
                  <View style={ts.notifTopRow}>
                    <Text style={[ts.notifCategory, { color: CATEGORY_COLORS[notif.category] || colors.textMuted }]}>{notif.category.toUpperCase()}</Text>
                    <Text style={ts.notifTime}>{formatTime(notif.created_at)}</Text>
                  </View>
                  <Text style={[ts.notifTitle, !notif.is_read && { fontWeight: '800' }]} numberOfLines={1}>{notif.title}</Text>
                  <Text style={ts.notifPreview} numberOfLines={1}>{notif.message}</Text>
                </View>
                {!notif.is_read && <View style={ts.unreadDot} />}
              </View>
            </TeslaCard>
          ))
        )}
      </ScrollView>

      <Modal visible={selectedNotif !== null} transparent animationType="fade">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <View style={[ts.modalTag, { backgroundColor: (CATEGORY_COLORS[selectedNotif?.category || 'System'] || colors.accent) + '20' }]}>
                <Text style={[ts.modalTagText, { color: CATEGORY_COLORS[selectedNotif?.category || 'System'] || colors.accent }]}>{selectedNotif?.category.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} style={ts.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={ts.modalBody}>
              <View style={ts.modalIconBox}>
                <Ionicons name={(selectedNotif?.icon || 'notifications-outline') as any} size={48} color={colors.accent} />
              </View>
              <Text style={ts.modalTitle}>{selectedNotif?.title}</Text>
              <Text style={ts.modalTime}>{selectedNotif ? formatTime(selectedNotif.created_at) : ''}</Text>
              <Text style={ts.modalMessage}>{selectedNotif?.message}</Text>
            </View>
            <View style={ts.modalActions}>
              <TouchableOpacity style={ts.deleteBtn} onPress={() => selectedNotif && deleteNotif(selectedNotif.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={ts.deleteText}>Delete Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ts.dismissBtn} onPress={() => setSelectedNotif(null)}>
                <Text style={ts.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  readAllBtn: { padding: 4 },
  readAllText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  filterScroll: { paddingVertical: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: 12 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  filterPillActive: { borderColor: colors.accent, backgroundColor: 'rgba(0, 214, 125, 0.05)' },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.accent },
  scrollPadding: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  notifCard: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111' },
  unreadCard: { borderColor: '#1C1C1E' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifCategory: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  notifTime: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  notifTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  notifPreview: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: colors.textSecondary, fontSize: 15, marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: '#111', borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  modalTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  closeBtn: { padding: 4 },
  modalBody: { alignItems: 'center', marginBottom: spacing.xxl },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalTime: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: spacing.lg },
  modalMessage: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  modalActions: { gap: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  deleteText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  dismissBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 28, alignItems: 'center' },
  dismissText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
