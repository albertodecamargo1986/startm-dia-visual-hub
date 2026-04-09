import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users, DollarSign, Clock, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderStatus } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminDashboard = () => {
  const today = startOfDay(new Date()).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: ordersToday } = useQuery({
    queryKey: ['admin-kpi-today'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today);
      return count ?? 0;
    },
  });

  const { data: revenueMonth } = useQuery({
    queryKey: ['admin-kpi-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', monthStart);
      return data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
    },
  });

  const { data: awaitingArt } = useQuery({
    queryKey: ['admin-kpi-art'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_artwork');
      return count ?? 0;
    },
  });

  const { data: inProduction } = useQuery({
    queryKey: ['admin-kpi-production'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_production');
      return count ?? 0;
    },
  });

  const { data: clientCount } = useQuery({
    queryKey: ['admin-kpi-clients'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  // Chart data - orders last 7 days
  const { data: chartData } = useQuery({
    queryKey: ['admin-chart-7d'],
    queryFn: async () => {
      const since = subDays(new Date(), 6);
      const { data } = await supabase.from('orders').select('created_at').gte('created_at', since.toISOString());
      const counts: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        counts[d] = 0;
      }
      data?.forEach(o => {
        const d = format(new Date(o.created_at!), 'yyyy-MM-dd');
        if (counts[d] !== undefined) counts[d]++;
      });
      return Object.entries(counts).map(([date, count]) => ({
        day: format(new Date(date + 'T12:00:00'), 'EEE', { locale: ptBR }),
        pedidos: count,
      }));
    },
  });

  // Attention needed
  const { data: attentionOrders } = useQuery({
    queryKey: ['admin-attention'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, profiles(full_name)').in('status', ['awaiting_artwork', 'pending_payment']).order('created_at', { ascending: true }).limit(10);
      return (data ?? []) as (Order & { profiles: { full_name: string } | null })[];
    },
  });

  const stats = [
    { label: 'Pedidos Hoje', value: ordersToday ?? 0, icon: Package, color: 'text-primary' },
    { label: 'Receita do Mês', value: `R$ ${(revenueMonth ?? 0).toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Aguardando Arte', value: awaitingArt ?? 0, icon: Palette, color: 'text-blue-400' },
    { label: 'Em Produção', value: inProduction ?? 0, icon: Clock, color: 'text-orange-400' },
    { label: 'Total Clientes', value: clientCount ?? 0, icon: Users, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <s.icon className={`h-7 w-7 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Pedidos — Últimos 7 dias</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData ?? []}>
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {!!attentionOrders?.length && (
        <Card className="p-4 bg-card border-border">
          <h3 className="font-display text-lg mb-3">Pedidos que precisam de atenção</h3>
          <div className="space-y-2">
            {attentionOrders.map(o => (
              <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <span className="text-sm font-medium">{o.order_number}</span>
                  <span className="text-xs text-muted-foreground ml-2">{o.profiles?.full_name}</span>
                </div>
                <Badge className={ORDER_STATUS_COLORS[o.status as OrderStatus]}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
