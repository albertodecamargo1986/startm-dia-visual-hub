import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderItem, OrderTimeline, OrderStatus } from '@/types';

const ClientOrderDetail = () => {
  const { id } = useParams();

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id!).single();
      return data as Order;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', id!);
      return (data ?? []) as OrderItem[];
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ['order-timeline', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_timeline').select('*').eq('order_id', id!).order('created_at', { ascending: false });
      return (data ?? []) as OrderTimeline[];
    },
  });

  if (!order) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Pedido {order.order_number}</h2>
        <Badge className={ORDER_STATUS_COLORS[order.status as OrderStatus]}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
      </div>

      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Itens</h3>
        <div className="space-y-2">
          {items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product_name} ×{item.quantity}</span>
              <span className="text-primary">R$ {Number(item.total_price).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Total</span><span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Timeline</h3>
        <div className="space-y-3">
          {timeline?.map(t => (
            <div key={t.id} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{ORDER_STATUS_LABELS[t.status as OrderStatus] || t.status}</p>
                {t.message && <p className="text-xs text-muted-foreground">{t.message}</p>}
                <p className="text-xs text-muted-foreground">{new Date(t.created_at!).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ClientOrderDetail;
