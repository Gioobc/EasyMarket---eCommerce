import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { ProductCarousel } from '../../components/ProductCarousel';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Product, productsApi, SortOption } from '../../services/api';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevancia', value: '' },
  { label: 'Precio ↑', value: 'price_asc' },
  { label: 'Precio ↓', value: 'price_desc' },
  { label: '⭐ Calificación', value: 'rating' },
];

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Todos' },
  { label: '< S/30', max: 30 },
  { label: 'S/30–80', min: 30, max: 80 },
  { label: '> S/80', min: 80 },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { token, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('');
  const [priceIndex, setPriceIndex] = useState(0);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb ? 3 : 1;
  const listMaxWidth = isWeb ? Math.min(width - 24, 1320) : width;

  const fetchProducts = useCallback(async () => {
    try {
      setError('');
      const range = PRICE_RANGES[priceIndex];
      const [prods, cats, offs] = await Promise.all([
        productsApi.getAll({
          category: selectedCategory || undefined,
          search: search || undefined,
          sort: sort || undefined,
          minPrice: range.min,
          maxPrice: range.max,
        }),
        productsApi.getCategories(),
        productsApi.getOffers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setOffers(offs);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, search, sort, priceIndex]);

  const fetchRecommendations = useCallback(async () => {
    if (!token) { setRecommendations([]); return; }
    try {
      setRecommendations(await productsApi.getRecommendations(8));
    } catch {
      setRecommendations([]);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fadeAnim.setValue(0);
    fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    useCallback(() => { fetchRecommendations(); }, [fetchRecommendations])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    fetchRecommendations();
  };

  const ListHeader = (
    <View>
      {/* Saludo */}
      {user && (
        <LinearGradient colors={Gradients.primary} style={styles.greetingBanner}>
          <Text style={styles.greetingText}>Hola, {user.name.split(' ')[0]} 👋</Text>
          <Text style={styles.greetingSub}>¿Qué quieres comprar hoy?</Text>
        </LinearGradient>
      )}

      <ProductCarousel title="Ofertas destacadas" emoji="🔥" products={offers} />

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categorías</Text>
        <ChipScroll isWeb={isWeb}>
          <Chip label="Todas" active={selectedCategory === ''} onPress={() => setSelectedCategory('')} />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
            />
          ))}
        </ChipScroll>

        <Text style={styles.filterTitle}>Precio</Text>
        <ChipScroll isWeb={isWeb}>
          {PRICE_RANGES.map((r, idx) => (
            <Chip key={r.label} label={r.label} active={priceIndex === idx} onPress={() => setPriceIndex(idx)} />
          ))}
        </ChipScroll>

        <Text style={styles.filterTitle}>Ordenar por</Text>
        <ChipScroll isWeb={isWeb}>
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              variant="sort"
              active={sort === opt.value}
              onPress={() => setSort(opt.value)}
            />
          ))}
        </ChipScroll>
      </View>

      {recommendations.length > 0 && (
        <ProductCarousel title="Recomendado para ti" emoji="✨" products={recommendations} />
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {products.length > 0 && (
        <Text style={styles.sectionTitle}>
          {selectedCategory || search ? `${products.length} resultados` : 'Todos los productos'}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          key={`products-${numColumns}`}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : undefined}>
              <ProductCard product={item} compact={numColumns > 1} />
            </View>
          )}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
          contentContainerStyle={[styles.list, { maxWidth: listMaxWidth }]}
          style={styles.listWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Intenta con otra búsqueda o categoría</Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const Chip = ({
  label, active, onPress, variant = 'category',
}: {
  label: string; active: boolean; onPress: () => void; variant?: 'category' | 'sort';
}) => (
  <TouchableOpacity
    style={[
      variant === 'sort' ? styles.sortChip : styles.chip,
      active && (variant === 'sort' ? styles.sortChipActive : styles.chipActive),
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text
      style={[
        variant === 'sort' ? styles.sortChipText : styles.chipText,
        active && styles.chipTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ChipScroll = ({ children, isWeb }: { children: React.ReactNode; isWeb: boolean }) =>
  isWeb ? (
    <View style={styles.wrapRow}>{children}</View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
      {children}
    </ScrollView>
  );

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15 },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  greetingBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 18,
  },
  greetingText: { color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  greetingSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3 },
  filtersContainer: { marginHorizontal: 16, marginBottom: 8, gap: 8 },
  filterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScrollContent: { paddingVertical: 3, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sortChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  sortChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  list: { width: '100%', alignSelf: 'center', padding: 16, paddingTop: 4 },
  listWrapper: { flex: 1 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1, minWidth: 0 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: { color: Colors.danger, fontSize: 14, flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 14 },
  emptyText: { marginTop: 6, color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
});
