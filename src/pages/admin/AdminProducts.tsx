import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Sticker } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';

const AdminProducts = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('prod_order');
      return (data ?? []) as (Product & { categories: { name: string } | null })[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('products').update({ active }).eq('id', id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produto atualizado!'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Produtos</h2>
        <Link to="/admin/produtos/novo"><Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button></Link>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
        products?.map(p => (
          <Card key={p.id} className="p-4 bg-card border-border flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
              {p.thumbnail ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" /> : <Sticker className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.categories?.name} · R$ {Number(p.base_price).toFixed(2).replace('.', ',')}/{p.price_unit}</p>
            </div>
            <Badge variant={p.active ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })}>
              {p.active ? 'Ativo' : 'Inativo'}
            </Badge>
            <Link to={`/admin/produtos/${p.id}`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link>
          </Card>
        ))
      }
    </div>
  );
};

export default AdminProducts;
