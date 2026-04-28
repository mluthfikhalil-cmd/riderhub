import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';

const COLORS = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  primary: '#00D4AA',
  secondary: '#FF6B35',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
  shopee: '#EE4D2D',
  tokped: '#03AC0E',
};

// Affiliate ID
const AFFILIATE_ID = '11319481705';

// Shopee link builder
const buildShopeeLink = (productId: string, productName: string) => {
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `https://shopee.co.id/${slug}-i.${productId}?ref=${AFFILIATE_ID}`;
};

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  sold: number;
  category: 'helm' | 'sparepart' | 'oil' | 'accessories';
  shopeeId: string;
  commission: number; // percentage
}

const products: Product[] = [
  {
    id: '100001',
    name: 'Helm INK Borneo Flip Up Black Red',
    price: 850000,
    originalPrice: 950000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.9,
    sold: 2500,
    category: 'helm',
    shopeeId: '100001',
    commission: 5,
  },
  {
    id: '100002',
    name: 'Knalpot Racing R9 Stainless Full System',
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.7,
    sold: 890,
    category: 'sparepart',
    shopeeId: '100002',
    commission: 6,
  },
  {
    id: '100003',
    name: 'Oli Shell Advance AX7 4T 1L',
    price: 145000,
    originalPrice: 165000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.8,
    sold: 5200,
    category: 'oil',
    shopeeId: '100003',
    commission: 4,
  },
  {
    id: '100004',
    name: 'Sarung Tangan Riding GPS Gloves',
    price: 285000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.6,
    sold: 1100,
    category: 'accessories',
    shopeeId: '100004',
    commission: 5,
  },
  {
    id: '100005',
    name: 'Busi NGK Iridium IX untuk Honda CBR/MiVi',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.9,
    sold: 3800,
    category: 'sparepart',
    shopeeId: '100005',
    commission: 5,
  },
  {
    id: '100006',
    name: 'Helm KYT NF-200 Flip Up Premium',
    price: 780000,
    originalPrice: 850000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.8,
    sold: 1900,
    category: 'helm',
    shopeeId: '100006',
    commission: 5,
  },
  {
    id: '100007',
    name: 'AKTIVShock Suspension Belt Motor',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.5,
    sold: 620,
    category: 'sparepart',
    shopeeId: '100007',
    commission: 7,
  },
  {
    id: '100008',
    name: 'Cover Jok套防水机车主播同款摩托车座套',
    price: 185000,
    originalPrice: 220000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    rating: 4.7,
    sold: 2800,
    category: 'accessories',
    shopeeId: '100008',
    commission: 6,
  },
];

const categories = [
  { id: 'all', label: 'Semua', emoji: '🛒' },
  { id: 'helm', label: 'Helm', emoji: '🪖' },
  { id: 'sparepart', label: 'Sparepart', emoji: '🔧' },
  { id: 'oil', label: 'Oli', emoji: '🛢️' },
  { id: 'accessories', label: 'Aksesoris', emoji: '🎒' },
];

const formatPrice = (price: number) => {
  return 'Rp ' + price.toLocaleString('id-ID');
};

const PartsMarketplaceScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleBuyClick = (product: Product) => {
    const link = buildShopeeLink(product.shopeeId, product.name);
    // Track click (in real app, send to analytics)
    console.log('Affiliate link clicked:', link);
    // Open in new tab
    window.open(link, '_blank');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Parts Marketplace</Text>
          <Text style={styles.subtitle}>Produk berkualitas dengan harga terbaik</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <input
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Affiliate Banner */}
        <View style={styles.affiliateBanner}>
          <Text style={styles.affiliateText}>🎁 Dukung RiderHub - Beli lewat link ini, komisi membantu kami terus berkembang!</Text>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <Text style={styles.productImagePlaceholder}>🛒</Text>
                {product.originalPrice && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                  {product.originalPrice && (
                    <Text style={styles.originalPrice}>
                      {formatPrice(product.originalPrice)}
                    </Text>
                  )}
                </View>

                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Text style={styles.soldText}>| {product.sold.toLocaleString()} terjual</Text>
                </View>

                <View style={styles.commissionBadge}>
                  <Text style={styles.commissionText}>
                    💰 Commission ~{formatPrice(Math.round(product.price * product.commission / 100))}
                  </Text>
                </View>

                <button
                  style={styles.buyButton}
                  onClick={() => handleBuyClick(product)}
                >
                  🛒 Beli di Shopee
                </button>
              </View>
            </View>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
            <Text style={styles.emptySubtext}>Coba别的 kategori atau kata kunci lain</Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Floating Affiliate Stats */}
      <View style={styles.floatingStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>🎁</Text>
          <Text style={styles.statLabel}>Support RiderHub</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  
  header: { paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, backgroundColor: 'transparent', paddingVertical: 12, fontSize: 14, color: COLORS.text, outline: 'none', border: 'none' },
  
  categoryScroll: { marginBottom: 16 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  categoryButtonActive: { backgroundColor: COLORS.primary },
  categoryEmoji: { fontSize: 16, marginRight: 6 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  categoryLabelActive: { color: COLORS.background },
  
  affiliateBanner: { backgroundColor: 'rgba(0, 212, 170, 0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
  affiliateText: { fontSize: 12, color: COLORS.primary, textAlign: 'center', fontWeight: '500' },
  
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  
  productCard: { width: '50%', paddingHorizontal: 6, marginBottom: 16 },
  productImageContainer: { backgroundColor: COLORS.surface, borderRadius: 12, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  productImagePlaceholder: { fontSize: 48 },
  discountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '700', color: COLORS.text },
  
  productInfo: { paddingTop: 8 },
  productName: { fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 16, minHeight: 32 },
  
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  productPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  originalPrice: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through', marginLeft: 6 },
  
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingStar: { fontSize: 10 },
  ratingText: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 2 },
  soldText: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4 },
  
  commissionBadge: { backgroundColor: 'rgba(255, 107, 53, 0.1)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  commissionText: { fontSize: 10, color: COLORS.secondary, fontWeight: '600' },
  
  buyButton: { backgroundColor: COLORS.shopee, color: COLORS.text, paddingVertical: 10, borderRadius: 8, fontSize: 12, fontWeight: '700', marginTop: 8, width: '100%', border: 'none', cursor: 'pointer' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  
  bottomSpace: { height: 100 },
  
  floatingStats: { position: 'absolute', bottom: 100, left: 16, right: 16, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statValue: { fontSize: 16, marginRight: 8 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
});

export default PartsMarketplaceScreen;