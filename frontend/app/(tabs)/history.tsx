import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus, ordersApi } from '../../services/api';
import { ORDER_STATUS_LABELS, formatDate, formatMoney } from '../../utils/format';

const STATUS_COLORS: Record<OrderStatus, string[]> = {
  preparing: ['#F59E0B', '#D97706'],
  on_the_way: ['#3B82F6', '#2563EB'],
  delivered: ['#10B981', '#059669'],
};

const STATUS_ICONS: Record<OrderStatus, React.ComponentProps<typeof Ionicons>['name']> = {
  preparing: 'cube-outline',
  on_the_way: 'bicycle-outline',
  delivered: 'checkmark-done',
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setOrders(await ordersApi.getOrders());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  if (!user) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={Gradients.primary} style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
        <Text style={styles.emptySubtitle}>Inicia sesión para ver tu historial</Text>
        <Button title="Iniciar sesión" onPress={() => router.push('/auth/login')} style={styles.btn} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            activeOpacity={0.88}
            onPress={() => router.push(`/order/${item.id}` as never)}
          >
            {/* Header de la tarjeta */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <LinearGradient
                colors={STATUS_COLORS[item.status]}
                style={styles.statusBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name={STATUS_ICONS[item.status]} size={12} color="#fff" />
                <Text style={styles.statusText}>{ORDER_STATUS_LABELS[item.status]}</Text>
              </LinearGradient>
            </View>

            {/* Miniaturas de productos */}
            <View style={styles.itemsPreview}>
              {item.items.slice(0, 4).map((oi, idx) => (
                <Image key={idx} source={{ uri: oi.image }} style={styles.thumbImage} resizeMode="cover" />
              ))}
              {item.items.length > 4 && (
                <View style={styles.moreItems}>
                  <Text style={styles.moreItemsText}>+{item.items.length - 4}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.orderFooter}>
              <Text style={styles.itemCount}>
                {item.items.reduce((s, i) => s + i.quantity, 0)} productos
              </Text>
              <View style={styles.totalWrap}>
                <Text style={styles.orderTotal}>{formatMoney(item.total)}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <LinearGradient colors={Gradients.primary} style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={styles.emptySubtitle}>Tu historial de compras aparecerá aquí</Text>
            <Button title="Comenzar a comprar" onPress={() => router.push('/(tabs)')} style={styles.btn} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  btn: { marginTop: 20, paddingHorizontal: 40 },
  list: { padding: 16, gap: 14 },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  orderId: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  orderDate: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  itemsPreview: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  thumbImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: Colors.borderLight },
  moreItems: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  moreItemsText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  totalWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderTotal: { fontSize: 18, fontWeight: '800', color: Colors.primary },
});
