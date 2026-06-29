import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Gradients } from '../constants/Colors';
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
          <LinearGradient colors={Gradients.accent} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.badgeText}>-{item.discount}%</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={Gradients.card}
          style={styles.gradient}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(item.finalPrice)}</Text>
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
      <View style={styles.titleRow}>
        <View style={styles.accentBar} />
        <Text style={styles.title}>
          {emoji ? `${emoji} ` : ''}{title}
        </Text>
      </View>
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
  wrapper: { marginBottom: 20 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  slide: {
    width: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0A7251',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
    backgroundColor: Colors.borderLight,
  },
  image: { width: '100%', height: 160 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 16, fontWeight: '900', color: '#fff' },
  oldPrice: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
  },
});
