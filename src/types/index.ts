import type { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type CustomerFile = Database['public']['Tables']['customer_files']['Row'];
export type OrderTimeline = Database['public']['Tables']['order_timeline']['Row'];
export type SiteSetting = Database['public']['Tables']['site_settings']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  thumbnail: string;
  unitPrice: number;
  quantity: number;
  customWidth?: number;
  customHeight?: number;
  notes?: string;
  needsArtwork: boolean;
  priceUnit: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export type OrderStatus = 'pending_payment' | 'awaiting_artwork' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando Pagamento',
  awaiting_artwork: 'Aguardando Arte',
  in_production: 'Em Produção',
  ready: 'Pronto',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  awaiting_artwork: 'bg-blue-500/20 text-blue-400',
  in_production: 'bg-orange-500/20 text-orange-400',
  ready: 'bg-green-500/20 text-green-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  refunded: 'bg-gray-500/20 text-gray-400',
};

export interface LoginLocationState {
  from?: { pathname: string };
}

export interface EmailVerificationLocationState {
  email: string;
}

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}
