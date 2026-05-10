import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Platform, Image, Linking, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TeslaCard } from '../components/TeslaCard';
import { CloseButton } from '../components/HeaderButtons';
import { buildShopeeUrl, SHOPEE_AFFILIATE_ID } from '../lib/shopee';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORY_PILLS = ['Semua', 'Oli', 'Filter', 'Kampas', 'Busi', 'Ban', 'Aksesoris'];

// Quick filters — common brand/model keywords
const QUICK_FILTERS = ['NMAX', 'Vario', 'BeAT', 'CBR', 'R15', 'Aerox', 'PCX', 'Scoopy', 'KYT', 'INK', 'NGK', 'Shell', 'Brembo'];

type SortMode = 'newest' | 'sales' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
  { key: 'newest',     label: 'Terbaru',        icon: 'sparkles-outline' },
  { key: 'sales',      label: 'Terlaris',       icon: 'flame-outline' },
  { key: 'price_asc',  label: 'Harga Termurah', icon: 'arrow-down-outline' },
  { key: 'price_desc', label: 'Harga Termahal', icon: 'arrow-up-outline' },
  { key: 'rating',     label: 'Rating',         icon: 'star-outline' },
];

const RECENT_KEY = 'riderhub_recent_searches';
const MAX_RECENT = 8;

const PartsScreen = ({ navigation }: any) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchInput, setSearchInput] = useState('');     // raw input (typed)
  const [searchQuery, setSearchQuery] = useState('');     // debounced, used for filtering
  const [sortMode, setSortMode] = useState<SortMode>('sales');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [dbParts, setDbParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    fetchParts();
    loadCart();
    loadRecent();
  }, []);

  // Debounce search input → searchQuery
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCart = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('riderhub_cart_items');
        if (saved) setCartIds(JSON.parse(saved));
      }
    } catch (_) { /* noop */ }
  };

  const loadRecent = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(RECENT_KEY);
        if (saved) setRecentSearches(JSON.parse(saved));
      }
    } catch (_) { /* noop */ }
  };

  const saveRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    const next = [q, ...recentSearches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
    setRecentSearches(next);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      }
    } catch (_) { /* noop */ }
  }, [recentSearches]);

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(RECENT_KEY);
      }
    } catch (_) { /* noop */ }
  };

  const fetchParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setDbParts(data);
    } catch (err) {
      console.error('[Parts] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCart = (id: string) => {
    const newCart = cartIds.includes(id) ? cartIds.filter((i) => i !== id) : [...cartIds, id];
    setCartIds(newCart);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('riderhub_cart_items', JSON.stringify(newCart));
      }
    } catch (_) { /* noop */ }
  };

  const handleBuy = (part: any) => {
    const url = buildShopeeUrl(part);
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => undefined);
  };

  /** Search Shopee directly with current query, passing affiliate ID */
  const searchOnShopee = (q: string) => {
    const keyword = encodeURIComponent(q.trim() || 'motor');
    const url = `https://shopee.co.id/search?keyword=${keyword}&sortBy=sales&af_id=${SHOPEE_AFFILIATE_ID}&utm_source=riderhub`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => undefined);
    saveRecent(q);
  };

  /** Multi-field match across title, description, category, seller, badge */
  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = dbParts.filter((p) => {
      if (activeCategory !== 'Semua' && p.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [
        p.title,
        p.description,
        p.category,
        p.seller_name,
        p.badge,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    // Sort
    switch (sortMode) {
      case 'sales':
        result = [...result].sort((a, b) => (b.sold || 0) - (a.sold || 0));
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        break;
      case 'newest':
      default:
        // already ordered by created_at from query
        break;
    }
    return result;
  }, [dbParts, searchQuery, activeCategory, sortMode]);

  const formatPrice = (p: any) => `Rp ${Number(p || 0).toLocaleString('id-ID')}`;

  const onSubmitSearch = () => {
    if (searchInput.trim()) saveRecent(searchInput.trim());
  };

  const applyQuickFilter = (kw: string) => {
    setSearchInput(kw);
    setSearchQuery(kw);
    saveRecent(kw);
  };

  const activeSortLabel = SORT_OPTIONS.find((s) => s.key === sortMode)?.label || 'Terlaris';

  // Optional: highlight keyword in title
  const highlight = (text: string, query: string) => {
    if (!query) return <Text style={ts.partTitle} numberOfLines={2}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <Text style={ts.partTitle} numberOfLines={2}>{text}</Text>;
    return (
      <Text style={ts.partTitle} numberOfLines={2}>
        {text.slice(0, idx)}
        <Text style={ts.highlight}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <View style={ts.headerTop}>
          <View>
            <Text style={ts.title}>Marketplace</Text>
            <Text style={ts.subtitle}>Premium Parts & Accessories</Text>
          </View>
          <TouchableOpacity style={ts.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color={colors.text} />
            {cartIds.length > 0 && <View style={ts.cartDot} />}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={ts.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={ts.searchIcon} />
          <TextInput
            style={ts.searchInput}
            placeholder="Cari oli, ban, helm, NMAX, Vario..."
            placeholderTextColor={colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick filters (only when search is empty and no category picked) */}
        {!searchQuery && activeCategory === 'Semua' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.quickFilterContent}>
            {QUICK_FILTERS.map((kw) => (
              <TouchableOpacity key={kw} style={ts.quickFilterChip} onPress={() => applyQuickFilter(kw)}>
                <Ionicons name="flash" size={12} color={colors.accent} />
                <Text style={ts.quickFilterText}>{kw}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Recent searches (only when input is focused/empty) */}
        {!searchInput && recentSearches.length > 0 && (
          <View style={ts.recentRow}>
            <Text style={ts.recentLabel}>Terakhir dicari</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.recentChips}>
              {recentSearches.map((q) => (
                <TouchableOpacity key={q} style={ts.recentChip} onPress={() => applyQuickFilter(q)}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={ts.recentChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={clearRecent} style={ts.clearRecentBtn}>
                <Text style={ts.clearRecentText}>Hapus</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.categoryContent}>
          {CATEGORY_PILLS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[ts.catPill, activeCategory === cat && ts.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[ts.catText, activeCategory === cat && ts.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Result toolbar: count + sort */}
        <View style={ts.toolbar}>
          <Text style={ts.resultCount}>
            {loading ? '...' : `${filteredParts.length} produk`}
            {searchQuery ? ` untuk "${searchQuery}"` : ''}
          </Text>
          <TouchableOpacity style={ts.sortBtn} onPress={() => setShowSort(true)}>
            <Ionicons name="swap-vertical" size={14} color={colors.accent} />
            <Text style={ts.sortBtnText}>{activeSortLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        {loading ? (
          <View style={ts.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <Text style={ts.loadingText}>Memuat produk...</Text>
          </View>
        ) : filteredParts.length === 0 ? (
          <View style={ts.emptyBox}>
            <MaterialCommunityIcons name="package-variant-closed" size={56} color={colors.textMuted} />
            <Text style={ts.emptyTitle}>Tidak ada hasil</Text>
            <Text style={ts.emptyText}>
              {searchQuery
                ? `Nggak nemu "${searchQuery}" di katalog. Coba cari langsung di Shopee.`
                : 'Belum ada produk di kategori ini.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity style={ts.shopeeSearchBtn} onPress={() => searchOnShopee(searchQuery)}>
                <MaterialCommunityIcons name="storefront" size={16} color="#000" />
                <Text style={ts.shopeeSearchText}>CARI "{searchQuery}" DI SHOPEE</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={ts.grid}>
            {filteredParts.map((part) => (
              <TeslaCard key={part.id} style={[ts.card, ts.partCard]} onPress={() => setSelectedPart(part)}>
                <View style={ts.imageBox}>
                  {part.image_url ? (
                    <Image source={{ uri: part.image_url }} style={ts.image} resizeMode="cover" />
                  ) : (
                    <Text style={ts.emoji}>{part.image_emoji || '📦'}</Text>
                  )}
                  {part.badge ? (
                    <View style={ts.badge}>
                      <Text style={ts.badgeText}>{part.badge.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={ts.cardInfo}>
                  {highlight(part.title, searchQuery)}
                  <Text style={ts.partPrice}>{formatPrice(part.price)}</Text>
                  <View style={ts.cardFooter}>
                    <View style={ts.ratingRow}>
                      <Ionicons name="star" size={10} color={colors.accent} />
                      <Text style={ts.ratingVal}>{part.rating || '4.8'}</Text>
                    </View>
                    <Text style={ts.soldText}>
                      {part.sold ? `${Number(part.sold).toLocaleString('id-ID')} terjual` : '10+ terjual'}
                    </Text>
                  </View>
                </View>
              </TeslaCard>
            ))}
          </View>
        )}

        {/* "Cari lebih banyak di Shopee" footer */}
        {!loading && filteredParts.length > 0 && searchQuery ? (
          <TouchableOpacity style={ts.shopeeMoreBtn} onPress={() => searchOnShopee(searchQuery)}>
            <MaterialCommunityIcons name="storefront" size={16} color={colors.accent} />
            <Text style={ts.shopeeMoreText}>Lihat lebih banyak "{searchQuery}" di Shopee →</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Sort modal */}
      <Modal visible={showSort} transparent animationType="fade">
        <TouchableOpacity style={ts.sortBackdrop} activeOpacity={1} onPress={() => setShowSort(false)}>
          <View style={ts.sortSheet}>
            <Text style={ts.sortTitle}>Urutkan</Text>
            {SORT_OPTIONS.map((opt) => {
              const active = sortMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[ts.sortOption, active && ts.sortOptionActive]}
                  onPress={() => { setSortMode(opt.key); setShowSort(false); }}
                >
                  <Ionicons name={opt.icon as any} size={18} color={active ? colors.accent : colors.textSecondary} />
                  <Text style={[ts.sortOptionText, active && { color: colors.accent, fontWeight: '700' }]}>{opt.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.accent} style={{ marginLeft: 'auto' }} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={selectedPart !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <CloseButton onPress={() => setSelectedPart(null)} />
            </View>
            {selectedPart ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={ts.modalImageBox}>
                  {selectedPart.image_url ? (
                    <Image source={{ uri: selectedPart.image_url }} style={ts.modalImage} resizeMode="contain" />
                  ) : (
                    <Text style={ts.modalEmoji}>{selectedPart.image_emoji || '📦'}</Text>
                  )}
                </View>
                <Text style={ts.modalTag}>{selectedPart.category?.toUpperCase()}</Text>
                <Text style={ts.modalTitle}>{selectedPart.title}</Text>
                <Text style={ts.modalPrice}>{formatPrice(selectedPart.price)}</Text>
                <View style={ts.modalDivider} />
                <Text style={ts.sectionTitle}>Deskripsi</Text>
                <Text style={ts.modalDesc}>{selectedPart.description || 'Tidak ada deskripsi.'}</Text>

                <View style={ts.sellerRow}>
                  <View style={ts.sellerIcon}>
                    <Ionicons name="storefront" size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={ts.sellerName}>{selectedPart.seller_name || 'RiderHub Official'}</Text>
                    <Text style={ts.sellerLoc}>{selectedPart.location || 'Indonesia'}</Text>
                  </View>
                </View>

                <View style={ts.modalActions}>
                  <TouchableOpacity
                    style={[ts.cartAction, cartIds.includes(selectedPart.id) && ts.cartActionActive]}
                    onPress={() => handleCart(selectedPart.id)}
                  >
                    <Ionicons
                      name={cartIds.includes(selectedPart.id) ? 'checkmark' : 'cart'}
                      size={20}
                      color={cartIds.includes(selectedPart.id) ? '#000' : colors.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={ts.buyBtn} onPress={() => handleBuy(selectedPart)}>
                    <MaterialCommunityIcons name="storefront" size={18} color={colors.background} style={{ marginRight: 8 }} />
                    <Text style={ts.buyBtnText}>BELI DI SHOPEE</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: '#000', paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  cartDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 2, borderColor: '#111' },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: spacing.lg, paddingHorizontal: 16, height: 48, borderRadius: 24, marginBottom: spacing.sm, gap: 8 },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },

  quickFilterContent: { paddingHorizontal: spacing.lg, paddingVertical: 6, gap: 8 },
  quickFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(0,214,125,0.08)', borderWidth: 1, borderColor: 'rgba(0,214,125,0.25)' },
  quickFilterText: { color: colors.accent, fontSize: 11, fontWeight: '700' },

  recentRow: { paddingHorizontal: spacing.lg, marginTop: 4, marginBottom: 4 },
  recentLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  recentChips: { gap: 8, paddingRight: 8 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  recentChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  clearRecentBtn: { paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  clearRecentText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },

  categoryContent: { paddingHorizontal: spacing.lg, gap: 12, paddingVertical: 4 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  catPillActive: { borderColor: colors.accent, backgroundColor: 'rgba(0, 214, 125, 0.05)' },
  catText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: colors.accent },

  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  resultCount: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,214,125,0.3)' },
  sortBtnText: { color: colors.accent, fontSize: 11, fontWeight: '700' },

  scrollPadding: { padding: spacing.lg, paddingBottom: 100 },
  loadingBox: { marginTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 13 },
  emptyBox: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  shopeeSearchBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.accent, borderRadius: 24 },
  shopeeSearchText: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  shopeeMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,214,125,0.3)', borderStyle: 'dashed' },
  shopeeMoreText: { color: colors.accent, fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  partCard: { width: (width - 48 - 12) / 2, padding: 0, overflow: 'hidden', backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111' },
  imageBox: { height: 140, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  cardInfo: { padding: 12 },
  partTitle: { color: colors.text, fontSize: 13, fontWeight: '600', height: 36, lineHeight: 18 },
  highlight: { backgroundColor: 'rgba(0,214,125,0.25)', color: colors.accent, fontWeight: '800' },
  partPrice: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingVal: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  soldText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },

  // Sort sheet
  sortBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  sortTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.md, textAlign: 'center' },
  sortOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  sortOptionActive: { backgroundColor: 'rgba(0,214,125,0.08)', borderColor: 'rgba(0,214,125,0.3)' },
  sortOptionText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#000', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  modalImageBox: { width: '100%', height: 280, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  modalImage: { width: '100%', height: '100%' },
  modalEmoji: { fontSize: 80 },
  modalTag: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  modalPrice: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.xl },
  modalDivider: { height: 1, backgroundColor: '#111', marginBottom: spacing.xl },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  modalDesc: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: spacing.xl },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 40 },
  sellerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  sellerName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sellerLoc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  cartAction: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  cartActionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  buyBtn: { flex: 1, height: 60, borderRadius: 30, backgroundColor: colors.text, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  buyBtnText: { color: colors.background, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});

export default PartsScreen;
