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
import { Product, productsApi, recommendationsApi, SortOption } from '../../services/api';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevancia', value: '' },
  { label: 'Precio ↑', value: 'price_asc' },
  { label: 'Precio ↓', value: 'price_desc' },
  { label: 'Mejor rating', value: 'rating' },
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
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
      setRecommendations(await recommendationsApi.get());
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
      {/* Hero greeting */}
      {user && (
        <LinearGradient colors={Gradients.hero} style={styles.greetingBanner}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingLabel}>BIENVENIDO</Text>
            <Text style={styles.greetingText}>{user.name.split(' ')[0]}</Text>
            <Text style={styles.greetingSub}>¿Qué buscas hoy?</Text>
          </View>
          <View style={styles.greetingIcon}>
            <Ionicons name="storefront" size={36} color="rgba(52,211,153,0.9)" />
          </View>
        </LinearGradient>
      )}

      <ProductCarousel title="Ofertas del día" emoji="🔥" products={offers} />

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

        <Text style={styles.filterTitle}>Rango de precio</Text>
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

      {token && recommendations.length > 0 && (
        <ProductCarousel title="Para ti" emoji="✨" products={recommendations} />
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {products.length > 0 && (
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory || search
              ? `${products.length} resultado${products.length !== 1 ? 's' : ''}`
              : 'Todos los productos'}
          </Text>
          {(selectedCategory || search) && (
            <TouchableOpacity onPress={() => { setSelectedCategory(''); setSearch(''); }}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Ionicons name="storefront" size={32} color={Colors.primary} />
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={17} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en EasyMarket..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={styles.searchDivider} />
          )}
          <Ionicons name="options-outline" size={19} color={Colors.primary} style={{ marginLeft: 8 }} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="leaf-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>Prueba con otro término o explora las categorías</Text>
              {(search || selectedCategory) && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => { setSearch(''); setSelectedCategory(''); }}>
                  <Text style={styles.clearBtnText}>Ver todos los productos</Text>
                </TouchableOpacity>
              )}
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
    activeOpacity={0.75}
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
  loadingIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { marginTop: 10, color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  searchWrapper: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.primaryDark,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchDivider: { width: 1, height: 18, backgroundColor: Colors.border, marginHorizontal: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, height: '100%' },
  greetingBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingLeft: { flex: 1 },
  greetingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.tabBarActive,
    letterSpacing: 2,
    marginBottom: 2,
  },
  greetingText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  greetingSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  greetingIcon: {
    width: 64, height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(52,211,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: { marginHorizontal: 16, marginBottom: 4, gap: 6 },
  filterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScrollContent: { paddingVertical: 4, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  sortChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.2 },
  clearText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  list: { width: '100%', alignSelf: 'center', padding: 16, paddingTop: 4 },
  listWrapper: { flex: 1 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1, minWidth: 0 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  errorText: { color: Colors.danger, fontSize: 14, flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { marginTop: 6, color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  clearBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  clearBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
