import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { StarRating } from '../../components/StarRating';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_SOCKET_BASE, Product, ProductReview, productsApi, reviewsApi, wishlistApi } from '../../services/api';
import { formatDate, formatMoney } from '../../utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wished, setWished] = useState<boolean>(
    Array.isArray(user?.wishlist) && user.wishlist.includes(id)
  );
  const [togglingWish, setTogglingWish] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const liveAnim = useRef(new Animated.Value(1)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;

  // Pulsing live dot
  useEffect(() => {
    if (!socketConnected) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(liveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [socketConnected]);

  const handleWish = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      setTogglingWish(true);
      if (wished) { await wishlistApi.remove(id); setWished(false); }
      else { await wishlistApi.add(id); setWished(true); }
    } catch { /* fail silently */ } finally { setTogglingWish(false); }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    productsApi.getById(id)
      .then((p) => active && setProduct(p))
      .catch(() => active && setProduct(null))
      .finally(() => active && setLoading(false));
    reviewsApi.forProduct(id)
      .then((r) => active && setReviews(r))
      .catch(() => active && setReviews([]));
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const socket = io(API_SOCKET_BASE, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.emit('join_product', id);
    socket.on('stock_updated', ({ productId, stock }: { productId: string; stock: number }) => {
      if (productId === id) setProduct((prev) => prev ? { ...prev, stock } : prev);
    });
    return () => {
      socket.emit('leave_product', id);
      socket.disconnect();
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Para agregar productos al carrito necesitas una cuenta.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    if (!product) return;
    Animated.sequence([
      Animated.spring(addBtnScale, { toValue: 0.94, useNativeDriver: true, speed: 50 }),
      Animated.spring(addBtnScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    try {
      setAddingToCart(true);
      await addItem(product.id, qty);
      Alert.alert('Agregado al carrito', `${product.name} ×${qty}`, [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ver carrito', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={Gradients.primaryDark} style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.errorTitle}>Producto no encontrado</Text>
        <TouchableOpacity style={styles.backBtn2} onPress={() => router.back()}>
          <Text style={styles.backBtn2Text}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDiscount = product.discount > 0;
  const savingAmount = hasDiscount ? product.price - product.finalPrice : 0;
  const subtotalAmt = product.finalPrice * qty;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={Gradients.card} style={styles.imageGradient} />

          {/* Back */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnRight]}
            onPress={handleWish}
            disabled={togglingWish}
          >
            <Ionicons
              name={wished ? 'heart' : 'heart-outline'}
              size={22}
              color={wished ? Colors.danger : Colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Discount badge */}
          {hasDiscount && (
            <LinearGradient colors={Gradients.accent} style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{product.discount}%</Text>
            </LinearGradient>
          )}

          {/* Live badge */}
          {socketConnected && (
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { opacity: liveAnim }]} />
              <Text style={styles.liveText}>En vivo</Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>AGOTADO</Text>
            </View>
          )}
        </View>

        {/* Content card */}
        <View style={styles.contentCard}>
          {/* Category + Rating */}
          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{product.category.toUpperCase()}</Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={13} color={Colors.star} />
              <Text style={styles.ratingText}>
                {product.rating.toFixed(1)}
                {product.ratingCount ? ` · ${product.ratingCount}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.finalPrice)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.oldPrice}>{formatMoney(product.price)}</Text>
                <View style={styles.savingPill}>
                  <Ionicons name="trending-down" size={12} color={Colors.accent} />
                  <Text style={styles.savingText}>Ahorras {formatMoney(savingAmount)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Stock */}
          <View style={[
            styles.stockPill,
            { backgroundColor: product.stock > 0 ? Colors.secondaryLight : Colors.dangerLight },
          ]}>
            <Ionicons
              name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
              size={15}
              color={product.stock > 0 ? Colors.secondary : Colors.danger}
            />
            <Text style={[styles.stockText, { color: product.stock > 0 ? Colors.secondary : Colors.danger }]}>
              {product.stock > 0 ? `En stock · ${product.stock} disponibles` : 'Sin stock'}
            </Text>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Quantity */}
          {product.stock > 0 && (
            <View style={styles.qtySection}>
              <Text style={styles.qtyLabel}>Cantidad</Text>
              <View style={styles.qtyPill}>
                <TouchableOpacity
                  style={[styles.qtyCircle, qty <= 1 && styles.qtyCircleDisabled]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Ionicons name="remove" size={18} color={qty <= 1 ? Colors.textMuted : Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyCircle, qty >= product.stock && styles.qtyCircleDisabled]}
                  onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                >
                  <Ionicons name="add" size={18} color={qty >= product.stock ? Colors.textMuted : Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsTitle}>Reseñas de clientes</Text>
              {reviews.slice(0, 5).map((r, idx) => (
                <View key={idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <StarRating value={r.rating} size={13} readonly />
                    <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.footerLabel}>{qty > 1 ? `${qty} unidades` : 'Total'}</Text>
            <Text style={styles.footerAmount}>{formatMoney(subtotalAmt)}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: addBtnScale }], flex: 1, marginLeft: 16 }}>
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={product.stock === 0 ? ['#9CA3AF', '#9CA3AF'] : Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtn}
              >
                {addingToCart ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>
                      {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 32 },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15 },
  errorIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  backBtn2: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  backBtn2Text: { color: '#fff', fontWeight: '700', fontSize: 15 },

  imageWrap: { height: 300, backgroundColor: Colors.borderLight, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },

  headerBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  headerBtnRight: { left: undefined, right: 16 },

  discountBadge: {
    position: 'absolute', bottom: 50, right: 16,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  discountBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  liveBadge: {
    position: 'absolute', bottom: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.secondary },
  liveText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  outOfStockOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },

  contentCard: {
    backgroundColor: Colors.surface,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    minHeight: 400,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryPill: {
    backgroundColor: Colors.accentLight,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText: { fontSize: 11, fontWeight: '800', color: Colors.accent, letterSpacing: 0.8 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: Colors.star },

  name: {
    fontSize: 22, fontWeight: '900', color: Colors.textPrimary,
    lineHeight: 29, marginBottom: 16, letterSpacing: -0.5,
  },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  price: { fontSize: 30, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  oldPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through', marginBottom: 4 },
  savingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accentLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 3,
  },
  savingText: { fontSize: 12, color: Colors.accent, fontWeight: '700' },

  stockPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 20, alignSelf: 'flex-start',
  },
  stockText: { fontSize: 13, fontWeight: '600' },

  descSection: { marginBottom: 22 },
  descLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 1.2, marginBottom: 8,
  },
  descText: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

  qtySection: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  qtyLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  qtyPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceTinted,
    borderRadius: 50, paddingHorizontal: 6, paddingVertical: 4, gap: 4,
  },
  qtyCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyCircleDisabled: { borderColor: Colors.border, backgroundColor: Colors.borderLight },
  qtyNum: {
    fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
    minWidth: 32, textAlign: 'center',
  },

  reviewsSection: { marginTop: 4, marginBottom: 12 },
  reviewsTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 14, letterSpacing: -0.2,
  },
  reviewCard: {
    backgroundColor: Colors.surfaceTinted,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  reviewDate: { fontSize: 11, color: Colors.textMuted },
  reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.primaryDark, shadowOpacity: 0.1,
    shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  footerInner: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  footerAmount: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 18, paddingVertical: 16,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
