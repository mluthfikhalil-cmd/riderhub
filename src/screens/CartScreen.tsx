import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const CART_KEY = 'riderhub_cart_items';

// Simplified parts data for the cart logic
const allParts = [
  { id: 1, name: 'Oli Shell Advance AX7 1L', category: 'Oli', price: 85000, icon: 'oil' },
  { id: 2, name: 'Filter Udara Honda CBR150R Original', category: 'Filter', price: 65000, icon: 'air-filter' },
  { id: 3, name: 'Kampas Rem Yamaha NMAX Original', category: 'Kampas', price: 120000, icon: 'disc-brake' },
  { id: 4, name: 'Busi NGK Iridium IRUK7D', category: 'Busi', price: 45000, icon: 'flash' },
  { id: 5, name: 'Ban Michelin Pilot Street 140/70-17', category: 'Ban', price: 450000, icon: 'tire' },
];

const TeslaCard = ({ children, style, onPress }: any) => {
  const W = onPress ? TouchableOpacity : View;
  return (
    <W style={[ts.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </W>
  );
};

export default function CartScreen({ navigation }: any) {
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [qty, setQty] = useState<{ [id: number]: number }>({});

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && window.localStorage) {
        const saved = localStorage.getItem(CART_KEY);
        if (saved) {
          const ids: number[] = JSON.parse(saved);
          setCartIds(ids);
          const initQty: { [id: number]: number } = {};
          ids.forEach(id => { initQty[id] = 1; });
          setQty(initQty);
        }
      }
    } catch (_) {}
  }, []);

  const cartItems = allParts.filter(p => cartIds.includes(p.id));
  const total = cartItems.reduce((sum, item) => sum + item.price * (qty[item.id] || 1), 0);

  const removeItem = (id: number) => {
    const newIds = cartIds.filter(i => i !== id);
    setCartIds(newIds);
    if (Platform.OS === 'web') {
      localStorage.setItem(CART_KEY, JSON.stringify(newIds));
    }
  };

  const changeQty = (id: number, delta: number) => {
    setQty(prev => {
      const newQty = Math.max(1, (prev[id] || 1) + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const handleCheckout = () => {
    const itemLines = cartItems.map(item => `- ${item.name} x${qty[item.id] || 1} = Rp ${(item.price * (qty[item.id] || 1)).toLocaleString('id-ID')}`).join('\n');
    const msg = `Halo, saya ingin memesan:\n${itemLines}\n\nTotal: Rp ${total.toLocaleString('id-ID')}\n\nMohon konfirmasi ketersediaan stok 🏍️`;
    const url = `https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    }
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ts.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ts.headerTitle}>Inventory</Text>
          <Text style={ts.headerSubtitle}>SHOPPING CART</Text>
        </View>
      </View>

      {cartItems.length === 0 ? (
        <View style={ts.emptyContainer}>
          <View style={ts.emptyIconBox}>
            <MaterialCommunityIcons name="cart-off" size={64} color={colors.textMuted} />
          </View>
          <Text style={ts.emptyTitle}>Cart is Empty</Text>
          <Text style={ts.emptySubtitle}>You haven't added any premium components to your inventory yet.</Text>
          <TouchableOpacity style={ts.shopBtn} onPress={() => navigation.navigate('Main', { screen: 'Parts' })}>
            <Text style={ts.shopBtnText}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
            {cartItems.map(item => (
              <TeslaCard key={item.id} style={ts.itemCard}>
                <View style={ts.itemRow}>
                  <View style={ts.itemIconBox}>
                    <MaterialCommunityIcons name={item.icon as any} size={32} color={colors.accent} />
                  </View>
                  <View style={ts.itemInfo}>
                    <Text style={ts.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={ts.itemPrice}>Rp {(item.price * (qty[item.id] || 1)).toLocaleString('id-ID')}</Text>
                    <View style={ts.qtyRow}>
                      <TouchableOpacity style={ts.qtyBtn} onPress={() => changeQty(item.id, -1)}>
                        <Ionicons name="remove" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <Text style={ts.qtyValue}>{qty[item.id] || 1}</Text>
                      <TouchableOpacity style={ts.qtyBtn} onPress={() => changeQty(item.id, 1)}>
                        <Ionicons name="add" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity style={ts.removeBtn} onPress={() => removeItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </TeslaCard>
            ))}
          </ScrollView>

          <View style={ts.checkoutBar}>
            <View style={ts.totalSection}>
              <Text style={ts.totalLabel}>TOTAL ESTIMATE</Text>
              <Text style={ts.totalValue}>Rp {total.toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity style={ts.checkoutBtn} onPress={handleCheckout}>
              <Text style={ts.checkoutBtnText}>CHECKOUT VIA WHATSAPP</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  scrollPadding: { padding: spacing.lg, paddingBottom: 160 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  itemCard: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemIconBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemPrice: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  qtyValue: { color: colors.text, fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  emptyTitle: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 12 },
  emptySubtitle: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 40 },
  shopBtn: { backgroundColor: colors.text, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28 },
  shopBtnText: { color: colors.background, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#111', padding: spacing.lg, paddingBottom: 40 },
  totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  totalValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  checkoutBtn: { backgroundColor: colors.accent, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  checkoutBtnText: { color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

export default CartScreen;
