import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, Clock, CreditCard } from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import type { Order, OrderItem } from '@/types';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Aguardando pagamento', color: 'text-yellow-500', icon: Clock },
  analyzing: { label: 'Em análise', color: 'text-blue-500', icon: CreditCard },
  paid: { label: 'Pagamento confirmado', color: 'text-green-500', icon: CheckCircle },
  refunded: { label: 'Cancelado/Estornado', color: 'text-red-500', icon: Clock },
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!orderIdParam) return;

    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderIdParam).single();
      if (data) {
        setOrder(data);
        trackEvent('payment_confirmed', { orderId: orderIdParam }, orderIdParam);
      }
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', orderIdParam);
      if (orderItems) setItems(orderItems);
    };
    fetchOrder();

    // Realtime subscription
    const channel = supabase
      .channel(`order-${orderIdParam}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderIdParam}`,
      }, (payload) => {
        setOrder((prev) => prev ? { ...prev, ...(payload.new as Partial<Order>) } : payload.new as Order);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderIdParam]);

  const paymentInfo = statusLabels[order?.payment_status] || statusLabels.pending;
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="container py-16 max-w-2xl mx-auto">
      <motion.div
        className="text-center mb-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Pedido Realizado!</h1>
        <p className="text-muted-foreground text-lg">
          Seu pedido foi recebido com sucesso.
        </p>
      </motion.div>

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Pedido #{order.order_number}</h2>
              <div className={`flex items-center gap-2 ${paymentInfo.color}`}>
                <PaymentIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{paymentInfo.label}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product_name} ×{item.quantity}</span>
                  <span>{formatBRL(Number(item.total_price))}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatBRL(Number(order.total))}</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h3 className="font-display text-xl mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Próximos Passos
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Confirme o pagamento via PagSeguro</li>
              <li>Envie os arquivos de arte (se necessário) na sua área de cliente</li>
              <li>Aguarde a aprovação da arte e início da produção</li>
              <li>Receba seu pedido no prazo informado</li>
            </ol>
          </Card>

          <div className="flex gap-4 justify-center">
            <Link to={`/cliente/pedidos/${order.id}`}>
              <Button className="font-display text-lg tracking-wider">Acompanhar Pedido</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="font-display text-lg tracking-wider">Voltar ao Início</Button>
            </Link>
          </div>
        </motion.div>
      )}

      {!order && !orderIdParam && (
        <div className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">Acompanhe o status na sua área de cliente.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/cliente/pedidos"><Button className="font-display text-lg tracking-wider">Ver Meus Pedidos</Button></Link>
            <Link to="/"><Button variant="outline" className="font-display text-lg tracking-wider">Voltar ao Início</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutSuccess;
