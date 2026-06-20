// frontend/app/_layout.tsx
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { initSentry } from '../utils/sentry';

// Inicializar Sentry una sola vez al cargar el módulo
initSentry();

function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: true,
              title: 'Detalles del Producto',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerShown: true,
              title: 'Order Detail',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}

// Sentry.wrap() captura errores no controlados (crashes) a nivel de componente
export default Sentry.wrap(RootLayout);
