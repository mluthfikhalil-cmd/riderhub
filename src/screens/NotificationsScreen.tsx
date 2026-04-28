import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const initialNotifications = [
  {
    id: '1',
    icon: 'notifications-outline',
    title: 'Welcome to RiderHub',
    message: 'Profile activated. Complete your garage setup and start your first ride tracking.',
    time: 'JUST NOW',
    category: 'System',
    isRead: false,
  },
  {
    id: '2',
    icon: 'flag-outline',
    title: 'Kawasaki Track Day',
    message: 'New event at Sentul Circuit. Registration is now open for all members.',
    time: '2H AGO',
    category: 'Event',
    isRead: false,
  },
  {
    id: '3',
    icon: 'cart-outline',
    title: 'Premium Oil Discount',
    message: 'Flash sale! 20% off all Motul and Shell oil products in the RiderHub store.',
    time: '5H AGO',
    category: 'Store',
    isRead: false,
  },
  {
    id: '4',
    icon: 'people-outline',
    title: 'New Community Post',
    message: 'Honda CBR ID posted the monthly meetup schedule. Check location details.',
    time: '1D AGO',
    category: 'Community',
    isRead: true,
  },
  {
    id: '5',
    icon: 'shield-checkmark-outline',
    title: 'Registration Reminder',
    message: 'Your vehicle registration for B 1234 XYZ is expiring in 30 days.',
    time: '2D AGO',
    category: 'Vehicle',
    isRead: true,
  },
];

const categoryColors: Record<string, string> = {
  System: colors.accent,
  Event: '#A855F7',
  Store: '#F59E0B',
  Community: '#10B981',
  Vehicle: '#EF4444',
};

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const categories = ['All', 'Event', 'Store', 'Community', 'Vehicle', 'System'];

  const filtered = notifications.filter(n =>
    activeFilter === 'All' || n.category === activeFilter
  );

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const openNotif = (notif: any) => {
    setSelectedNotif(notif);
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
    );
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedNotif(null);
  };

  return (
    <SafeAreaView style={ts.container}>
      {/* Header */}
      <View style={ts.header}>
        <View style={{ flex: 1 }}>
          <Text style={ts.headerTitle}>Notifications</Text>
          <Text style={ts.headerSubtitle}>{unreadCount} UNREAD ALERTS</Text>
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={ts.readAllBtn}>
          <Text style={ts.readAllText}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ts.filterScroll} contentContainerStyle={ts.filterContent}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[ts.filterPill, activeFilter === cat && ts.filterPillActive]}
              onPress={() => setActiveFilter(cat)}
            >
              <Text style={[ts.filterText, activeFilter === cat && ts.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        {filtered.length === 0 ? (
          <View style={ts.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color={colors.textMuted} />
            <Text style={ts.emptyText}>No alerts in this category</Text>
          </View>
        ) : (
          filtered.map(notif => (
            <TeslaCard key={notif.id} onPress={() => openNotif(notif)} style={[ts.notifCard, !notif.isRead && ts.unreadCard]}>
              <View style={ts.notifRow}>
                <View style={[ts.iconBox, { backgroundColor: '#111' }]}>
                  <Ionicons name={notif.icon as any} size={22} color={notif.isRead ? colors.textSecondary : colors.accent} />
                </View>
                <View style={ts.notifContent}>
                  <View style={ts.notifTopRow}>
                    <Text style={[ts.notifCategory, { color: categoryColors[notif.category] }]}>{notif.category.toUpperCase()}</Text>
                    <Text style={ts.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={[ts.notifTitle, !notif.isRead && { fontWeight: '800' }]} numberOfLines={1}>{notif.title}</Text>
                  <Text style={ts.notifPreview} numberOfLines={1}>{notif.message}</Text>
                </View>
                {!notif.isRead && <View style={ts.unreadDot} />}
              </View>
            </TeslaCard>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={selectedNotif !== null} transparent animationType="fade">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <View style={[ts.modalTag, { backgroundColor: categoryColors[selectedNotif?.category] + '20' }]}>
                <Text style={[ts.modalTagText, { color: categoryColors[selectedNotif?.category] }]}>{selectedNotif?.category.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} style={ts.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={ts.modalBody}>
              <View style={ts.modalIconBox}>
                <Ionicons name={selectedNotif?.icon} size={48} color={colors.accent} />
              </View>
              <Text style={ts.modalTitle}>{selectedNotif?.title}</Text>
              <Text style={ts.modalTime}>{selectedNotif?.time}</Text>
              <Text style={ts.modalMessage}>{selectedNotif?.message}</Text>
            </View>

            <View style={ts.modalActions}>
              <TouchableOpacity style={ts.deleteBtn} onPress={() => deleteNotif(selectedNotif?.id)}>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  readAllBtn: { padding: 4 },
  readAllText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
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

export default NotificationsScreen;

