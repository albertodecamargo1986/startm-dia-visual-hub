import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, Users, ShoppingBag, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const { data: orderCount } = useQuery({ queryKey: ['admin-orders-count'], queryFn: async () => { const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }); return count ?? 0; } });
  const { data: clientCount } = useQuery({ queryKey: ['admin-clients-count'], queryFn: async () => { const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }); return count ?? 0; } });
  const { data: productCount } = useQuery({ queryKey: ['admin-products-count'], queryFn: async () => { const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }); return count ?? 0; } });
  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('total').eq('payment_status', 'paid');
      return data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
    },
  });

  const stats = [
    { label: 'Pedidos', value: orderCount ?? 0, icon: Package, color: 'text-primary' },
    { label: 'Clientes', value: clientCount ?? 0, icon: Users, color: 'text-accent' },
    { label: 'Produtos', value: productCount ?? 0, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Faturamento', value: `R$ ${(revenue ?? 0).toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-accent' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label} className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AdminDashboard;
