import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Gradients } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { Product, wishlistApi } from '../services/api';
import { formatMoney } from '../utils/format';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const scale = useRef(new Animated.Value(1)).current;
  const hasDiscount = product.discount > 0;
  const lowStock = product.stock > 0 && product.stock < 5;

  const [wished, setWished] = useState<boolean>(
    Array.isArray(user?.wishlist) && user.wishlist.includes(product.id)
  );
  const [togglingWish, setTogglingWish] = useState(false);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const handleWish = async (e: { stopPropagation?: () => void }) => {
    if (e.stopPropagation) e.stopPropagation();
    if (!user) { router.push('/auth/login'); return; }
    try {
      setTogglingWish(true);
      if (wished) {
        await wishlistApi.remove(product.id);
        setWished(false);
      } else {
        await wishlistApi.add(product.id);
        setWished(true);
      }
    } catch {
      // fail silently
    } finally {
      setTogglingWish(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/product/${product.id}` as never)}
      >
        <View>
          <Image
            source={{ uri: product.image }}
            style={[styles.image, compact && styles.imageCompact]}
            resizeMode="cover"
          />

          {hasDiscount && (
            <LinearGradient colors={Gradients.accent} style={styles.discountBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </LinearGradient>
          )}

          {product.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Agotado</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.heartBtn, wished && styles.heartBtnActive]}
            onPress={handleWish}
            disabled={togglingWish}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons
              name={wished ? 'heart' : 'heart-outline'}
              size={18}
              color={wished ? Colors.danger : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.info, compact && styles.infoCompact]}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
            {product.name}
          </Text>

          {lowStock && (
            <View style={styles.lowStockRow}>
              <View style={styles.lowStockDot} />
              <Text style={styles.lowStockText}>¡Últimas {product.stock}!</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, compact && styles.priceCompact]}>
                {formatMoney(product.finalPrice)}
              </Text>
              {hasDiscount && <Text style={styles.oldPrice}>{formatMoney(product.price)}</Text>}
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color={Colors.star} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0A7251',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardCompact: { marginBottom: 12 },
  image: { width: '100%', height: 185, backgroundColor: Colors.borderLight },
  imageCompact: { height: 140 },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(5,46,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  heartBtnActive: {
    backgroundColor: '#FFF0F0',
  },
  info: { padding: 14 },
  infoCompact: { padding: 10 },
  category: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 21,
  },
  nameCompact: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  lowStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
  lowStockText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '700',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceWrap: {},
  price: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  priceCompact: { fontSize: 15 },
  oldPrice: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: { fontSize: 12, color: Colors.accent, fontWeight: '800' },
});
