import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Product } from '../services/api';
import { formatMoney } from '../utils/format';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  emoji?: string;
}

const CarouselItem: React.FC<{ item: Product }> = ({ item }) => {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const hasDiscount = item.discount > 0;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.slide}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
        }
        onPress={() => router.push(`/product/${item.id}` as never)}
      >
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        {hasDiscount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{item.discount}%</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.gradient}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, hasDiscount && styles.priceDiscount]}>
              {formatMoney(item.finalPrice)}
            </Text>
            {hasDiscount && <Text style={styles.oldPrice}>{formatMoney(item.price)}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, products, emoji }) => {
  if (products.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>
        {emoji ? `${emoji} ` : ''}{title}
      </Text>
      <FlatList
        data={products}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <CarouselItem item={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  slide: {
    width: 190,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    backgroundColor: Colors.borderLight,
  },
  image: { width: '100%', height: 150 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  name: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 15, fontWeight: '800', color: '#fff' },
  priceDiscount: { color: '#FCA5A5' },
  oldPrice: { fontSize: 12, color: 'rgba(255,255,255,0.65)', textDecorationLine: 'line-through' },
});
