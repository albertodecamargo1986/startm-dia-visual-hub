import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import type { Profile } from '@/types';

const AdminClients = () => {
  const { data: clients } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); return (data ?? []) as Profile[]; },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Clientes</h2>
      {clients?.map(c => (
        <Card key={c.id} className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{c.full_name || 'Sem nome'}</p>
              <p className="text-xs text-muted-foreground">{c.email} · {c.phone} · {c.company_name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(c.created_at!).toLocaleDateString('pt-BR')}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AdminClients;
