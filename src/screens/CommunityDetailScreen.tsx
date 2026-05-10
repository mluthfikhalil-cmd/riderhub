import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import { BackButton, CloseButton } from '../components/HeaderButtons';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityDetail'>;

export default function CommunityDetailScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const community = route.params?.community;

  // No community param → bounce back to Community tab
  useEffect(() => {
    if (!community) {
      navigation.replace('Main', { screen: 'Community' });
    }
  }, [community, navigation]);

  if (!community) {
    return (
      <SafeAreaView style={ts.container}>
        <View style={ts.emptyState}>
          <Text style={ts.emptyText}>Community not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchMembership = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', community.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsJoined(!!data);
  }, [user?.id, community.id]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('group_posts')
      .select('*')
      .eq('group_id', community.id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }, [community.id]);

  useEffect(() => { fetchMembership(); }, [fetchMembership]);
  useEffect(() => { if (isJoined) fetchPosts(); }, [isJoined, fetchPosts]);

  const handleJoin = async () => {
    if (!user?.id || joining) return;
    setJoining(true);
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Rider';
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', community.id).eq('user_id', user.id);
      setIsJoined(false);
    } else {
      await supabase.from('group_members').insert({ group_id: community.id, user_id: user.id, user_name: userName });
      setIsJoined(true);
    }
    setJoining(false);
  };

  const handlePost = async () => {
    if (!newPostTitle.trim() || !user?.id) return;
    setPosting(true);
    const { error } = await supabase.from('group_posts').insert([{
      group_id: community.id,
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Rider',
      title: newPostTitle.trim(),
    }]);
    if (!error) {
      setNewPostTitle('');
      setShowPostModal(false);
      fetchPosts();
    }
    setPosting(false);
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={ts.headerTitle}>Collective</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        <View style={ts.hero}>
          <View style={ts.heroIconBox}>
            <Text style={ts.heroEmoji}>{community.image || '🏍️'}</Text>
          </View>
          <Text style={ts.communityName}>{community.name}</Text>
          <View style={ts.badgeRow}>
            {community.type && (
              <View style={ts.badge}><Text style={ts.badgeText}>{community.type.toUpperCase()}</Text></View>
            )}
            <Text style={ts.membersText}>{community.members} Members</Text>
          </View>
        </View>

        <TeslaCard style={[ts.card, ts.aboutCard]}>
          <Text style={ts.sectionLabel}>ABOUT THIS COLLECTIVE</Text>
          <Text style={ts.aboutText}>
            Welcome to {community.name}. Private space for members to share technical insights, coordinate rides, and discuss the future of performance riding.
          </Text>
          <TouchableOpacity style={[ts.joinBtn, isJoined && ts.joinBtnActive]} onPress={handleJoin} disabled={joining}>
            <Text style={[ts.joinBtnText, isJoined && ts.joinBtnTextActive]}>
              {joining ? '...' : (isJoined ? 'MEMBERSHIP ACTIVE ✓' : 'REQUEST MEMBERSHIP')}
            </Text>
          </TouchableOpacity>
        </TeslaCard>

        <View style={ts.feedHeader}>
          <Text style={ts.sectionLabel}>DISCUSSIONS</Text>
          {isJoined && (
            <TouchableOpacity onPress={() => setShowPostModal(true)}>
              <Text style={ts.createPostText}>+ NEW TOPIC</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isJoined ? (
          <TeslaCard style={[ts.card, ts.lockedCard]}>
            <MaterialCommunityIcons name="lock-outline" size={48} color={colors.textMuted} />
            <Text style={ts.lockedTitle}>Restricted Access</Text>
            <Text style={ts.lockedText}>Join to view and participate in discussions.</Text>
          </TeslaCard>
        ) : (
          <View style={ts.feed}>
            {loading ? (
              <Text style={ts.loadingText}>Fetching collective data...</Text>
            ) : posts.length === 0 ? (
              <Text style={ts.emptyText}>No discussions yet. Start a new topic.</Text>
            ) : (
              posts.map((post) => (
                <TeslaCard key={post.id} style={[ts.card, ts.postCard]}>
                  <View style={ts.postTop}>
                    <View style={ts.miniAvatar}>
                      <Text style={ts.miniAvatarText}>{post.user_name?.[0]}</Text>
                    </View>
                    <View>
                      <Text style={ts.postUser}>{post.user_name}</Text>
                      <Text style={ts.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={ts.postTitle}>{post.title}</Text>
                  <View style={ts.postFooter}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.accent} />
                    <Text style={ts.commentCount}>{post.comments || 0} Replies</Text>
                  </View>
                </TeslaCard>
              ))
            )}
          </View>
        )}

        <View style={ts.bottomSpace} />
      </ScrollView>

      <Modal visible={showPostModal} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>New Topic</Text>
              <CloseButton onPress={() => setShowPostModal(false)} />
            </View>
            <TextInput
              style={ts.input}
              placeholder="What's the topic of discussion?"
              placeholderTextColor={colors.textMuted}
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              multiline
            />
            <TouchableOpacity style={[ts.submitBtn, (!newPostTitle.trim() || posting) && { opacity: 0.5 }]} onPress={handlePost} disabled={posting || !newPostTitle.trim()}>
              <Text style={ts.submitBtnText}>{posting ? 'POSTING...' : 'PUBLISH TOPIC'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scrollPadding: { paddingBottom: 100 },
  hero: { alignItems: 'center', paddingVertical: 40 },
  heroIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  heroEmoji: { fontSize: 50 },
  communityName: { color: colors.text, fontSize: 24, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  badge: { backgroundColor: 'rgba(0, 214, 125, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.accent },
  badgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  membersText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
  aboutCard: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  aboutText: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 24 },
  joinBtn: { width: '100%', height: 54, borderRadius: 12, backgroundColor: colors.text, justifyContent: 'center', alignItems: 'center' },
  joinBtnActive: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  joinBtnText: { color: colors.background, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  joinBtnTextActive: { color: colors.accent },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: 48, marginBottom: 20 },
  createPostText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  lockedCard: { marginHorizontal: spacing.lg, alignItems: 'center', paddingVertical: 60, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222' },
  lockedTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 20 },
  lockedText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 20 },
  feed: { paddingHorizontal: spacing.lg },
  postCard: { marginBottom: 12, padding: 16 },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111' },
  miniAvatarText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  postUser: { color: colors.text, fontSize: 14, fontWeight: '700' },
  postDate: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  postTitle: { color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#111' },
  commentCount: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomSpace: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#000', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  input: { backgroundColor: '#111', borderRadius: 16, padding: 20, color: colors.text, fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 40 },
  submitBtn: { width: '100%', height: 60, borderRadius: 30, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
