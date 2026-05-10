import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { TeslaCard } from '../components/TeslaCard';
import { BackButton } from '../components/HeaderButtons';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const CART_KEY = 'riderhub_cart_items';
const QTY_KEY = 'riderhub_cart_qty';

interface Part {
  id: string;
  title: string;
  category: string;
  price: number;
  image_url: string | null;
  image_emoji: string | null;
}

const loadLocal = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
};
const saveLocal = (key: string, value: any) => {
  try { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
};

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function CartScreen({ navigation }: Props) {
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = loadLocal<string[]>(CART_KEY, []);
    const savedQty = loadLocal<Record<string, number>>(QTY_KEY, {});
    const q: Record<string, number> = {};
    ids.forEach((id) => { q[id] = savedQty[id] || 1; });
    setCartIds(ids); setQty(q);
  }, []);

  useEffect(() => {
    const fetchParts = async () => {
      if (cartIds.length === 0) { setParts([]); setLoading(false); return; }
      setLoading(true);
      const { data } = await supabase.from('parts').select('id, title, category, price, image_url, image_emoji').in('id', cartIds);
      setParts((data || []) as Part[]);
      setLoading(false);
    };
    fetchParts();
  }, [cartIds]);

  const total = parts.reduce((sum, p) => sum + p.price * (qty[p.id] || 1), 0);

  const removeItem = (id: string) => {
    const newIds = cartIds.filter((i) => i !== id);
    setCartIds(newIds); saveLocal(CART_KEY, newIds);
    const newQty = { ...qty }; delete newQty[id];
    setQty(newQty); saveLocal(QTY_KEY, newQty);
  };

  const changeQty = (id: string, delta: number) => {
    const newVal = Math.max(1, (qty[id] || 1) + delta);
    const newQty = { ...qty, [id]: newVal };
    setQty(newQty); saveLocal(QTY_KEY, newQty);
  };

  const handleCheckout = () => {
    const lines = parts.map((p) => `- ${p.title} x${qty[p.id] || 1} = ${formatIDR(p.price * (qty[p.id] || 1))}`).join('\n');
    const msg = `Halo, saya ingin memesan:\n${lines}\n\nTotal: ${formatIDR(total)}\n\nMohon konfirmasi ketersediaan stok.`;
    const url = `https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => undefined);
  };

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={ts.headerTitle}>Inventory</Text>
          <Text style={ts.headerSubtitle}>SHOPPING CART</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
      ) : parts.length === 0 ? (
        <View style={ts.emptyContainer}>
          <View style={ts.emptyIconBox}>
            <MaterialCommunityIcons name="cart-off" size={64} color={colors.textMuted} />
          </View>
          <Text style={ts.emptyTitle}>Cart is Empty</Text>
          <Text style={ts.emptySubtitle}>You haven't added any parts to your inventory yet.</Text>
          <TouchableOpacity style={ts.shopBtn} onPress={() => navigation.navigate('Main', { screen: 'Parts' })}>
            <Text style={ts.shopBtnText}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={ts.scrollPadding}>
            {parts.map((item) => (
              <TeslaCard key={item.id} style={[ts.card, ts.itemCard]}>
                <View style={ts.itemRow}>
                  <View style={ts.itemIconBox}>
                    <Text style={{ fontSize: 28 }}>{item.image_emoji || '🔧'}</Text>
                  </View>
                  <View style={ts.itemInfo}>
                    <Text style={ts.itemName} numberOfLines={2}>{item.title}</Text>
                    <Text style={ts.itemPrice}>{formatIDR(item.price * (qty[item.id] || 1))}</Text>
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
              <Text style={ts.totalValue}>{formatIDR(total)}</Text>
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
