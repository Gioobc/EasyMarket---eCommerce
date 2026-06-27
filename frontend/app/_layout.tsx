import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Colors } from '../constants/Colors';
import { initSentry } from '../utils/sentry';

initSentry();

function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: true,
              title: 'Detalle del Producto',
              headerBackTitle: 'Volver',
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerShown: true,
              title: 'Detalle del Pedido',
              headerBackTitle: 'Volver',
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
