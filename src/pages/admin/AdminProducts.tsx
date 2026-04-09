import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Copy, Sticker } from 'lucide-react';
import type { Product, Category } from '@/types';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('prod_order');
      return (data ?? []) as (Product & { categories: { name: string } | null })[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('cat_order'); return (data ?? []) as Category[]; },
  });

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'active' | 'featured'; value: boolean }) => {
      await supabase.from('products').update({ [field]: value } as any).eq('id', id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Atualizado!'); },
  });

  const duplicate = useMutation({
    mutationFn: async (p: Product) => {
      const { id, created_at, updated_at, ...rest } = p;
      await supabase.from('products').insert({ ...rest, name: `${p.name} (cópia)`, slug: `${p.slug}-copia-${Date.now()}` });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produto duplicado!'); },
  });

  let filtered = products ?? [];
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (catFilter !== 'all') filtered = filtered.filter(p => p.category_id === catFilter);
  if (statusFilter === 'active') filtered = filtered.filter(p => p.active);
  if (statusFilter === 'inactive') filtered = filtered.filter(p => !p.active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl">Produtos</h2>
        <Link to="/admin/produtos/novo"><Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button></Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Destaque</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="h-12 w-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <Sticker className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.categories?.name || '—'}</TableCell>
                <TableCell className="text-sm text-primary font-semibold">R$ {Number(p.base_price).toFixed(2).replace('.', ',')}/{p.price_unit}</TableCell>
                <TableCell><Switch checked={p.active ?? false} onCheckedChange={v => toggleField.mutate({ id: p.id, field: 'active', value: v })} /></TableCell>
                <TableCell><Switch checked={p.featured ?? false} onCheckedChange={v => toggleField.mutate({ id: p.id, field: 'featured', value: v })} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link to={`/admin/produtos/${p.id}`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link>
                    <Button variant="ghost" size="icon" onClick={() => duplicate.mutate(p)}><Copy className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminProducts;
