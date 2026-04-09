import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Cog, FileText, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderStatus } from '@/types';

const ClientDashboard = () => {
  const { profile } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['my-orders-dashboard'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!profile,
  });

  const { data: pendingFiles } = useQuery({
    queryKey: ['my-pending-files-count'],
    queryFn: async () => {
      const { count } = await supabase.from('customer_files').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      return count ?? 0;
    },
    enabled: !!profile,
  });

  const totalOrders = orders?.length ?? 0;
  const inProduction = orders?.filter(o => o.status === 'in_production').length ?? 0;
  const lastOrder = orders?.[0];
  const recentOrders = orders?.slice(0, 3) ?? [];

  const stats = [
    { label: 'Total de Pedidos', value: totalOrders, icon: Package, color: 'text-primary', to: '/cliente/pedidos' },
    { label: 'Em Produção', value: inProduction, icon: Cog, color: 'text-orange-400', to: '/cliente/pedidos' },
    { label: 'Arquivos Pendentes', value: pendingFiles ?? 0, icon: FileText, color: 'text-blue-400', to: '/cliente/arquivos' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.to}>
            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors h-full">
              <div className="flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color} flex-shrink-0`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {lastOrder ? (
          <Link to={`/cliente/pedidos/${lastOrder.id}`}>
            <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors h-full">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{lastOrder.order_number}</p>
                  <Badge className={`${ORDER_STATUS_COLORS[lastOrder.status as OrderStatus]} text-[10px] mt-1`}>
                    {ORDER_STATUS_LABELS[lastOrder.status as OrderStatus]}
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
          </Card>
        )}
      </div>

      {recentOrders.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-3">Últimos Pedidos</h3>
          <div className="space-y-2">
            {recentOrders.map(o => (
              <Link key={o.id} to={`/cliente/pedidos/${o.id}`}>
                <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at!).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={ORDER_STATUS_COLORS[o.status as OrderStatus]}>
                        {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                      </Badge>
                      <p className="text-sm font-bold text-primary mt-1">R$ {Number(o.total).toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
