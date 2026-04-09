import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Package, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { profile } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['my-orders-count'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    enabled: !!profile,
  });

  const { data: files } = useQuery({
    queryKey: ['my-files-count'],
    queryFn: async () => {
      const { count } = await supabase.from('customer_files').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    enabled: !!profile,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/cliente/pedidos">
          <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div><p className="text-2xl font-bold">{orders ?? 0}</p><p className="text-sm text-muted-foreground">Pedidos</p></div>
            </div>
          </Card>
        </Link>
        <Link to="/cliente/arquivos">
          <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-accent" />
              <div><p className="text-2xl font-bold">{files ?? 0}</p><p className="text-sm text-muted-foreground">Arquivos</p></div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default ClientDashboard;
