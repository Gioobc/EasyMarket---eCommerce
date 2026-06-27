import { OrderStatus } from '../services/api';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  preparing: 'Preparando',
  on_the_way: 'En camino',
  delivered: 'Entregado',
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo al entregar',
  card: 'Tarjeta',
};

export const DELIVERY_LABELS: Record<string, string> = {
  delivery: 'Delivery a domicilio',
  pickup: 'Recojo en tienda',
};

export function formatMoney(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
