import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { StarRating } from '../../components/StarRating';
import { Colors, Gradients } from '../../constants/Colors';
import { Order, OrderStatus, ordersApi, reviewsApi } from '../../services/api';
import {
  DELIVERY_LABELS, ORDER_STATUS_LABELS, PAYMENT_LABELS,
  formatDateTime, formatMoney,
} from '../../utils/format';

const STATUS_FLOW: OrderStatus[] = ['preparing', 'on_the_way', 'delivered'];

const STATUS_ICONS: Record<OrderStatus, React.ComponentProps<typeof Ionicons>['name']> = {
  preparing: 'cube-outline',
  on_the_way: 'bicycle-outline',
  delivered: 'checkmark-done',
};

const STATUS_COLORS: Record<OrderStatus, string[]> = {
  preparing: ['#F59E0B', '#D97706'],
  on_the_way: ['#3B82F6', '#2563EB'],
  delivered: ['#10B981', '#059669'],
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [appRating, setAppRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadOrder = () => {
    ordersApi.getOrder(id)
      .then((o) => {
        setOrder(o);
        const init: Record<string, number> = {};
        o.items.forEach((it) => (init[it.productId] = 5));
        setProductRatings(init);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrder, [id]);

  const handleDownload = async () => {
    try { setDownloading(true); await ordersApi.downloadReceipt(id); }
    catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo generar la boleta'); }
    finally { setDownloading(false); }
  };

  const handleAdvance = async () => {
    if (!order) return;
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
    if (!next) return;
    try {
      setAdvancing(true);
      setOrder(await ordersApi.updateStatus(id, next));
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setAdvancing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!order) return;
    try {
      setSubmittingReview(true);
      await reviewsApi.create({
        orderId: order.id, appRating, deliveryRating,
        comment: comment.trim() || undefined,
        products: order.items.map((it) => ({ productId: it.productId, rating: productRatings[it.productId] ?? 5 })),
      });
      Alert.alert('¡Gracias!', 'Tu valoración fue registrada.');
      loadOrder();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="receipt-outline" size={60} color={Colors.border} />
        <Text style={styles.errorText}>Pedido no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header de estado */}
      <LinearGradient colors={STATUS_COLORS[order.status]} style={styles.statusHeader}>
        <Text style={styles.statusHeaderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={styles.statusHeaderIcon}>
          <Ionicons name={STATUS_ICONS[order.status]} size={36} color="#fff" />
        </View>
        <Text style={styles.statusHeaderLabel}>{ORDER_STATUS_LABELS[order.status]}</Text>
        <Text style={styles.statusHeaderDate}>{formatDateTime(order.createdAt)}</Text>
      </LinearGradient>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seguimiento del pedido</Text>
        <View style={styles.timeline}>
          {STATUS_FLOW.map((s, idx) => {
            const reached = idx <= currentIndex;
            return (
              <View key={s} style={styles.timelineStep}>
                {idx < STATUS_FLOW.length - 1 && (
                  <View style={[styles.timelineLine, idx < currentIndex && styles.timelineLineActive]} />
                )}
                <LinearGradient
                  colors={reached ? STATUS_COLORS[s] : ['#E5E7EB', '#E5E7EB']}
                  style={styles.timelineDot}
                >
                  <Ionicons name={STATUS_ICONS[s]} size={16} color={reached ? '#fff' : Colors.textMuted} />
                </LinearGradient>
                <Text style={[styles.timelineLabel, reached && styles.timelineLabelActive]}>
                  {ORDER_STATUS_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>

        {order.status !== 'delivered' && (
          <Button
            title="Simular avance de estado"
            variant="outline"
            onPress={handleAdvance}
            loading={advancing}
            size="sm"
            style={{ marginTop: 12 }}
          />
        )}
      </View>

      {/* Resumen del pedido */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detalles del pedido</Text>
        <SummaryRow label="Pago" value={PAYMENT_LABELS[order.paymentMethod]} />
        <SummaryRow label="Entrega" value={DELIVERY_LABELS[order.deliveryType]} />
        {order.deliveryType === 'pickup' && order.pickupCenter && (
          <SummaryRow label="Tienda" value={order.pickupCenter} />
        )}
        {order.deliveryType === 'delivery' && order.shippingAddress && (
          <SummaryRow label="Dirección" value={order.shippingAddress} />
        )}
        <Button
          title={downloading ? 'Generando boleta...' : 'Descargar boleta PDF'}
          variant="ghost"
          onPress={handleDownload}
          loading={downloading}
          size="sm"
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Productos */}
      <Text style={styles.listTitle}>Productos del pedido</Text>
      {order.items.map((item, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemPrice}>{formatMoney(item.finalPrice)} × {item.quantity}</Text>
          </View>
          <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
        </View>
      ))}

      {/* Totales */}
      <View style={styles.card}>
        <TotalsRow label="Subtotal" value={formatMoney(order.subtotal)} />
        {order.productDiscount > 0 && (
          <TotalsRow label="Descuento productos" value={`−${formatMoney(order.productDiscount)}`} accent />
        )}
        {order.couponDiscount > 0 && (
          <TotalsRow label={`Cupón ${order.couponCode ?? ''}`} value={`−${formatMoney(order.couponDiscount)}`} accent />
        )}
        <TotalsRow label="Envío" value={order.shipping > 0 ? formatMoney(order.shipping) : 'Gratis'} />
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total pagado</Text>
          <Text style={styles.totalAmount}>{formatMoney(order.total)}</Text>
        </View>
      </View>

      {/* Valoración */}
      {order.status === 'delivered' && !order.rated && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>¿Cómo fue tu experiencia?</Text>

          <Text style={styles.ratingLabel}>Servicio / App</Text>
          <StarRating value={appRating} onChange={setAppRating} />

          <Text style={styles.ratingLabel}>Entrega</Text>
          <StarRating value={deliveryRating} onChange={setDeliveryRating} />

          <Text style={styles.ratingLabel}>Productos</Text>
          {order.items.map((it) => (
            <View key={it.productId} style={styles.productRatingRow}>
              <Text style={styles.productRatingName} numberOfLines={1}>{it.name}</Text>
              <StarRating
                value={productRatings[it.productId] ?? 5}
                onChange={(v) => setProductRatings((prev) => ({ ...prev, [it.productId]: v }))}
                size={22}
              />
            </View>
          ))}

          <TextInput
            style={styles.commentInput}
            placeholder="Comentario adicional (opcional)"
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <Button
            title="Enviar valoración"
            onPress={handleSubmitReview}
            loading={submittingReview}
            fullWidth
            style={{ marginTop: 14 }}
          />
        </View>
      )}

      {order.rated && (
        <View style={styles.ratedBanner}>
          <LinearGradient colors={Gradients.success} style={styles.ratedIcon}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.ratedText}>¡Gracias por tu valoración!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const TotalsRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, accent && { color: Colors.secondary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { gap: 14, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 18, color: Colors.textSecondary, marginTop: 12 },
  statusHeader: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, gap: 8,
  },
  statusHeaderId: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  statusHeaderIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  statusHeaderLabel: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  statusHeaderDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16, letterSpacing: -0.2 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  timelineStep: { flex: 1, alignItems: 'center', position: 'relative' },
  timelineLine: {
    position: 'absolute', top: 20, left: '60%', right: '-40%',
    height: 3, backgroundColor: Colors.border, zIndex: 0, borderRadius: 2,
  },
  timelineLineActive: { backgroundColor: Colors.secondary },
  timelineDot: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  timelineLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 7, textAlign: 'center', fontWeight: '500' },
  timelineLabelActive: { color: Colors.textPrimary, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  summaryLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  summaryValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  listTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginHorizontal: 16, marginTop: 2, letterSpacing: -0.2 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 14, marginHorizontal: 16, gap: 12,
  },
  itemImage: { width: 58, height: 58, borderRadius: 10, backgroundColor: Colors.borderLight },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 5 },
  itemPrice: { fontSize: 13, color: Colors.textSecondary },
  itemSubtotal: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  totalDivider: { height: 1.5, backgroundColor: Colors.borderLight, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalAmount: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 12, marginBottom: 8 },
  productRatingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, gap: 12,
  },
  productRatingName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  commentInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top', marginTop: 14,
  },
  ratedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16, marginHorizontal: 16,
  },
  ratedIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ratedText: { color: Colors.secondary, fontWeight: '700', fontSize: 14 },
});
