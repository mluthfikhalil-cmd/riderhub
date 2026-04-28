import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Image, Platform, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../theme';

// ── Upload to Supabase Storage ──────────────────────────────
const uploadToSupabase = async (file: File): Promise<string | null> => {
  try {
    const compressed = await new Promise<File>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX = 1024;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
            else { width = Math.round((width / height) * MAX); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
          }, 'image/jpeg', 0.82);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    const fileName = `posts/${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const buf = await compressed.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('riderhub-uploads')
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('riderhub-uploads').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e: any) {
    console.error('Upload error:', e.message);
    return null;
  }
};

const TeslaCard = ({ children, style }: any) => (
  <View style={[ts.card, style]}>
    {children}
  </View>
);

const communities = [
  { id: 1, name: 'Honda CBR ID', members: '45.2K', emoji: '🏍️' },
  { id: 2, name: 'NMAX Village', members: '32.8K', emoji: '🛵' },
  { id: 3, name: 'Kawasaki W175', members: '18.5K', emoji: '🏁' },
  { id: 4, name: 'Vespa ID', members: '28.1K', emoji: '🛵' },
  { id: 5, name: 'Trail Adv', members: '15.3K', emoji: '🗺️' },
];

export default function CommunityScreen({ navigation }: any) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Rider';
  const userMotor = user?.user_metadata?.motor || '';

  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Create post modal
  const [createModal, setCreateModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Comment modal
  const [commentPost, setCommentPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const liked = localStorage.getItem('riderhub_liked_posts');
      if (liked) setLikedPosts(new Set(JSON.parse(liked)));
    }
    fetchPosts();
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);
    setPosts(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchComments = async (postId: string) => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const pickPhoto = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file: File = e.target?.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      setPreviewUri(URL.createObjectURL(file));
    };
    input.click();
  };

  const removePhoto = () => {
    if (previewUri) URL.revokeObjectURL(previewUri);
    setSelectedFile(null);
    setPreviewUri(null);
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !selectedFile) return;
    setUploading(true);
    let imageUrl: string | null = null;

    if (selectedFile) {
      setUploadProgress('📤 Uploading...');
      imageUrl = await uploadToSupabase(selectedFile);
      if (!imageUrl) {
        setUploadProgress('❌ Failed to upload.');
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase.from('posts').insert([{
      user_id: user?.id,
      user_name: userName,
      motor: userMotor,
      content: postText.trim(),
      image_url: imageUrl,
      likes_count: 0,
      comments_count: 0,
    }]);

    if (!error) {
      setPostText('');
      removePhoto();
      setCreateModal(false);
      await fetchPosts();
    }
    setUploading(false);
    setUploadProgress('');
  };

  const handleLike = async (post: any) => {
    const newLiked = new Set(likedPosts);
    const isLiked = newLiked.has(post.id);
    if (isLiked) newLiked.delete(post.id);
    else newLiked.add(post.id);
    setLikedPosts(newLiked);
    if (Platform.OS === 'web') localStorage.setItem('riderhub_liked_posts', JSON.stringify([...newLiked]));
    await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count + (isLiked ? -1 : 1)) }).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) } : p));
  };

  const openComments = async (post: any) => {
    setCommentPost(post);
    setCommentText('');
    await fetchComments(post.id);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    setPostingComment(true);
    await supabase.from('comments').insert([{
      post_id: commentPost.id,
      user_id: user?.id,
      user_name: userName,
      content: commentText.trim(),
    }]);
    await supabase.from('posts').update({ comments_count: (commentPost.comments_count || 0) + 1 }).eq('id', commentPost.id);
    setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    setCommentText('');
    await fetchComments(commentPost.id);
    setPostingComment(false);
  };

  const handleShare = async (post: any) => {
    const text = `"${post.content}" — ${post.user_name} on RiderHub`;
    if (Platform.OS === 'web' && navigator.share) {
      try { await navigator.share({ title: 'RiderHub Post', text, url: window.location.href }); } catch (_) {}
    } else if (Platform.OS === 'web' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('✅ Link copied!');
    }
  };

  return (
    <SafeAreaView style={ts.container}>
      {/* HEADER */}
      <View style={ts.header}>
        <View>
          <Text style={ts.headerTitle}>Discovery</Text>
          <Text style={ts.headerSubtitle}>Community Feed & Stories</Text>
        </View>
        <TouchableOpacity style={ts.headerAction} onPress={() => { setCreateModal(true); setUploadProgress(''); }}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={ts.scrollPadding}
      >
        {/* Communities */}
        <Text style={ts.sectionLabel}>ACTIVE COMMUNITIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ts.communityScroll} contentContainerStyle={ts.communityContent}>
          {communities.map((c) => (
            <TouchableOpacity key={c.id} style={ts.communityItem}>
              <View style={ts.communityEmoji}><Text style={{ fontSize: 24 }}>{c.emoji}</Text></View>
              <Text style={ts.communityName} numberOfLines={1}>{c.name}</Text>
              <Text style={ts.communityMeta}>{c.members}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed */}
        <Text style={ts.sectionLabel}>LATEST POSTS</Text>

        {loading ? (
          <Text style={ts.loadingText}>Loading discovery feed...</Text>
        ) : posts.length === 0 ? (
          <TeslaCard style={ts.emptyCard}>
            <Ionicons name="megaphone-outline" size={48} color={colors.textMuted} />
            <Text style={ts.emptyText}>Be the first to share something!</Text>
            <TouchableOpacity style={ts.createBtn} onPress={() => setCreateModal(true)}>
              <Text style={ts.createBtnText}>Create Post</Text>
            </TouchableOpacity>
          </TeslaCard>
        ) : (
          posts.map((post) => (
            <TeslaCard key={post.id} style={ts.postCard}>
              <View style={ts.postHeader}>
                <View style={ts.avatarCircle}>
                  <Text style={ts.avatarText}>{post.user_name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ts.postAuthor}>{post.user_name}</Text>
                  <Text style={ts.postMeta}>{post.motor || 'Rider'} · {new Date(post.created_at).toLocaleDateString()}</Text>
                </View>
              </View>

              <Text style={ts.postContent}>{post.content}</Text>

              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={ts.postImage} resizeMode="cover" />
              ) : null}

              <View style={ts.postActions}>
                <TouchableOpacity style={ts.actionBtn} onPress={() => handleLike(post)}>
                  <Ionicons name={likedPosts.has(post.id) ? "heart" : "heart-outline"} size={20} color={likedPosts.has(post.id) ? colors.error : colors.textSecondary} />
                  <Text style={[ts.actionText, likedPosts.has(post.id) && { color: colors.error }]}>{post.likes_count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ts.actionBtn} onPress={() => openComments(post)}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                  <Text style={ts.actionText}>{post.comments_count || 0}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => handleShare(post)}>
                  <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </TeslaCard>
          ))
        )}
      </ScrollView>

      {/* CREATE POST MODAL */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={() => { setCreateModal(false); removePhoto(); setPostText(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={ts.textarea}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textMuted}
              multiline
              value={postText}
              onChangeText={setPostText}
            />

            {previewUri && (
              <View style={ts.previewWrapper}>
                <Image source={{ uri: previewUri }} style={ts.previewImage} resizeMode="cover" />
                <TouchableOpacity style={ts.removePhotoBtn} onPress={removePhoto}>
                  <Ionicons name="close-circle" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            {uploadProgress ? <Text style={ts.uploadMsg}>{uploadProgress}</Text> : null}

            <View style={ts.modalActions}>
              <TouchableOpacity style={ts.pickPhotoBtn} onPress={pickPhoto}>
                <Ionicons name="camera-outline" size={24} color={colors.text} />
                <Text style={ts.pickPhotoText}>{previewUri ? 'Change Photo' : 'Add Photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ts.postSubmitBtn, (uploading || (!postText.trim() && !selectedFile)) && { opacity: 0.5 }]}
                onPress={handleCreatePost}
                disabled={uploading || (!postText.trim() && !selectedFile)}
              >
                <Text style={ts.postSubmitText}>{uploading ? 'Posting...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* COMMENT MODAL */}
      <Modal visible={commentPost !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={[ts.modalContent, { height: '80%' }]}>
            <View style={ts.modalHeader}>
              <Text style={ts.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentPost(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {(comments[commentPost?.id] || []).length === 0 ? (
                <Text style={ts.emptyComments}>No comments yet. Start the conversation!</Text>
              ) : (
                (comments[commentPost?.id] || []).map((c: any) => (
                  <View key={c.id} style={ts.commentItem}>
                    <View style={ts.commentAvatar}>
                      <Text style={ts.commentAvatarText}>{c.user_name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={ts.commentContent}>
                      <Text style={ts.commentAuthor}>{c.user_name}</Text>
                      <Text style={ts.commentText}>{c.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={ts.commentInputRow}>
              <TextInput
                style={ts.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[ts.commentSubmitBtn, (postingComment || !commentText.trim()) && { opacity: 0.5 }]}
                onPress={submitComment}
                disabled={postingComment || !commentText.trim()}
              >
                <Ionicons name="send" size={20} color={colors.accent} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  headerAction: { padding: 4 },
  scrollPadding: { paddingBottom: 100 },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  communityScroll: { marginVertical: spacing.sm },
  communityContent: { paddingHorizontal: spacing.lg, gap: 12 },
  communityItem: { width: 100, alignItems: 'center' },
  communityEmoji: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  communityName: { color: colors.text, fontSize: 10, fontWeight: '600' },
  communityMeta: { color: colors.accent, fontSize: 9, fontWeight: '700', marginTop: 2 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, padding: spacing.lg, marginBottom: spacing.lg },
  postCard: { padding: spacing.lg },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  postAuthor: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  postMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  postContent: { color: colors.text, fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.md },
  postImage: { width: '100%', height: 240, borderRadius: borderRadius.md, marginBottom: spacing.md, backgroundColor: '#111' },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: '#1C1C1E', paddingTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, marginVertical: spacing.lg },
  createBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
  createBtnText: { color: '#000', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  textarea: { backgroundColor: '#111', borderRadius: borderRadius.md, padding: 16, color: colors.text, fontSize: fontSize.md, minHeight: 120, marginBottom: spacing.lg, textAlignVertical: 'top' },
  previewWrapper: { marginBottom: spacing.lg, position: 'relative' },
  previewImage: { width: '100%', height: 180, borderRadius: borderRadius.md },
  removePhotoBtn: { position: 'absolute', top: 8, right: 8 },
  uploadMsg: { color: colors.accent, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: 12 },
  pickPhotoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111', padding: 12, borderRadius: borderRadius.md, justifyContent: 'center' },
  pickPhotoText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  postSubmitBtn: { flex: 1, backgroundColor: colors.text, padding: 12, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  postSubmitText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' },
  emptyComments: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  commentItem: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  commentContent: { flex: 1 },
  commentAuthor: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', marginBottom: 2 },
  commentText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  commentInput: { flex: 1, backgroundColor: '#111', borderRadius: borderRadius.lg, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: fontSize.sm, maxHeight: 100 },
  commentSubmitBtn: { padding: 10 }
});