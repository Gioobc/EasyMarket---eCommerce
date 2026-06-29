import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Gradients } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethodSaved, PointsHistoryItem, authApi, pointsApi } from '../../services/api';
import { formatDate, formatMoney } from '../../utils/format';

const BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#007BC1',
  other: Colors.primary,
};

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function IconRow({
  icon, bg, label, value, onPress, right,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  bg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.iconRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg ?? Colors.surfaceTinted }]}>
        <Ionicons name={icon} size={17} color={Colors.primary} />
      </View>
      <View style={styles.iconRowContent}>
        <Text style={styles.iconRowLabel}>{label}</Text>
        {value !== undefined && <Text style={styles.iconRowValue} numberOfLines={1}>{value}</Text>}
      </View>
      {right ?? (onPress && (
        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
      ))}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSaved[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [points, setPoints] = useState<number>(0);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingCards(true);
      authApi.getPaymentMethods()
        .then(setPaymentMethods)
        .catch(() => {})
        .finally(() => setLoadingCards(false));

      pointsApi.get()
        .then((res) => { setPoints(res.points); setPointsHistory(res.history); })
        .catch(() => {});
    }
  }, [user]);

  const handleDeleteCard = (id: string) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('¿Eliminar esta tarjeta?')) return;
      authApi.deletePaymentMethod(id)
        .then(() => setPaymentMethods((prev) => prev.filter((m) => m.id !== id)))
        .catch((e: unknown) => Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar'));
      return;
    }
    Alert.alert('Eliminar tarjeta', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await authApi.deletePaymentMethod(id);
            setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <LinearGradient colors={Gradients.hero} style={styles.guestHero}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={44} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Bienvenido a EasyMarket</Text>
          <Text style={styles.guestSub}>Inicia sesión para gestionar tu cuenta</Text>
        </LinearGradient>
        <View style={styles.guestCard}>
          <Button title="Iniciar sesión" onPress={() => router.push('/auth/login')} fullWidth />
          <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.registerLink}>
            <Text style={styles.registerLinkText}>¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate gratis</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validación', 'El nombre no puede estar vacío'); return; }
    try {
      setSaving(true);
      await updateProfile({ name, phone, address, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined });
      setCurrentPassword(''); setNewPassword(''); setEditing(false); setShowPasswordFields(false);
      Alert.alert('Listo', 'Perfil actualizado correctamente');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const toggleAlerts = async (value: boolean) => {
    try {
      setSavingAlerts(true);
      await updateProfile({ emailAlerts: value });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Cerrar sesión?')) logout();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const discountAvailable = Math.floor(points / 100);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <LinearGradient colors={Gradients.hero} style={styles.heroHeader}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{user.name}</Text>
                <Text style={styles.heroEmail}>{user.email}</Text>
              </View>
              {points > 0 && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>★ {points} pts</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Información de cuenta ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SectionLabel label="Información personal" />
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Input label="Nombre completo" value={name} onChangeText={setName} placeholder="Tu nombre" />
              <Input label="Teléfono" value={phone} onChangeText={setPhone} placeholder="Número de teléfono" keyboardType="phone-pad" />
              <Input label="Dirección" value={address} onChangeText={setAddress} placeholder="Dirección de envío" multiline numberOfLines={2} />

              <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPasswordFields((v) => !v)}>
                <Ionicons name="lock-closed-outline" size={15} color={Colors.accent} />
                <Text style={styles.passwordToggleText}>Cambiar contraseña</Text>
                <Ionicons name={showPasswordFields ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              {showPasswordFields && (
                <>
                  <Input label="Contraseña actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Contraseña actual" />
                  <Input label="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />
                </>
              )}

              <View style={styles.editActions}>
                <Button
                  title="Cancelar" variant="outline"
                  onPress={() => { setEditing(false); setName(user.name); setPhone(user.phone); setAddress(user.address); setCurrentPassword(''); setNewPassword(''); setShowPasswordFields(false); }}
                  style={styles.actionBtn}
                />
                <Button title="Guardar cambios" onPress={handleSave} loading={saving} style={styles.actionBtn} />
              </View>
            </View>
          ) : (
            <>
              <IconRow icon="person-outline" label="Nombre" value={user.name} />
              <IconRow icon="mail-outline" label="Correo electrónico" value={user.email} />
              <IconRow icon="call-outline" label="Teléfono" value={user.phone || 'No especificado'} />
              <IconRow icon="location-outline" label="Dirección de envío" value={user.address || 'No especificada'} />
            </>
          )}
        </View>

        {/* ── Puntos de fidelización ── */}
        <View style={styles.card}>
          <SectionLabel label="Mis puntos" />
          <LinearGradient colors={Gradients.accent} style={styles.pointsCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.pointsCardLeft}>
              <Text style={styles.pointsCardValue}>{points}</Text>
              <Text style={styles.pointsCardUnit}>puntos acumulados</Text>
              {discountAvailable > 0 && (
                <View style={styles.pointsDiscountBadge}>
                  <Text style={styles.pointsDiscountText}>{formatMoney(discountAvailable)} disponibles para canjear</Text>
                </View>
              )}
            </View>
            <View style={styles.pointsCardIcon}>
              <Ionicons name="trophy" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>

          <View style={styles.pointsInfo}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.pointsInfoText}>Ganas 10 pts por cada S/ 1.00 gastado. 100 pts = S/ 1.00 de descuento.</Text>
          </View>

          <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory((v) => !v)}>
            <Ionicons name="time-outline" size={15} color={Colors.primary} />
            <Text style={styles.historyToggleText}>{showHistory ? 'Ocultar historial' : 'Ver historial de puntos'}</Text>
            <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyList}>
              {pointsHistory.length === 0 ? (
                <Text style={styles.emptyText}>Sin movimientos aún</Text>
              ) : (
                pointsHistory.slice(0, 8).map((item, idx) => (
                  <View key={idx} style={[styles.historyRow, idx === 0 && { borderTopWidth: 0 }]}>
                    <View style={[styles.historyDot, { backgroundColor: item.amount >= 0 ? Colors.secondary : Colors.danger }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyReason}>{item.reason}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={[styles.historyAmount, { color: item.amount >= 0 ? Colors.secondary : Colors.danger }]}>
                      {item.amount >= 0 ? '+' : ''}{item.amount} pts
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Métodos de pago ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SectionLabel label="Métodos de pago" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{paymentMethods.length}/5</Text>
            </View>
          </View>

          {loadingCards ? (
            <Text style={styles.emptyText}>Cargando...</Text>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.noCards}>
              <Ionicons name="card-outline" size={36} color={Colors.border} />
              <Text style={styles.noCardsTitle}>Sin tarjetas guardadas</Text>
              <Text style={styles.noCardsSub}>Guarda una tarjeta al hacer tu próxima compra</Text>
            </View>
          ) : (
            paymentMethods.map((m) => (
              <View key={m.id} style={styles.savedCard}>
                <View style={[styles.brandIcon, { backgroundColor: BRAND_COLORS[m.brand] ?? Colors.primary }]}>
                  <Ionicons name="card" size={16} color="#fff" />
                </View>
                <View style={styles.savedCardInfo}>
                  <Text style={styles.savedCardHolder}>{m.holderName}</Text>
                  <Text style={styles.savedCardNum}>•••• {m.last4}</Text>
                  <Text style={styles.savedCardExp}>{String(m.expiryMonth).padStart(2, '0')}/{String(m.expiryYear).slice(-2)}</Text>
                </View>
                <TouchableOpacity style={styles.deleteCardBtn} onPress={() => handleDeleteCard(m.id)}>
                  <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Alertas de ofertas ── */}
        <View style={styles.card}>
          <SectionLabel label="Notificaciones" />
          <IconRow
            icon="mail-outline"
            label="Alertas de ofertas"
            right={
              <Switch
                value={Boolean(user.emailAlerts)}
                onValueChange={toggleAlerts}
                disabled={savingAlerts}
                trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
                thumbColor={user.emailAlerts ? Colors.primary : '#fff'}
              />
            }
          />
          <Text style={styles.alertSub}>Recibe por correo ofertas con más de 50% de descuento</Text>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={19} color={Colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 8 },

  // Guest
  guestContainer: { flex: 1, backgroundColor: Colors.background },
  guestHero: { alignItems: 'center', paddingTop: 80, paddingBottom: 48, paddingHorizontal: 32 },
  guestIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  guestSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center' },
  guestCard: { margin: 20, backgroundColor: Colors.surface, borderRadius: 20, padding: 24, gap: 16, shadowColor: Colors.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: Colors.textMuted },
  registerLinkBold: { color: Colors.primary, fontWeight: '700' },

  // Hero
  heroHeader: { paddingBottom: 28 },
  heroInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  pointsBadge: {
    backgroundColor: Colors.accentLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pointsBadgeText: { fontSize: 12, fontWeight: '800', color: Colors.accent },

  // Cards
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    marginHorizontal: 16, marginTop: 14,
    shadowColor: Colors.primary, shadowOpacity: 0.07, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  badge: { backgroundColor: Colors.surfaceTinted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },

  // Icon rows
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconRowContent: { flex: 1 },
  iconRowLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  iconRowValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },

  // Edit form
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  editForm: { gap: 4 },
  passwordToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 4,
  },
  passwordToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.accent },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1 },

  // Points
  pointsCard: {
    borderRadius: 16, padding: 18, flexDirection: 'row',
    alignItems: 'center', marginBottom: 14,
  },
  pointsCardLeft: { flex: 1 },
  pointsCardValue: { fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 },
  pointsCardUnit: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 8 },
  pointsDiscountBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  pointsDiscountText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  pointsCardIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  pointsInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 14, backgroundColor: Colors.surfaceTinted, borderRadius: 10, padding: 10 },
  pointsInfoText: { fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 17 },
  historyToggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  historyToggleText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  historyList: { marginTop: 12, gap: 0 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyReason: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  historyDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  historyAmount: { fontSize: 14, fontWeight: '800' },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },

  // Payment methods
  noCards: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  noCardsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  noCardsSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  savedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: Colors.background, borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  brandIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  savedCardInfo: { flex: 1 },
  savedCardHolder: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  savedCardNum: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  savedCardExp: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  deleteCardBtn: { padding: 6 },

  // Alerts
  alertSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginLeft: 48, lineHeight: 17 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 14, paddingVertical: 15,
    borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.dangerLight,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
