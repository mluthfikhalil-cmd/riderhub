import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Card, Badge } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const CommunityScreen = () => {
  const communities = [
    {
      id: 1,
      name: 'Honda CBR Indonesia',
      members: '45.2K',
      type: 'Official Club',
      image: '🏍️',
      color: '#FF0000',
      posts: 1234,
      recentActivity: '2 menit lalu',
    },
    {
      id: 2,
      name: 'Yamaha NMAX Village',
      members: '32.8K',
      type: 'Modifikasi',
      image: '🏍️',
      color: '#0000FF',
      posts: 892,
      recentActivity: '5 menit lalu',
    },
    {
      id: 3,
      name: 'Kawasaki W175 Club',
      members: '18.5K',
      type: 'Touring',
      image: '🗺️',
      color: '#008000',
      posts: 567,
      recentActivity: '15 menit lalu',
    },
    {
      id: 4,
      name: 'Vespa Indonesia',
      members: '28.1K',
      type: 'Classic',
      image: '🛵',
      color: '#FFA500',
      posts: 1105,
      recentActivity: '1 jam lalu',
    },
  ];

  const posts = [
    {
      id: 1,
      author: 'Budi Setiawan',
      community: 'Honda CBR Indonesia',
      avatar: '👨',
      time: '10 menit lalu',
      content: 'Bro ada yang tau nggak, berapa sih harga kampas rem CBR150R yang original? Mau ganti nih tapi bingung mau pilih yang mana. Thanks sebelumnya! 🙏',
      likes: 45,
      comments: 23,
      images: ['🔧'],
    },
    {
      id: 2,
      author: 'Sarah Motor',
      community: 'Yamaha NMAX Village',
      avatar: '👩',
      time: '30 menit lalu',
      content: 'Share hasil modif NMAX gue nih! 🚀\n\n- Slip on custom\n- LED Projector\n- Digital dashboard\n- Seat cowl\n\nTotal budget sekitar 4 juta. Worth it nggak sih? 🤔',
      likes: 128,
      comments: 67,
      images: ['🏍️'],
    },
    {
      id: 3,
      author: 'Rizky Racing',
      community: 'Kawasaki W175 Club',
      avatar: '🏍️',
      time: '1 jam lalu',
      content: 'Guys, mau kasih info nih. Ada track day di Sentul akhir bulan ini. Harga masuk 500rb udah termasuk makan dan minum. Siapa yang mau ikut? Boleh komentar di bawah ya! 🏁',
      likes: 89,
      comments: 45,
      images: ['🏁'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👥 Komunitas</Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Buat Post</Text>
          </TouchableOpacity>
        </View>

        {/* Communities Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Komunitas Populer</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.communityScroll}
        >
          {communities.map((community) => (
            <TouchableOpacity key={community.id} style={styles.communityCard}>
              <View style={[styles.communityIcon, { backgroundColor: community.color + '20' }]}>
                <Text style={styles.communityEmoji}>{community.image}</Text>
              </View>
              <Text style={styles.communityName} numberOfLines={1}>{community.name}</Text>
              <Text style={styles.communityMembers}>👥 {community.members}</Text>
              <Badge label={community.type} variant="info" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Post Feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📰 Post Terbaru</Text>
        </View>
        {posts.map((post) => (
          <Card key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthor}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.author}</Text>
                  <Text style={styles.postMeta}>{post.community} • {post.time}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.moreButton}>⋮</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postImageContainer}>
              <Text style={styles.postImage}>{post.images[0]}</Text>
            </View>
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>❤️</Text>
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📤</Text>
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  communityScroll: {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  communityCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityEmoji: {
    fontSize: 28,
  },
  communityName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  communityMembers: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  postCard: {
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 24,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  postMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  postImageContainer: {
    height: 150,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  postImage: {
    fontSize: 64,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bottomSpace: {
    height: 100,
  },
});

export default CommunityScreen;