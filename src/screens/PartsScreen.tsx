import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Card, Badge, SectionTitle } from '../components';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const PartsScreen = () => {
  const categoryPills = ['Semua', 'Filter', 'Oli', 'Kampas', 'Busi', 'Ban', 'Aksesoris'];
  const [activeCategory, setActiveCategory] = React.useState('Semua');

  const parts = [
    {
      id: 1,
      name: 'Oli Motor壳牌 Shell Advance AX7',
      category: 'Oli',
      price: 'Rp 85.000',
      originalPrice: 'Rp 120.000',
      location: 'Jakarta Selatan',
      seller: 'OTOMOTIF88',
      rating: 4.9,
      sold: 234,
      image: '🛢️',
      badge: 'Terjual',
    },
    {
      id: 2,
      name: 'Filter Udara Honda CBR150R Original',
      category: 'Filter',
      price: 'Rp 65.000',
      originalPrice: 'Rp 90.000',
      location: 'Bandung',
      seller: 'PartMotorPrime',
      rating: 4.8,
      sold: 156,
      image: '💨',
      badge: 'Hot',
    },
    {
      id: 3,
      name: 'Kampas Rem Yamaha NMAX Original',
      category: 'Kampas',
      price: 'Rp 120.000',
      originalPrice: null,
      location: 'Surabaya',
      seller: 'BengkelMaju',
      rating: 4.7,
      sold: 89,
      image: '🛞',
      badge: null,
    },
    {
      id: 4,
      name: 'Busi NGK Iridium IRUK7D',
      category: 'Busi',
      price: 'Rp 45.000',
      originalPrice: 'Rp 65.000',
      location: 'Jakarta Barat',
      seller: 'SparepartsOnline',
      rating: 5.0,
      sold: 412,
      image: '⚡',
      badge: 'Best Seller',
    },
    {
      id: 5,
      name: 'Ban Michelin Pilot Street 140/70-17',
      category: 'Ban',
      price: 'Rp 450.000',
      originalPrice: 'Rp 520.000',
      location: 'Bekasi',
      seller: 'VulkanisirMaju',
      rating: 4.6,
      sold: 67,
      image: '🏍️',
      badge: 'Diskon',
    },
    {
      id: 6,
      name: 'Aksesoris Tank Pad CBR150R Carbon',
      category: 'Aksesoris',
      price: 'Rp 180.000',
      originalPrice: null,
      location: 'Tangerang',
      seller: 'ModifStyle',
      rating: 4.9,
      sold: 45,
      image: '🎨',
      badge: 'New',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Spareparts</Text>
          <Text style={styles.subtitle}>Marketplace spareparts motor</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Cari spareparts...</Text>
          <Text style={styles.filterIcon}>⚙️</Text>
        </View>

        {/* Category Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categoryPills.map((pill) => (
            <TouchableOpacity
              key={pill}
              style={[
                styles.categoryPill,
                activeCategory === pill && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(pill)}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === pill && styles.categoryTextActive,
              ]}>
                {pill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerEmoji}>🎁</Text>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Diskon 20%</Text>
                <Text style={styles.bannerSubtitle}>Semua oli motor premium</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Belanja</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Parts Grid */}
        <SectionTitle title="📦 Produk" action="Terbaru" />
        <View style={styles.partsGrid}>
          {parts.map((part) => (
            <TouchableOpacity key={part.id} style={styles.partCard}>
              <View style={styles.partImageContainer}>
                <Text style={styles.partEmoji}>{part.image}</Text>
                {part.badge && (
                  <View style={[
                    styles.partBadge,
                    part.badge === 'Hot' && styles.badgeHot,
                    part.badge === 'Best Seller' && styles.badgeBestSeller,
                    part.badge === 'New' && styles.badgeNew,
                    part.badge === 'Diskon' && styles.badgeDiskon,
                    part.badge === 'Terjual' && styles.badgeTerjual,
                  ]}>
                    <Text style={styles.partBadgeText}>{part.badge}</Text>
                  </View>
                )}
              </View>
              <View style={styles.partInfo}>
                <Text style={styles.partName} numberOfLines={2}>{part.name}</Text>
                <Text style={styles.partPrice}>{part.price}</Text>
                {part.originalPrice && (
                  <Text style={styles.partOriginalPrice}>{part.originalPrice}</Text>
                )}
                <View style={styles.partMeta}>
                  <Text style={styles.partLocation}>📍 {part.location}</Text>
                  <View style={styles.partRating}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingText}>{part.rating}</Text>
                  </View>
                </View>
                <Text style={styles.partSold}>Terjual {part.sold}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  filterIcon: {
    fontSize: 20,
  },
  categoryScroll: {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.background,
  },
  bannerContainer: {
    marginBottom: spacing.lg,
  },
  banner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  bannerText: {},
  bannerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.secondary,
  },
  bannerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bannerButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bannerButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  partCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  partImageContainer: {
    height: 100,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  partEmoji: {
    fontSize: 48,
  },
  partBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  badgeHot: {
    backgroundColor: '#FF4444',
  },
  badgeBestSeller: {
    backgroundColor: colors.secondary,
  },
  badgeNew: {
    backgroundColor: colors.info,
  },
  badgeDiskon: {
    backgroundColor: colors.success,
  },
  badgeTerjual: {
    backgroundColor: colors.textMuted,
  },
  partBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  partInfo: {
    padding: spacing.sm,
  },
  partName: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    height: 32,
  },
  partPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  partOriginalPrice: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  partMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  partLocation: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  partRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 10,
    marginRight: 2,
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  partSold: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  bottomSpace: {
    height: 100,
  },
});

export default PartsScreen;