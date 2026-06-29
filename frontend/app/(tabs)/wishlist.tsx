import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Product, wishlistApi } from '../../services/api';
import { formatMoney } from '../../utils/format';

export default function WishlistScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setProducts(await wishlistApi.get());
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchWishlist(); }, [fetchWishlist]));

  const handleRemove = (product: Product) => {
    const doRemove = async () => {
      try {
        await wishlistApi.remove(product.id);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo quitar');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Quitar "${product.name}" de favoritos?`)) doRemove();
      return;
    }
    Alert.alert('Quitar de favoritos', `¿Quitar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: doRemove },
    ]);
  };

  const GuestState = () => (
    <View style={styles.centeredState}>
      <LinearGradient colors={Gradients.primaryDark} style={styles.stateIconCircle}>
        <Ionicons name="heart-outline" size={38} color="#fff" />
      </LinearGradient>
      <Text style={styles.stateTitle}>Guarda tus favoritos</Text>
      <Text style={styles.stateSub}>Inicia sesión para ver tu lista de deseos</Text>
      <Button title="Iniciar sesión" onPress={() => router.push('/auth/login')} style={styles.stateBtn} />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.centeredState}>
      <LinearGradient colors={Gradients.primary} style={styles.stateIconCircle}>
        <Ionicons name="heart-outline" size={38} color="#fff" />
      </LinearGradient>
      <Text style={styles.stateTitle}>Sin favoritos aún</Text>
      <Text style={styles.stateSub}>Toca el corazón en cualquier producto para guardarlo aquí</Text>
      <Button title="Explorar productos" onPress={() => router.push('/(tabs)')} style={styles.stateBtn} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky header */}
      <LinearGradient colors={Gradients.hero} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Mis Favoritos</Text>
              {user && products.length > 0 && (
                <Text style={styles.headerCount}>{products.length} producto{products.length !== 1 ? 's' : ''} guardado{products.length !== 1 ? 's' : ''}</Text>
              )}
            </View>
            <View style={styles.headerIconCircle}>
              <Ionicons name="heart" size={20} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {!user ? (
        <GuestState />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, products.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchWishlist(); }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={loading ? null : <EmptyState />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push(`/product/${item.id}` as never)}
            >
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                {item.discount > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{item.discount}%</Text>
                  </View>
                )}
              </View>

              <View style={styles.info}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatMoney(item.finalPrice)}</Text>
                  {item.discount > 0 && (
                    <Text style={styles.oldPrice}>{formatMoney(item.price)}</Text>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={Colors.star} />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <View style={[styles.stockPill, { backgroundColor: item.stock > 0 ? '#ECFDF5' : Colors.dangerLight }]}>
                    <View style={[styles.stockDot, { backgroundColor: item.stock > 0 ? Colors.secondary : Colors.danger }]} />
                    <Text style={[styles.stockText, { color: item.stock > 0 ? Colors.secondary : Colors.danger }]}>
                      {item.stock > 0 ? 'En stock' : 'Agotado'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="heart-dislike" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {},
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },

  // List
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  // Cards
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 20, overflow: 'hidden', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: Colors.primary, shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  imageWrap: { position: 'relative' },
  image: { width: 95, height: 95, backgroundColor: Colors.borderLight },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: Colors.danger, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  category: {
    fontSize: 10, fontWeight: '800', color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3,
  },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, lineHeight: 19, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 },
  price: { fontSize: 17, fontWeight: '900', color: Colors.primary },
  oldPrice: { fontSize: 12, color: Colors.textMuted, textDecorationLine: 'line-through' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFBEB', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.star },
  stockPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11, fontWeight: '600' },

  removeBtn: {
    padding: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },

  // States
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  stateIconCircle: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  stateTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  stateSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 4 },
  stateBtn: { marginTop: 20 },
});
