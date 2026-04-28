import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, RefreshControl, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const CATS = ['SEMUA', 'SUNMORI', 'NIGHTRIDE', 'TOURING', 'RACING MEET', 'GRUP'];
type IName = React.ComponentProps<typeof Ionicons>['name'];
const CAT_ICONS: Record<string, IName> = {
  'SUNMORI': 'sunny-outline', 'NIGHTRIDE': 'moon-outline',
  'TOURING': 'map-outline', 'RACING MEET': 'flag-outline',
  'GRUP': 'people-outline', 'SEMUA': 'grid-outline',
};
const STATUS_COLOR: Record<string, string> = { upcoming: colors.accent, pending: colors.warning, rejected: colors.error, active: colors.accent, past: colors.textMuted };
const STATUS_LABEL: Record<string, string> = { upcoming: 'AKTIF', pending: 'MENUNGGU', rejected: 'DITOLAK', active: 'AKTIF', past: 'SELESAI' };

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const Field = ({ label, value, onChangeText, placeholder, multiline, keyboardType }: any) => (
  <View style={ts.fieldContainer}>
    <Text style={ts.fieldLabel}>{label}</Text>
    <TextInput 
      style={[ts.input, multiline && ts.inputMultiline]} 
      value={value} 
      onChangeText={onChangeText} 
      placeholder={placeholder} 
      placeholderTextColor={colors.textMuted} 
      multiline={multiline} 
      keyboardType={keyboardType || 'default'} 
    />
  </View>
);

export default function EventsScreen({ navigation }: any) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';
  const [tab, setTab] = useState('SEMUA');
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState<'event' | 'group' | null>(null);
  const [joining, setJoining] = useState('');

  // Event form
  const [eTitle, setETitle] = useState(''); const [eCat, setECat] = useState('Sunmori');
  const [eDate, setEDate] = useState(''); const [eLoc, setELoc] = useState('');
  const [eDesc, setEDesc] = useState(''); const [eContact, setEContact] = useState('');
  const [eMax, setEMax] = useState(''); const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Group form
  const [gName, setGName] = useState(''); const [gCat, setGCat] = useState('Touring');
  const [gLoc, setGLoc] = useState(''); const [gDesc, setGDesc] = useState('');

  const fetchAll = useCallback(async () => {
    const [evRes, grpRes, memRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('groups').select('*').order('created_at', { ascending: false }),
      user?.id ? supabase.from('group_members').select('group_id').eq('user_id', user.id) : { data: [] },
    ]);
    setEvents(evRes.data || []);
    setGroups(grpRes.data || []);
    setJoinedGroups(new Set((memRes.data || []).map((m: any) => m.group_id)));
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const submitEvent = async () => {
    if (!eTitle.trim() || !eDate.trim() || !eLoc.trim()) { setSubmitMsg('❌ Judul, tanggal dan lokasi wajib diisi.'); return; }
    setSubmitting(true); setSubmitMsg('');
    const { error } = await supabase.from('events').insert([{
      title: eTitle.trim(), category: eCat, event_date: eDate, location: eLoc.trim(),
      description: eDesc.trim(), contact: eContact.trim(),
      max_participants: parseInt(eMax) || 0,
      status: 'pending', organizer_id: user?.id, organizer_name: userName,
    }]);
    if (error) { setSubmitMsg('❌ ' + error.message); }
    else {
      setSubmitMsg('✅ Submitted! Menunggu persetujuan admin.');
      setTimeout(() => { setCreateModal(null); setETitle(''); setEDate(''); setELoc(''); setEDesc(''); setEContact(''); setEMax(''); setSubmitMsg(''); fetchAll(); }, 1500);
    }
    setSubmitting(false);
  };

  const submitGroup = async () => {
    if (!gName.trim() || !gLoc.trim()) { setSubmitMsg('❌ Nama dan lokasi wajib diisi.'); return; }
    setSubmitting(true); setSubmitMsg('');
    const { error } = await supabase.from('groups').insert([{
      name: gName.trim(), category: gCat, location: gLoc.trim(),
      description: gDesc.trim(), status: 'pending',
      organizer_id: user?.id, organizer_name: userName,
    }]);
    if (error) { setSubmitMsg('❌ ' + error.message); }
    else {
      setSubmitMsg('✅ Grup diajukan! Menunggu persetujuan admin.');
      setTimeout(() => { setCreateModal(null); setGName(''); setGLoc(''); setGDesc(''); setSubmitMsg(''); fetchAll(); }, 1500);
    }
    setSubmitting(false);
  };

  const joinGroup = async (groupId: string) => {
    if (!user?.id || joining === groupId) return;
    setJoining(groupId);
    const isJoined = joinedGroups.has(groupId);
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
      await supabase.from('groups').update({ member_count: supabase.rpc('decrement', {}) }).eq('id', groupId);
    } else {
      await supabase.from('group_members').insert([{ group_id: groupId, user_id: user.id, user_name: userName }]);
    }
    fetchAll(); setJoining('');
  };

  const visibleEvents = tab === 'SEMUA' ? events.filter(e => e.status === 'upcoming' || e.organizer_id === user?.id) :
    tab === 'GRUP' ? [] : events.filter(e => e.category?.toLowerCase() === tab.toLowerCase().replace(' ', '_') || (e.category?.toUpperCase() === tab) || (e.organizer_id === user?.id && e.category?.toUpperCase() === tab));

  const visibleGroups = tab === 'GRUP' || tab === 'SEMUA' ? groups.filter(g => g.status === 'active' || g.organizer_id === user?.id) : [];

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <View>
          <Text style={ts.headerTitle}>Exploration</Text>
          <Text style={ts.headerSubtitle}>Events & Community Groups</Text>
        </View>
        <View style={ts.headerActions}>
          <TouchableOpacity style={ts.actionBtn} onPress={() => { setCreateModal('event'); setSubmitMsg(''); }}>
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ts.tabScroll} contentContainerStyle={ts.tabContent}>
          {CATS.map(c => (
            <TouchableOpacity key={c} onPress={() => setTab(c)} style={[ts.tabItem, tab === c && ts.tabItemActive]}>
              <Text style={[ts.tabText, tab === c && ts.tabTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={ts.scrollPadding} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.accent} />}>
        {loading ? <Text style={ts.loadingText}>Memuat...</Text> : null}

        {/* Groups section */}
        {(tab === 'GRUP' || tab === 'SEMUA') && visibleGroups.length > 0 && (
          <>
            <Text style={ts.sectionTitle}>KOMUNITAS AKTIF</Text>
            {visibleGroups.map(g => {
              const isJoined = joinedGroups.has(g.id);
              const isOwner = g.organizer_id === user?.id;
              return (
                <TeslaCard key={g.id} style={ts.eventCard}>
                  <View style={ts.cardRow}>
                    <View style={ts.cardIconContainer}>
                      <Ionicons name={CAT_ICONS[g.category?.toUpperCase()] || 'people-outline'} size={24} color={colors.accent} />
                    </View>
                    <View style={ts.cardInfo}>
                      <View style={ts.cardHeaderRow}>
                        <Text style={ts.eventTitle}>{g.name}</Text>
                        <View style={[ts.statusBadge, { borderColor: STATUS_COLOR[g.status] }]}>
                          <Text style={[ts.statusText, { color: STATUS_COLOR[g.status] }]}>{STATUS_LABEL[g.status]}</Text>
                        </View>
                      </View>
                      <Text style={ts.eventMeta}>📍 {g.location} · 👥 {g.member_count || 1} members</Text>
                    </View>
                  </View>
                  {g.description ? <Text style={ts.eventDesc} numberOfLines={2}>{g.description}</Text> : null}
                  {g.status === 'active' && !isOwner && (
                    <TouchableOpacity 
                      style={[ts.joinBtn, isJoined && ts.joinBtnActive]} 
                      onPress={() => joinGroup(g.id)} 
                      disabled={joining === g.id}
                    >
                      <Text style={[ts.joinBtnText, isJoined && ts.joinBtnTextActive]}>
                        {joining === g.id ? '...' : (isJoined ? 'Terdaftar' : 'Gabung Grup')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TeslaCard>
              );
            })}
          </>
        )}

        {/* Events section */}
        {tab !== 'GRUP' && (
          <>
            <Text style={ts.sectionTitle}>EVENT MENDATANG</Text>
            {visibleEvents.length === 0 && !loading ? (
              <TeslaCard style={ts.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={ts.emptyText}>Belum ada event</Text>
                <TouchableOpacity style={ts.createBtn} onPress={() => { setCreateModal('event'); setSubmitMsg(''); }}>
                  <Text style={ts.createBtnText}>Buat Event</Text>
                </TouchableOpacity>
              </TeslaCard>
            ) : (
              visibleEvents.map(ev => {
                const isOwner = ev.organizer_id === user?.id;
                return (
                  <TeslaCard key={ev.id} style={ts.eventCard}>
                    <View style={ts.cardRow}>
                      <View style={ts.cardIconContainer}>
                        <Ionicons name={CAT_ICONS[ev.category?.toUpperCase()] || 'calendar-outline'} size={24} color={colors.primary} />
                      </View>
                      <View style={ts.cardInfo}>
                        <View style={ts.cardHeaderRow}>
                          <Text style={ts.eventTitle}>{ev.title}</Text>
                          {ev.status !== 'upcoming' && (
                            <View style={[ts.statusBadge, { borderColor: STATUS_COLOR[ev.status] }]}>
                              <Text style={[ts.statusText, { color: STATUS_COLOR[ev.status] }]}>{STATUS_LABEL[ev.status]}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={ts.eventMeta}>📅 {ev.event_date} · 📍 {ev.location}</Text>
                      </View>
                    </View>
                    {ev.description ? <Text style={ts.eventDesc} numberOfLines={2}>{ev.description}</Text> : null}
                    <View style={ts.cardFooter}>
                      <Text style={ts.organizerText}>Oleh: {ev.organizer_name || 'Rider'}</Text>
                      <TouchableOpacity style={ts.detailBtn}>
                        <Text style={ts.detailBtnText}>Lihat Detail</Text>
                      </TouchableOpacity>
                    </View>
                  </TeslaCard>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* CREATE EVENT MODAL */}
      <Modal visible={createModal === 'event'} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Buat Event Baru</Text>
              <TouchableOpacity onPress={() => setCreateModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={ts.modalScroll}>
              <Field label="JUDUL EVENT" value={eTitle} onChangeText={setETitle} placeholder="Sunmori Pagi..." />
              
              <Text style={ts.fieldLabel}>KATEGORI</Text>
              <View style={ts.catRow}>
                {['Sunmori', 'Nightride', 'Touring', 'Racing Meet'].map(c => (
                  <TouchableOpacity key={c} onPress={() => setECat(c)} style={[ts.catItem, eCat === c && ts.catItemActive]}>
                    <Text style={[ts.catText, eCat === c && ts.catTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="TANGGAL" value={eDate} onChangeText={setEDate} placeholder="2025-08-17" />
              <Field label="LOKASI" value={eLoc} onChangeText={setELoc} placeholder="Titik kumpul..." />
              <Field label="DESKRIPSI" value={eDesc} onChangeText={setEDesc} placeholder="Detail rute/agenda..." multiline />
              <Field label="KONTAK (WA/IG)" value={eContact} onChangeText={setEContact} placeholder="0812..." />

              {submitMsg ? <Text style={ts.submitMsg}>{submitMsg}</Text> : null}

              <TouchableOpacity style={ts.submitBtn} onPress={submitEvent} disabled={submitting}>
                <Text style={ts.submitBtnText}>{submitting ? 'Mengirim...' : 'Submit Event'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md 
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  tabScroll: { backgroundColor: colors.background, paddingVertical: spacing.sm },
  tabContent: { paddingHorizontal: spacing.lg, gap: 12 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, borderExWidth: 1, borderColor: '#222' },
  tabItemActive: { backgroundColor: '#222' },
  tabText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  scrollPadding: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  sectionTitle: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.md, marginLeft: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  eventCard: { padding: spacing.md },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', flex: 1, marginRight: 8 },
  eventMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4 },
  eventDesc: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 12, lineHeight: 20 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  joinBtn: { marginTop: spacing.md, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center' },
  joinBtnActive: { backgroundColor: '#222' },
  joinBtnText: { color: '#000', fontSize: fontSize.sm, fontWeight: '700' },
  joinBtnTextActive: { color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#222' },
  organizerText: { color: colors.textMuted, fontSize: fontSize.xs },
  detailBtn: { paddingVertical: 4 },
  detailBtnText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.md },
  createBtn: { marginTop: spacing.lg, backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
  createBtnText: { color: '#000', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  modalScroll: { flex: 1 },
  fieldContainer: { marginBottom: spacing.lg },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: 12, color: colors.text, fontSize: fontSize.md },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  catItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.md, borderExWidth: 1, borderColor: '#333' },
  catItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  catTextActive: { color: '#000' },
  submitMsg: { color: colors.warning, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  submitBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  submitBtnText: { color: '#000', fontSize: fontSize.md, fontWeight: '700' }
});