import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/format';

const PAGE_SIZE = 20;
const statuses: OrderStatus[] = ['pending_payment', 'awaiting_artwork', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_MESSAGES: Record<string, string> = {
  awaiting_artwork: 'Pagamento confirmado! Por favor, envie os arquivos de arte.',
  in_production: 'Sua arte foi aprovada e seu pedido está em produção!',
  ready: 'Seu pedido está pronto para retirada/envio!',
  shipped: 'Seu pedido foi despachado!',
  delivered: 'Pedido entregue. Obrigado pela preferência!',
  cancelled: 'Pedido cancelado.',
};

const AdminOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from('orders').select('*, profiles(full_name, email)', { count: 'exact' }).order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (dateFrom) q = q.gte('created_at', dateFrom);
      if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59');
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, count } = await q;
      return { orders: (data ?? []) as (Order & { profiles: { full_name: string; email: string } | null })[], total: count ?? 0 };
    },
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = search
    ? orders.filter(o => o.order_number.toLowerCase().includes(search.toLowerCase()) || o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const quickStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('orders').update({ status }).eq('id', id);
      await supabase.from('order_timeline').insert({
        order_id: id, status, message: STATUS_MESSAGES[status] || `Status alterado para ${ORDER_STATUS_LABELS[status as OrderStatus]}`, created_by: user?.id,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status atualizado!'); },
  });

  const exportCSV = () => {
    if (!orders.length) return;
    const header = 'Pedido,Cliente,Email,Data,Total,Status Pagamento,Status\n';
    const rows = orders.map(o =>
      `${o.order_number},"${o.profiles?.full_name || ''}","${o.profiles?.email || ''}",${formatDate(o.created_at!)},${Number(o.total).toFixed(2)},${o.payment_status},${o.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl">Gestão de Pedidos</h2>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Exportar CSV</Button>
      </div>

      <Card className="p-4 bg-card border-border">
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar pedido ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="w-40" />
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="w-40" />
        </div>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">{o.profiles?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{o.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(o.created_at!)}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatBRL(Number(o.total))}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{o.payment_status}</Badge></TableCell>
                    <TableCell>
                      <Select defaultValue={o.status} onValueChange={val => quickStatus.mutate({ id: o.id, status: val })}>
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <Badge className={`${ORDER_STATUS_COLORS[o.status as OrderStatus]} text-xs`}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                        </SelectTrigger>
                        <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/pedidos/${o.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(o => (
              <Link key={o.id} to={`/admin/pedidos/${o.id}`}>
                <Card className="p-4 bg-card border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{o.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at!)}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={ORDER_STATUS_COLORS[o.status as OrderStatus] + ' text-xs'}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                      <p className="text-sm font-bold text-primary mt-1">{formatBRL(Number(o.total))}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{total} pedido(s) · Página {page + 1} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;
