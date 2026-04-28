import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'admin@riderhub.id';
const ADMIN_PASSWORD = 'riderhub2026';

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const AdminScreen = ({ navigation }: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard'|'events'|'parts'|'approval'>('dashboard');
  const [events, setEvents] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [editModal, setEditModal] = useState<any>(null);
  const [editType, setEditType] = useState<'event'|'part'>('event');
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [pendingGroups, setPendingGroups] = useState<any[]>([]);
  const [approving, setApproving] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      fetchPending();
    }
  }, [isLoggedIn]);

  const fetchData = async () => {
    setLoading(true);
    const [evRes, prtRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('parts').select('*').order('created_at', { ascending: false }),
    ]);
    setEvents(evRes.data || []);
    setParts(prtRes.data || []);
    setLoading(false);
  };

  const fetchPending = async () => {
    const [evRes, grpRes] = await Promise.all([
      supabase.from('events').select('*').eq('status','pending').order('created_at',{ascending:false}),
      supabase.from('groups').select('*').eq('status','pending').order('created_at',{ascending:false}),
    ]);
    setPendingEvents(evRes.data||[]);
    setPendingGroups(grpRes.data||[]);
  };

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const approveEvent = async (id:string) => {
    setApproving(id);
    await supabase.from('events').update({status:'upcoming'}).eq('id',id);
    fetchPending();
    setApproving('');
  };

  const rejectEvent = async (id:string) => {
    setApproving(id+'r');
    await supabase.from('events').update({status:'rejected'}).eq('id',id);
    fetchPending();
    setApproving('');
  };

  const togglePartActive = async (id: string, current: boolean) => {
    await supabase.from('parts').update({ active: !current }).eq('id', id);
    fetchData();
  };

  const openEdit = (item: any, type: 'event' | 'part') => {
    setEditModal({ ...item });
    setEditType(type);
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const table = editType === 'event' ? 'events' : 'parts';
    await supabase.from(table).update(editModal).eq('id', editModal.id);
    setEditModal(null);
    fetchData();
  };

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

            <TouchableOpacity style={ts.loginBtn} onPress={handleLogin}>
              <Text style={ts.loginBtnText}>AUTHENTICATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Admin Panel</Text>
          <Text style={ts.headerSubtitle}>System Management</Text>
        </View>
        <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={ts.logoutBtn}>
          <Text style={ts.logoutText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      <View style={ts.tabs}>
        {[
          { id: 'dashboard', icon: 'speedometer-outline', label: 'Dash' },
          { id: 'events', icon: 'flag-outline', label: 'Events' },
          { id: 'parts', icon: 'construct-outline', label: 'Market' },
          { id: 'approval', icon: 'notifications-outline', label: 'Approvals' },
        ].map((tab: any) => (
          <TouchableOpacity 
            key={tab.id} 
            style={[ts.tab, activeTab === tab.id && ts.activeTab]} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={20} color={activeTab === tab.id ? colors.accent : colors.textMuted} />
            <Text style={[ts.tabLabel, activeTab === tab.id && ts.activeTabLabel]}>{tab.label}</Text>
            {tab.id === 'approval' && (pendingEvents.length + pendingGroups.length) > 0 && (
              <View style={ts.tabBadge} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={ts.content} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        {activeTab === 'dashboard' && (
          <View>
            <Text style={ts.sectionLabel}>OVERVIEW</Text>
            <View style={ts.statsGrid}>
              <TeslaCard style={ts.statItem}>
                <Text style={ts.statVal}>{events.length}</Text>
                <Text style={ts.statLabel}>Events</Text>
              </TeslaCard>
              <TeslaCard style={ts.statItem}>
                <Text style={ts.statVal}>{parts.length}</Text>
                <Text style={ts.statLabel}>Products</Text>
              </TeslaCard>
              <TeslaCard style={ts.statItem}>
                <Text style={[ts.statVal, { color: colors.accent }]}>{pendingEvents.length + pendingGroups.length}</Text>
                <Text style={ts.statLabel}>Pending</Text>
              </TeslaCard>
            </View>

            <TeslaCard style={ts.infoCard}>
              <Ionicons name="information-circle" size={24} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={ts.infoTitle}>System Status</Text>
                <Text style={ts.infoDesc}>All services operational. Database synchronization active via Supabase Realtime.</Text>
              </View>
            </TeslaCard>
          </View>
        )}

        {activeTab === 'events' && (
          <View>
            <Text style={ts.sectionLabel}>EVENT CONTROL</Text>
            {loading ? <ActivityIndicator color={colors.accent} /> : events.map(ev => (
              <TeslaCard key={ev.id} style={ts.manageCard}>
                <View style={ts.manageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.manageTitle}>{ev.title}</Text>
                    <Text style={ts.manageSub}>📍 {ev.location} • {ev.status}</Text>
                  </View>
                  <TouchableOpacity style={ts.editIcon} onPress={() => openEdit(ev, 'event')}>
                    <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </TeslaCard>
            ))}
          </View>
        )}

        {activeTab === 'parts' && (
          <View>
            <Text style={ts.sectionLabel}>MARKETPLACE CONTROL</Text>
            {loading ? <ActivityIndicator color={colors.accent} /> : parts.map(p => (
              <TeslaCard key={p.id} style={ts.manageCard}>
                <View style={ts.manageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ts.manageTitle}>{p.name}</Text>
                    <Text style={ts.manageSub}>{p.category} • Rp {p.price?.toLocaleString()}</Text>
                  </View>
                  <View style={ts.actions}>
                    <TouchableOpacity onPress={() => togglePartActive(p.id, p.active)}>
                      <Ionicons name={p.active ? "eye-outline" : "eye-off-outline"} size={22} color={p.active ? colors.accent : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit(p, 'part')}>
                      <Ionicons name="create-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TeslaCard>
            ))}
          </View>
        )}

        {activeTab === 'approval' && (
          <View>
            <Text style={ts.sectionLabel}>PENDING APPROVALS</Text>
            {pendingEvents.length === 0 && pendingGroups.length === 0 ? (
              <TeslaCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Queue is empty.</Text>
              </TeslaCard>
            ) : (
              <>
                {pendingEvents.map(ev => (
                  <TeslaCard key={ev.id} style={ts.approvalCard}>
                    <Text style={ts.approvalType}>EVENT REQUEST</Text>
                    <Text style={ts.approvalTitle}>{ev.title}</Text>
                    <Text style={ts.approvalInfo}>By {ev.organizer_name} • {ev.location}</Text>
                    <View style={ts.approvalBtns}>
                      <TouchableOpacity style={ts.btnReject} onPress={() => rejectEvent(ev.id)}>
                        <Text style={ts.btnRejectText}>REJECT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={ts.btnApprove} onPress={() => approveEvent(ev.id)}>
                        <Text style={ts.btnApproveText}>APPROVE</Text>
                      </TouchableOpacity>
                    </View>
                  </TeslaCard>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Modify {editType === 'event' ? 'Event' : 'Part'}</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {editModal && (
              <ScrollView>
                <Text style={ts.inputLabel}>NAME</Text>
                <TextInput
                  style={ts.modalInput}
                  value={editType === 'event' ? editModal.title : editModal.name}
                  onChangeText={v => setEditModal((m: any) => editType === 'event' ? { ...m, title: v } : { ...m, name: v })}
                />

                <Text style={ts.inputLabel}>PRICE</Text>
                <TextInput
                  style={ts.modalInput}
                  value={String(editModal.price)}
                  onChangeText={v => setEditModal((m: any) => ({ ...m, price: parseInt(v) || 0 }))}
                  keyboardType="numeric"
                />

                {editType === 'event' && (
                  <>
                    <Text style={ts.inputLabel}>LOCATION</Text>
                    <TextInput
                      style={ts.modalInput}
                      value={editModal.location}
                      onChangeText={v => setEditModal((m: any) => ({ ...m, location: v }))}
                    />
                  </>
                )}

                <TouchableOpacity style={ts.saveBtn} onPress={saveEdit}>
                  <Text style={ts.saveBtnText}>APPLY CHANGES</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loginBox: { flex: 1, justifyContent: 'center', padding: spacing.xxl },
  loginLogo: { alignItems: 'center', marginBottom: spacing.xxl },
  loginTitle: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  loginSubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  form: { gap: spacing.lg },
  input: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: spacing.lg, color: colors.text, fontSize: 16 },
  loginBtn: { backgroundColor: colors.accent, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#000', fontWeight: '800', letterSpacing: 2 },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#111' },
  logoutText: { color: colors.error, fontSize: 10, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#111' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  activeTabLabel: { color: colors.accent },
  tabBadge: { position: 'absolute', top: 8, right: '25%', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  content: { flex: 1 },
  scrollPadding: { padding: spacing.lg, paddingBottom: 100 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  statVal: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111' },
  infoTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  infoDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  manageCard: { paddingVertical: spacing.md },
  manageRow: { flexDirection: 'row', alignItems: 'center' },
  manageTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  manageSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 16 },
  editIcon: { padding: 4 },
  approvalCard: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  approvalType: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  approvalTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  approvalInfo: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  approvalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnApprove: { flex: 1, backgroundColor: colors.accent, padding: 10, borderRadius: 6, alignItems: 'center' },
  btnApproveText: { color: '#000', fontWeight: '800', fontSize: 11 },
  btnReject: { flex: 1, backgroundColor: '#111', padding: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnRejectText: { color: colors.textMuted, fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', marginBottom: 8 },
  modalInput: { backgroundColor: '#111', borderRadius: 8, padding: 14, color: colors.text, marginBottom: 20 },
  saveBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#000', fontWeight: '800', letterSpacing: 1 }
});

export default AdminScreen;
