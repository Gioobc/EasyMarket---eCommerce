import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      activeOpacity={0.85}
      onPress={() => router.push(`/product/${product.id}` as never)}
    >
      <Image source={{ uri: product.image }} style={[styles.image, compact && styles.imageCompact]} resizeMode="cover" />
      <View style={[styles.info, compact && styles.infoCompact]}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <Text style={[styles.price, compact && styles.priceCompact]}>${product.price.toFixed(2)}</Text>
          <View style={styles.rating}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardCompact: {
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
  },
  imageCompact: {
    height: 120,
  },
  info: {
    padding: 12,
  },
  infoCompact: {
    padding: 10,
  },
  category: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  nameCompact: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceCompact: {
    fontSize: 15,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: Colors.star,
    fontSize: 14,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
