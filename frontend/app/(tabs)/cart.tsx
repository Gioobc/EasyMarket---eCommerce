import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ordersApi } from '../../services/api';

export default function CartScreen() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('Se requiere inicio de sesión', 'Por favor, inicia sesión para completar tu compra.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    const address = user.address || 'Dirección de envío predeterminada';

    Alert.alert(
      'Confirmar pedido',
      `Total: $${cart.total.toFixed(2)}\nEnviar a: ${address}\n\n¿Deseas continuar con el pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Realizar pedido',
          onPress: async () => {
            try {
              setCheckingOut(true);
              await ordersApi.checkout(address);
              await clearCart();
              Alert.alert('¡Pedido realizado!', 'Tu pedido ha sido confirmado. ¡Gracias!', [
                { text: 'Ver pedidos', onPress: () => router.push('/(tabs)/history') },
                { text: 'Seguir comprando', onPress: () => router.push('/(tabs)') },
              ]);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Error en el pago';
              Alert.alert('Error', msg);
            } finally {
              setCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Ionicons name="cart-outline" size={72} color={Colors.border} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Inicia sesión para guardar artículos y pagar</Text>
        <Button title="Iniciar sesión" onPress={() => router.push('/auth/login')} style={styles.btn} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Ionicons name="cart-outline" size={72} color={Colors.border} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega productos para comenzar</Text>
        <Button
          title="Buscar productos"
          onPress={() => router.push('/(tabs)')}
          style={styles.btn}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.product?.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product?.name ?? 'Product'}
              </Text>
              <Text style={styles.itemPrice}>${item.product?.price?.toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.quantity <= 1) {
                      removeItem(item.productId);
                    } else {
                      updateItem(item.productId, item.quantity - 1);
                    }
                  }}
                >
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(item.productId, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() =>
                Alert.alert('Eliminar artículo', '¿Eliminar este artículo del carrito?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(item.productId) },
                ])
              }
            >
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({cart.items.reduce((s, i) => s + i.quantity, 0)} artículos)</Text>
          <Text style={styles.totalAmount}>${cart.total.toFixed(2)}</Text>
        </View>
        <Button
          title={checkingOut ? 'Procesando pedido...' : 'Pagar'}
          onPress={handleCheckout}
          loading={checkingOut}
          fullWidth
        />
      </View>
    </SafeAreaView>
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
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  btn: {
    marginTop: 20,
    paddingHorizontal: 40,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
});
