import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors } from '../../constants/Colors';
import { Product, productsApi } from '../../services/api';

const SORT_OPTIONS = [
  { label: 'Por defecto', value: '' },
  { label: 'Precio ↑', value: 'price_asc' },
  { label: 'Precio ↓', value: 'price_desc' },
  { label: 'Calificación', value: 'rating' },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('');
  const [error, setError] = useState('');

  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb ? 3 : 1;
  const listMaxWidth = isWeb ? Math.min(width - 24, 1320) : width;

  const fetchProducts = useCallback(async () => {
    try {
      setError('');
      const [prods, cats] = await Promise.all([
        productsApi.getAll({
          category: selectedCategory || undefined,
          search: search || undefined,
          sort: sort || undefined,
        }),
        productsApi.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, search, sort]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

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
      {/* Search bar */}
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

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categorías</Text>
        {isWeb ? (
          <View style={styles.wrapRow}>
            <TouchableOpacity
              style={[styles.chip, selectedCategory === '' && styles.chipActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.chipText, selectedCategory === '' && styles.chipTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            <TouchableOpacity
              style={[styles.chip, selectedCategory === '' && styles.chipActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.chipText, selectedCategory === '' && styles.chipTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.filterTitle}>Ordenar por</Text>
        {isWeb ? (
          <View style={styles.wrapRow}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
                onPress={() => setSort(opt.value)}
              >
                <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}
            contentContainerStyle={styles.sortContent}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
                onPress={() => setSort(opt.value)}
              >
                <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        key={`products-${numColumns}`}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.gridItem : undefined}>
            <ProductCard product={item} compact={numColumns > 1} />
          </View>
        )}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={[styles.list, { maxWidth: listMaxWidth }]}
        style={styles.listWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="search" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No se encontraron productos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    gap: 8,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryScroll: {
    marginBottom: 2,
  },
  categoryContent: {
    paddingVertical: 2,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  sortScroll: {
    marginVertical: 2,
  },
  sortContent: {
    paddingVertical: 2,
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  sortChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  list: {
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    paddingTop: 4,
  },
  listWrapper: {
    flex: 1,
  },
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 16,
  },
});
