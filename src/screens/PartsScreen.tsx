import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Platform, Image, Linking, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const categoryPills = ['Semua', 'Oli', 'Filter', 'Kampas', 'Busi', 'Ban', 'Aksesoris'];

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

const PartsScreen = ({ navigation }: any) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [dbParts, setDbParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartIds, setCartIds] = useState<number[]>([]);

  useEffect(() => {
    fetchParts();
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('riderhub_cart_items');
        if (saved) setCartIds(JSON.parse(saved));
      }
    } catch (_) {}
  };

  const fetchParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('parts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setDbParts(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCart = (id: number) => {
    const newCart = cartIds.includes(id) ? cartIds.filter(i => i !== id) : [...cartIds, id];
    setCartIds(newCart);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('riderhub_cart_items', JSON.stringify(newCart));
      }
    } catch (_) {}
  };

  const handleBuy = (part: any) => {
    const url = part.affiliate_url || part.link || `https://wa.me/6281234567890?text=Halo, saya tertarik dengan ${part.title}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

  const filteredParts = dbParts.filter(p => {
    const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
    const matchSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatPrice = (p: any) => `Rp ${Number(p || 0).toLocaleString('id-ID')}`;

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

        <View style={ts.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={ts.searchIcon} />
          <TextInput
            style={ts.searchInput}
            placeholder="Search parts, brands, or shops"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ts.categoryContent}>
          {categoryPills.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[ts.catPill, activeCategory === cat && ts.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[ts.catText, activeCategory === cat && ts.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
        {loading ? (
          <View style={ts.loadingBox}><Text style={ts.loadingText}>Fetching data...</Text></View>
        ) : filteredParts.length === 0 ? (
          <View style={ts.emptyBox}><Text style={ts.emptyText}>No items found</Text></View>
        ) : (
          <View style={ts.grid}>
            {filteredParts.map(part => (
              <TeslaCard key={part.id} style={ts.partCard} onPress={() => setSelectedPart(part)}>
                <View style={ts.imageBox}>
                  {part.image_url ? (
                    <Image source={{ uri: part.image_url }} style={ts.image} resizeMode="cover" />
                  ) : (
                    <Text style={ts.emoji}>{part.image_emoji || '📦'}</Text>
                  )}
                  {part.badge && (
                    <View style={ts.badge}>
                      <Text style={ts.badgeText}>{part.badge.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={ts.cardInfo}>
                  <Text style={ts.partTitle} numberOfLines={2}>{part.title}</Text>
                  <Text style={ts.partPrice}>{formatPrice(part.price)}</Text>
                  <View style={ts.cardFooter}>
                    <View style={ts.ratingRow}>
                      <Ionicons name="star" size={10} color={colors.accent} />
                      <Text style={ts.ratingVal}>{part.rating || '4.8'}</Text>
                    </View>
                    <Text style={ts.soldText}>{part.sold || '10+'} Sold</Text>
                  </View>
                </View>
              </TeslaCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={selectedPart !== null} transparent animationType="slide">
        <View style={ts.modalOverlay}>
          <View style={ts.modalContent}>
            <View style={ts.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedPart(null)} style={ts.modalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedPart && (
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
                <Text style={ts.sectionTitle}>Description</Text>
                <Text style={ts.modalDesc}>{selectedPart.description}</Text>
                
                <View style={ts.sellerRow}>
                  <View style={ts.sellerIcon}>
                    <Ionicons name="storefront" size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={ts.sellerName}>{selectedPart.seller_name || 'RiderHub Official'}</Text>
                    <Text style={ts.sellerLoc}>{selectedPart.location || 'Jakarta, Indonesia'}</Text>
                  </View>
                </View>

                <View style={ts.modalActions}>
                  <TouchableOpacity 
                    style={[ts.cartAction, cartIds.includes(selectedPart.id) && ts.cartActionActive]} 
                    onPress={() => handleCart(selectedPart.id)}
                  >
                    <Ionicons name={cartIds.includes(selectedPart.id) ? "checkmark" : "cart"} size={20} color={cartIds.includes(selectedPart.id) ? "#000" : colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={ts.buyBtn} onPress={() => handleBuy(selectedPart)}>
                    <Text style={ts.buyBtnText}>BUY NOW</Text>
                  </TouchableOpacity>
                </View>
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
  header: { backgroundColor: '#000', paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  cartDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 2, borderColor: '#111' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: spacing.lg, paddingHorizontal: 16, height: 48, borderRadius: 24, marginBottom: spacing.lg },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  categoryContent: { paddingHorizontal: spacing.lg, gap: 12 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  catPillActive: { borderColor: colors.accent, backgroundColor: 'rgba(0, 214, 125, 0.05)' },
  catText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: colors.accent },
  scrollPadding: { padding: spacing.lg, paddingBottom: 100 },
  loadingBox: { marginTop: 100, alignItems: 'center' },
  loadingText: { color: colors.textSecondary },
  emptyBox: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  partCard: { width: (width - 48 - 12) / 2, padding: 0, overflow: 'hidden', backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111' },
  imageBox: { height: 140, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  cardInfo: { padding: 12 },
  partTitle: { color: colors.text, fontSize: 13, fontWeight: '600', height: 36, lineHeight: 18 },
  partPrice: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingVal: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  soldText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#000', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
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
  buyBtn: { flex: 1, height: 60, borderRadius: 30, backgroundColor: colors.text, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: colors.background, fontSize: 15, fontWeight: '800', letterSpacing: 1 }
});

export default PartsScreen;