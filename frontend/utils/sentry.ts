// frontend/utils/sentry.ts
import * as Sentry from '@sentry/react-native';

// ⚠️  Reemplaza este DSN con el tuyo desde el dashboard de Sentry:
//     Settings → Projects → <tu-proyecto> → Client Keys (DSN)
const SENTRY_DSN = 'https://79612e0dcf3bd7fcc05d40e3b7a3e38c@o4511360948830208.ingest.us.sentry.io/4511598895431680';

export function initSentry(): void {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Trazas de rendimiento: 1.0 = 100% (úsalo así en desarrollo)
    tracesSampleRate: 1.0,

    // Habilita logging de Sentry en consola durante desarrollo
    debug: __DEV__,

    // Habilita Sentry.logger (logs personalizados)
    _experiments: { enableLogs: true },

    // Integrations por defecto (crashes nativos, ANR, etc.)
    enableNativeCrashHandling: true,
    enableAutoPerformanceTracing: true,
  });

  // Log inicial para confirmar que Sentry arrancó
  Sentry.logger.info('EasyMarket app iniciada', { version: '1.1.0' });
}

// ─── Paso 2: Simular un error ─────────────────────────────────────────────────
export function simulateError(): void {
  try {
    throw new Error('Simulated error for testing Sentry — EasyMarket');
  } catch (error) {
    Sentry.captureException(error);
  }
}

// ─── Paso 3: Logs personalizados ─────────────────────────────────────────────
export function sendTestLogs(): void {
  Sentry.logger.info('Usuario navegó al perfil');
  Sentry.logger.warn('Intento de pago fallido — reintentando');
  Sentry.logger.error('Error al cargar catálogo de productos');
}

// ─── Paso 4: Trazas de rendimiento ───────────────────────────────────────────
export function startLoginTrace(): Sentry.Span {
  return Sentry.startInactiveSpan({ name: 'User Login' });
}

export function startCheckoutTrace(): Sentry.Span {
  return Sentry.startInactiveSpan({ name: 'Checkout Flow' });
}

// ─── Paso 4: Métricas personalizadas ─────────────────────────────────────────
export function trackButtonClick(buttonName: string, screen: string): void {
  Sentry.metrics.count('button_clicks', 1, {
    tags: { button: buttonName, screen },
  });
}

export function trackProductView(productId: string): void {
  Sentry.metrics.count('product_views', 1, {
    tags: { product_id: productId },
  });
}

export function trackCartSize(size: number): void {
  Sentry.metrics.gauge('cart_size', size);
}

// ─── Helper: enviar todas las métricas de prueba ─────────────────────────────
export function sendTestMetrics(): void {
  Sentry.metrics.count('button_clicks', 1, { tags: { button: 'try', screen: 'profile' } });
  Sentry.metrics.count('button_buy', 1, { tags: { button: 'buy', screen: 'home' } });
  Sentry.metrics.gauge('queue_size', 15);
  Sentry.metrics.gauge('cart_size', 3);
}
