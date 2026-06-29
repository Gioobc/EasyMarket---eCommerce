import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { PaymentGateway } from '../../components/PaymentGateway';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  AddPaymentMethodPayload,
  CouponValidation,
  DeliveryType,
  PaymentMethod,
  PaymentMethodSaved,
  PickupCenter,
  authApi,
  configApi,
  couponsApi,
  ordersApi,
  pointsApi,
} from '../../services/api';
import { formatMoney } from '../../utils/format';

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ icon, label, children }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconCircle}>
          <Ionicons name={icon} size={15} color="#fff" />
        </View>
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function SegmentBtn({ icon, label, active, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {active ? (
        <LinearGradient colors={Gradients.primary} style={styles.segmentGrad}>
          <Ionicons name={icon} size={16} color="#fff" />
          <Text style={[styles.segmentText, { color: '#fff' }]}>{label}</Text>
        </LinearGradient>
      ) : (
        <>
          <Ionicons name={icon} size={16} color={Colors.textMuted} />
          <Text style={styles.segmentText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function BreakdownRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, green && { color: Colors.secondary }]}>{value}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function CartScreen() {
  const { cart, loading, updateItem, removeItem, refreshCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [address, setAddress] = useState(user?.address ?? '');
  const [pickupCenters, setPickupCenters] = useState<PickupCenter[]>([]);
  const [pickupCenter, setPickupCenter] = useState<PickupCenter | null>(null);
  const [locating, setLocating] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethodSaved[]>([]);
  const [showGateway, setShowGateway] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsInput, setPointsInput] = useState('');
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [redeemingPoints, setRedeemingPoints] = useState(false);

  useEffect(() => {
    configApi.getPickupCenters().then((centers) => {
      setPickupCenters(centers);
      if (centers.length > 0 && !pickupCenter) setPickupCenter(centers[0]);
    }).catch(() => {});
    if (user) {
      authApi.getPaymentMethods().then(setSavedCards).catch(() => {});
      pointsApi.get().then((res) => setAvailablePoints(res.points)).catch(() => {});
    }
  }, [user]);

  const handleFindNearest = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Activa el permiso de ubicación para encontrar la tienda más cercana.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const nearest = pickupCenters.reduce((best, c) => {
        const d = Math.hypot(c.lat - latitude, c.lng - longitude);
        const bd = Math.hypot(best.lat - latitude, best.lng - longitude);
        return d < bd ? c : best;
      });
      setPickupCenter(nearest);
      Alert.alert('Tienda más cercana', `${nearest.name}\n${nearest.address}`);
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const totals = useMemo(() => {
    const { subtotal, productDiscount, shipping: ds } = cart.totals;
    const couponDiscount = coupon?.discount ?? 0;
    const shipping = deliveryType === 'pickup' || coupon?.type === 'shipping' ? 0 : ds;
    const total = Math.max(0, subtotal - couponDiscount - pointsDiscount) + shipping;
    return { subtotal, productDiscount, couponDiscount, pointsDiscount, shipping, total };
  }, [cart.totals, coupon, deliveryType, pointsDiscount]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      setValidatingCoupon(true); setCouponError('');
      setCoupon(await couponsApi.validate(couponInput.trim(), cart.totals.subtotal));
    } catch (e: unknown) {
      setCoupon(null);
      setCouponError(e instanceof Error ? e.message : 'Cupón inválido');
    } finally { setValidatingCoupon(false); }
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(''); setCouponError(''); };

  const handleRedeemPoints = async () => {
    const pts = Number(pointsInput);
    if (!pts || pts < 100) { Alert.alert('Mínimo 100 puntos', 'Debes canjear al menos 100 puntos.'); return; }
    if (pts > availablePoints) { Alert.alert('Puntos insuficientes', `Solo tienes ${availablePoints} puntos.`); return; }
    try {
      setRedeemingPoints(true);
      const res = await pointsApi.redeem(pts);
      setPointsDiscount(res.discount);
      setAvailablePoints(res.remainingPoints);
      setPointsInput('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo canjear');
    } finally { setRedeemingPoints(false); }
  };

  const removePointsDiscount = () => {
    setPointsDiscount(0);
    setAvailablePoints((p) => p + Math.round(pointsDiscount * 100));
  };

  const doCheckout = async () => {
    const order = await ordersApi.checkout({
      paymentMethod, deliveryType,
      shippingAddress: deliveryType === 'delivery' ? address.trim() : undefined,
      pickupCenter: deliveryType === 'pickup' ? pickupCenter?.name : undefined,
      couponCode: coupon?.code,
    });
    await refreshCart(); removeCoupon();
    return order;
  };

  const handlePay = async () => {
    if (deliveryType === 'delivery' && !address.trim()) {
      Alert.alert('Falta la dirección', 'Ingresa una dirección de envío para continuar.'); return;
    }
    if (paymentMethod === 'card') { setShowGateway(true); return; }
    try {
      setCheckingOut(true);
      const order = await doCheckout();
      Alert.alert('¡Pedido realizado!', 'Tu pedido fue confirmado.', [
        { text: 'Ver pedido', onPress: () => router.push(`/order/${order.id}` as never) },
        { text: 'Seguir comprando', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar el pedido');
    } finally { setCheckingOut(false); }
  };

  const handleGatewaySuccess = async (cardData: AddPaymentMethodPayload | null) => {
    setShowGateway(false);
    try {
      setCheckingOut(true);
      if (cardData) {
        authApi.addPaymentMethod(cardData)
          .then((m) => setSavedCards((prev) => [...prev, m]))
          .catch(() => {});
      }
      const order = await doCheckout();
      Alert.alert('¡Pedido realizado!', 'Tu pedido fue confirmado.', [
        { text: 'Ver pedido', onPress: () => router.push(`/order/${order.id}` as never) },
        { text: 'Seguir comprando', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar el pedido');
    } finally { setCheckingOut(false); }
  };

  const handleRemoveItem = (productId: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar "${name}"?`)) removeItem(productId);
      return;
    }
    Alert.alert('Eliminar', `¿Quitar "${name}" del carrito?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => removeItem(productId) },
    ]);
  };

  // ── Empty / Guest states ────────────────────────────────────────────────

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={Gradients.hero} style={styles.emptyHero}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={styles.emptyHeroTitle}>Tu carrito te espera</Text>
          <Text style={styles.emptyHeroSub}>Inicia sesión para agregar productos</Text>
        </LinearGradient>
        <View style={styles.emptyCard}>
          <Button title="Iniciar sesión" onPress={() => router.push('/auth/login')} fullWidth />
          <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.emptyLink}>
            <Text style={styles.emptyLinkText}>¿No tienes cuenta? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Regístrate</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.textMuted }}>Cargando carrito...</Text>
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={Gradients.hero} style={styles.emptyHero}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={styles.emptyHeroTitle}>Carrito vacío</Text>
          <Text style={styles.emptyHeroSub}>Agrega productos para comenzar</Text>
        </LinearGradient>
        <View style={styles.emptyCard}>
          <Button title="Explorar productos" onPress={() => router.push('/(tabs)')} fullWidth />
        </View>
      </View>
    );
  }

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <PaymentGateway
        visible={showGateway}
        total={totals.total}
        savedCards={savedCards}
        onSuccess={handleGatewaySuccess}
        onCancel={() => setShowGateway(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Items header */}
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsCount}>{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</Text>
          <Text style={styles.itemsSubtotal}>{formatMoney(totals.subtotal)}</Text>
        </View>

        {/* Cart items */}
        {cart.items.map((item) => (
          <View key={item.productId} style={styles.cartItem}>
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.productId}` as never)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.product.image }} style={styles.itemImage} resizeMode="cover" />
            </TouchableOpacity>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemUnitPrice}>{formatMoney(item.product.finalPrice)} /ud.</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => item.quantity <= 1 ? handleRemoveItem(item.productId, item.product.name) : updateItem(item.productId, item.quantity - 1)}
                >
                  <Ionicons name={item.quantity <= 1 ? 'trash-outline' : 'remove'} size={15} color={item.quantity <= 1 ? Colors.danger : Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItem(item.productId, item.quantity + 1)}>
                  <Ionicons name="add" size={15} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(item.productId, item.product.name)} style={styles.trashBtn}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Coupon */}
        <SectionCard icon="pricetag-outline" label="Cupón de descuento">
          {coupon ? (
            <View style={styles.appliedRow}>
              <View style={styles.appliedIconWrap}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.appliedText}>{coupon.code} — −{formatMoney(coupon.discount)}</Text>
              <TouchableOpacity onPress={removeCoupon}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="CÓDIGO DE CUPÓN"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                value={couponInput}
                onChangeText={setCouponInput}
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon} disabled={validatingCoupon}>
                {validatingCoupon
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.applyBtnText}>Aplicar</Text>}
              </TouchableOpacity>
            </View>
          )}
          {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
        </SectionCard>

        {/* Points */}
        {availablePoints >= 100 && (
          <View style={[styles.section, styles.pointsSection]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: Colors.accent }]}>
                <Ionicons name="trophy-outline" size={15} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Puntos de fidelización</Text>
            </View>
            <View style={styles.pointsBalance}>
              <Text style={styles.pointsNum}>{availablePoints}</Text>
              <Text style={styles.pointsUnit}>puntos · vale {formatMoney(Math.floor(availablePoints / 100))}</Text>
            </View>
            {pointsDiscount > 0 ? (
              <View style={styles.appliedRow}>
                <View style={styles.appliedIconWrap}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.appliedText}>{Math.round(pointsDiscount * 100)} pts — −{formatMoney(pointsDiscount)}</Text>
                <TouchableOpacity onPress={removePointsDiscount}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Puntos a canjear (mín. 100)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  value={pointsInput}
                  onChangeText={setPointsInput}
                />
                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: Colors.accent }]} onPress={handleRedeemPoints} disabled={redeemingPoints}>
                  {redeemingPoints
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.applyBtnText}>Canjear</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Delivery */}
        <SectionCard icon="location-outline" label="Tipo de entrega">
          <View style={styles.segment}>
            <SegmentBtn icon="bicycle-outline" label="Delivery" active={deliveryType === 'delivery'} onPress={() => setDeliveryType('delivery')} />
            <SegmentBtn icon="storefront-outline" label="Recojo en tienda" active={deliveryType === 'pickup'} onPress={() => setDeliveryType('pickup')} />
          </View>
          {deliveryType === 'delivery' ? (
            <TextInput
              style={styles.addressInput}
              placeholder="Dirección de envío completa"
              placeholderTextColor={Colors.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          ) : (
            <View style={styles.pickupList}>
              <TouchableOpacity style={styles.nearestBtn} onPress={handleFindNearest} disabled={locating}>
                <Ionicons name="navigate" size={14} color={Colors.primary} />
                <Text style={styles.nearestBtnText}>
                  {locating ? 'Buscando...' : 'Tienda más cercana'}
                </Text>
              </TouchableOpacity>
              {pickupCenters.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.pickupOption}
                  onPress={() => setPickupCenter(c)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radio, pickupCenter?.name === c.name && styles.radioActive]}>
                    {pickupCenter?.name === c.name && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickupName}>{c.name}</Text>
                    <Text style={styles.pickupAddr}>{c.address}</Text>
                  </View>
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Payment method */}
        <SectionCard icon="card-outline" label="Método de pago">
          <View style={styles.segment}>
            <SegmentBtn icon="card-outline" label="Tarjeta" active={paymentMethod === 'card'} onPress={() => setPaymentMethod('card')} />
            <SegmentBtn icon="cash-outline" label="Contraentrega" active={paymentMethod === 'cash_on_delivery'} onPress={() => setPaymentMethod('cash_on_delivery')} />
          </View>
          {paymentMethod === 'card' && savedCards.length > 0 && (
            <View style={styles.savedHint}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.secondary} />
              <Text style={styles.savedHintText}>
                {savedCards.length} tarjeta{savedCards.length > 1 ? 's' : ''} guardada{savedCards.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del pedido</Text>
          <BreakdownRow label="Subtotal" value={formatMoney(totals.subtotal)} />
          {totals.productDiscount > 0 && <BreakdownRow label="Ahorro" value={`−${formatMoney(totals.productDiscount)}`} green />}
          {totals.couponDiscount > 0 && <BreakdownRow label={`Cupón ${coupon?.code ?? ''}`} value={`−${formatMoney(totals.couponDiscount)}`} green />}
          {totals.pointsDiscount > 0 && <BreakdownRow label="Puntos canjeados" value={`−${formatMoney(totals.pointsDiscount)}`} green />}
          <BreakdownRow label="Envío" value={totals.shipping > 0 ? formatMoney(totals.shipping) : 'Gratis'} green={totals.shipping === 0} />
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalAmount}>{formatMoney(totals.total)}</Text>
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Footer */}
      <LinearGradient colors={Gradients.primaryDark} style={styles.footer}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.footerCount}>{itemCount} artículo{itemCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.footerTotal}>{formatMoney(totals.total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.payBtn, checkingOut && { opacity: 0.7 }]}
            onPress={handlePay}
            disabled={checkingOut}
            activeOpacity={0.85}
          >
            {checkingOut
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <>
                  <Ionicons name={paymentMethod === 'card' ? 'card-outline' : 'checkmark-circle-outline'} size={18} color={Colors.primary} />
                  <Text style={styles.payBtnText}>
                    {paymentMethod === 'card' ? 'Pagar con tarjeta' : 'Confirmar pedido'}
                  </Text>
                </>}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Missing Platform import — add it
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 12, paddingBottom: 12 },

  // Empty states
  emptyContainer: { flex: 1, backgroundColor: Colors.background },
  emptyHero: {
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 40, paddingTop: 80, paddingHorizontal: 32,
    minHeight: 260,
  },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyHeroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptyHeroSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  emptyCard: { margin: 20, padding: 24, backgroundColor: Colors.surface, borderRadius: 24, gap: 12 },
  emptyLink: { alignItems: 'center', paddingTop: 4 },
  emptyLinkText: { fontSize: 14, color: Colors.textMuted },

  // Items header
  itemsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 4,
  },
  itemsCount: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemsSubtotal: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },

  // Cart item
  cartItem: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 14, gap: 12, alignItems: 'flex-start',
    shadowColor: Colors.primaryDark, shadowOpacity: 0.08,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  itemImage: { width: 80, height: 80, borderRadius: 14, backgroundColor: Colors.borderLight },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3, lineHeight: 19 },
  itemUnitPrice: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceTinted,
  },
  qtyText: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, minWidth: 22, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  itemSubtotal: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  trashBtn: { padding: 4 },

  // Sections
  section: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  pointsSection: { borderLeftWidth: 4, borderLeftColor: Colors.accent },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },

  // Points balance
  pointsBalance: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  pointsNum: { fontSize: 28, fontWeight: '900', color: Colors.accent },
  pointsUnit: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  // Applied discount
  appliedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceTinted, borderRadius: 12, padding: 12,
  },
  appliedIconWrap: {},
  appliedText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.secondary },

  // Coupon/points input
  inputRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.textPrimary, letterSpacing: 0.5,
  },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', minWidth: 80,
  },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  errorText: { color: Colors.danger, fontSize: 13 },

  // Segments
  segment: { flexDirection: 'row', gap: 10 },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden',
  },
  segmentBtnActive: { borderColor: Colors.primary },
  segmentGrad: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  // Delivery address
  addressInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: Colors.textPrimary, minHeight: 70, textAlignVertical: 'top',
  },

  // Pickup
  pickupList: { gap: 12 },
  nearestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceTinted,
  },
  nearestBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  pickupOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceTinted,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  pickupName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  pickupAddr: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Saved cards hint
  savedHint: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.surfaceTinted, borderRadius: 10, padding: 10,
  },
  savedHintText: { fontSize: 13, color: Colors.secondary, fontWeight: '600' },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 10,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  summaryTotalAmount: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },

  // Footer
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
  footerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  footerTotal: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 18,
    paddingHorizontal: 22, paddingVertical: 15,
  },
  payBtnText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
});
