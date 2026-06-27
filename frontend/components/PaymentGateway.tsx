import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Gradients } from '../constants/Colors';
import { AddPaymentMethodPayload, CardBrand, PaymentMethodSaved } from '../services/api';

interface PaymentGatewayProps {
  visible: boolean;
  total: number;
  savedCards: PaymentMethodSaved[];
  onSuccess: (cardData: AddPaymentMethodPayload | null) => Promise<void>;
  onCancel: () => void;
}

type Step = 'select' | 'new_card' | 'processing' | 'success';

const detectBrand = (num: string): CardBrand => {
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  return 'other';
};

const brandIcon = (brand: CardBrand) => {
  const icons: Record<CardBrand, React.ComponentProps<typeof Ionicons>['name']> = {
    visa: 'card',
    mastercard: 'card',
    amex: 'card',
    other: 'card-outline',
  };
  return icons[brand];
};

const brandColor = (brand: CardBrand) => {
  const colors: Record<CardBrand, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#007BC1',
    other: Colors.primary,
  };
  return colors[brand];
};

const formatCardNumber = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  visible,
  total,
  savedCards,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>(savedCards.length > 0 ? 'select' : 'new_card');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    savedCards[0]?.id ?? null
  );
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slideAnim = useRef(new Animated.Value(600)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(savedCards.length > 0 ? 'select' : 'new_card');
      setSelectedCardId(savedCards[0]?.id ?? null);
      setCardNumber('');
      setHolderName('');
      setExpiry('');
      setCvv('');
      setSaveCard(false);
      setErrors({});
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  const startProcessing = () => {
    setStep('processing');
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  const showSuccess = () => {
    setStep('success');
    spinAnim.stopAnimation();
    Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 16) errs.cardNumber = 'Ingresa un número de 16 dígitos';
    if (!holderName.trim()) errs.holderName = 'Ingresa el nombre del titular';
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      errs.expiry = 'Formato MM/AA';
    }
    if (cvv.length < 3) errs.cvv = 'CVV inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (step === 'select') {
      startProcessing();
      await new Promise((r) => setTimeout(r, 1800));
      showSuccess();
      await new Promise((r) => setTimeout(r, 900));
      await onSuccess(null);
      return;
    }
    if (!validate()) return;
    startProcessing();
    const digits = cardNumber.replace(/\s/g, '');
    const brand = detectBrand(digits);
    const [mm, yy] = expiry.split('/');
    const cardData: AddPaymentMethodPayload = {
      brand,
      last4: digits.slice(-4),
      holderName: holderName.trim(),
      expiryMonth: Number(mm),
      expiryYear: Number(`20${yy}`),
    };
    await new Promise((r) => setTimeout(r, 2000));
    showSuccess();
    await new Promise((r) => setTimeout(r, 900));
    await onSuccess(saveCard ? cardData : null);
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const digits = cardNumber.replace(/\s/g, '');
  const currentBrand = detectBrand(digits);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={Gradients.primary} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>Total a pagar</Text>
              <Text style={styles.headerAmount}>
                S/ {Number(total).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── PASO: seleccionar tarjeta guardada ── */}
              {step === 'select' && (
                <>
                  <Text style={styles.stepTitle}>Selecciona una tarjeta</Text>
                  {savedCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.savedCard, selectedCardId === card.id && styles.savedCardSelected]}
                      onPress={() => setSelectedCardId(card.id)}
                    >
                      <View style={[styles.cardBrandDot, { backgroundColor: brandColor(card.brand) }]}>
                        <Ionicons name={brandIcon(card.brand)} size={16} color="#fff" />
                      </View>
                      <View style={styles.savedCardInfo}>
                        <Text style={styles.savedCardName}>{card.holderName}</Text>
                        <Text style={styles.savedCardNum}>•••• •••• •••• {card.last4}</Text>
                        <Text style={styles.savedCardExp}>
                          {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                        </Text>
                      </View>
                      {selectedCardId === card.id && (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.newCardBtn}
                    onPress={() => setStep('new_card')}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.newCardBtnText}>Usar otra tarjeta</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── PASO: ingresar nueva tarjeta ── */}
              {step === 'new_card' && (
                <>
                  <Text style={styles.stepTitle}>Datos de la tarjeta</Text>

                  {/* Vista previa de tarjeta */}
                  <LinearGradient colors={Gradients.primaryDark} style={styles.cardPreview}>
                    <View style={styles.cardPreviewTop}>
                      <Text style={styles.cardPreviewBank}>EasyMarket Pay</Text>
                      <Ionicons name={brandIcon(currentBrand)} size={28} color="#fff" />
                    </View>
                    <Text style={styles.cardPreviewNum}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </Text>
                    <View style={styles.cardPreviewBottom}>
                      <View>
                        <Text style={styles.cardPreviewLabel}>TITULAR</Text>
                        <Text style={styles.cardPreviewValue}>
                          {holderName || 'NOMBRE APELLIDO'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.cardPreviewLabel}>VENCE</Text>
                        <Text style={styles.cardPreviewValue}>{expiry || 'MM/AA'}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Formulario */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Número de tarjeta</Text>
                    <TextInput
                      style={[styles.fieldInput, errors.cardNumber && styles.fieldInputError]}
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                      placeholder="0000 0000 0000 0000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                    {errors.cardNumber ? <Text style={styles.fieldError}>{errors.cardNumber}</Text> : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Titular de la tarjeta</Text>
                    <TextInput
                      style={[styles.fieldInput, errors.holderName && styles.fieldInputError]}
                      value={holderName}
                      onChangeText={setHolderName}
                      placeholder="NOMBRE APELLIDO"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                    />
                    {errors.holderName ? <Text style={styles.fieldError}>{errors.holderName}</Text> : null}
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Vencimiento</Text>
                      <TextInput
                        style={[styles.fieldInput, errors.expiry && styles.fieldInputError]}
                        value={expiry}
                        onChangeText={(t) => setExpiry(formatExpiry(t))}
                        placeholder="MM/AA"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                      {errors.expiry ? <Text style={styles.fieldError}>{errors.expiry}</Text> : null}
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>CVV</Text>
                      <TextInput
                        style={[styles.fieldInput, errors.cvv && styles.fieldInputError]}
                        value={cvv}
                        onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={4}
                      />
                      {errors.cvv ? <Text style={styles.fieldError}>{errors.cvv}</Text> : null}
                    </View>
                  </View>

                  <TouchableOpacity style={styles.saveCardRow} onPress={() => setSaveCard((v) => !v)}>
                    <View style={[styles.checkbox, saveCard && styles.checkboxActive]}>
                      {saveCard && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.saveCardText}>Guardar esta tarjeta para futuras compras</Text>
                  </TouchableOpacity>

                  {savedCards.length > 0 && (
                    <TouchableOpacity style={styles.newCardBtn} onPress={() => setStep('select')}>
                      <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
                      <Text style={styles.newCardBtnText}>Usar tarjeta guardada</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* ── PASO: procesando ── */}
              {step === 'processing' && (
                <View style={styles.processingContainer}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <LinearGradient colors={Gradients.primary} style={styles.spinnerRing}>
                      <View style={styles.spinnerCenter} />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={styles.processingTitle}>Procesando pago...</Text>
                  <Text style={styles.processingSubtitle}>Por favor espera un momento</Text>
                </View>
              )}

              {/* ── PASO: éxito ── */}
              {step === 'success' && (
                <View style={styles.processingContainer}>
                  <Animated.View style={{ transform: [{ scale: successScale }] }}>
                    <LinearGradient colors={Gradients.success} style={styles.successCircle}>
                      <Ionicons name="checkmark" size={44} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={styles.successTitle}>¡Pago exitoso!</Text>
                  <Text style={styles.processingSubtitle}>Tu pedido está siendo preparado</Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {(step === 'select' || step === 'new_card') && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                <LinearGradient colors={Gradients.primary} style={styles.payBtnGradient}>
                  <Ionicons name="lock-closed" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Pagar S/ {Number(total).toFixed(2)}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.secureRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.secureText}>Pago seguro con cifrado SSL</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerContent: {},
  headerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  headerAmount: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { maxHeight: 420 },
  bodyContent: { padding: 20 },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 12,
  },
  savedCardSelected: { borderColor: Colors.primary, backgroundColor: '#EEF2FF' },
  cardBrandDot: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardInfo: { flex: 1 },
  savedCardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  savedCardNum: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  savedCardExp: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  newCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  newCardBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  cardPreview: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardPreviewBank: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  cardPreviewNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  cardPreviewValue: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
  },
  fieldInputError: { borderColor: Colors.danger },
  fieldError: { color: Colors.danger, fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  saveCardText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 16,
  },
  spinnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
  },
  processingTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  processingSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  payBtn: { borderRadius: 14, overflow: 'hidden' },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  secureText: { fontSize: 12, color: Colors.textMuted },
});
