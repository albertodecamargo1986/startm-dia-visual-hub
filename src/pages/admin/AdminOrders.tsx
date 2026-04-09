import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderStatus } from '@/types';

const AdminOrders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
      return (data ?? []) as (Order & { profiles: { full_name: string; email: string } | null })[];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Gestão de Pedidos</h2>
      {orders?.map(o => (
        <Link key={o.id} to={`/admin/pedidos/${o.id}`}>
          <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors mb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-foreground">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{o.profiles?.full_name} · {o.profiles?.email}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at!).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <Badge className={ORDER_STATUS_COLORS[o.status as OrderStatus]}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                <p className="text-sm font-bold text-primary mt-1">R$ {Number(o.total).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default AdminOrders;
