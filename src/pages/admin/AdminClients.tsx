import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Profile, Order, OrderStatus } from '@/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatBRL, formatDate } from '@/lib/format';

const AdminClients = () => {
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);

  const { data: clients } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data ?? []) as Profile[];
    },
  });

  const { data: clientOrders } = useQuery({
    queryKey: ['admin-client-orders', selectedClient?.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('customer_id', selectedClient!.id).order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!selectedClient,
  });

  // Aggregate stats per client
  const { data: orderStats } = useQuery({
    queryKey: ['admin-clients-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('customer_id, total');
      const stats: Record<string, { count: number; total: number }> = {};
      data?.forEach(o => {
        if (!stats[o.customer_id]) stats[o.customer_id] = { count: 0, total: 0 };
        stats[o.customer_id].count++;
        stats[o.customer_id].total += Number(o.total);
      });
      return stats;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Clientes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Total Gasto</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients?.map(c => {
            const s = orderStats?.[c.id];
            return (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedClient(c)}>
                <TableCell className="font-medium">{c.full_name || 'Sem nome'}</TableCell>
                <TableCell className="text-sm">{c.email}</TableCell>
                <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                <TableCell>{s?.count ?? 0}</TableCell>
                <TableCell className="text-primary font-semibold">{formatBRL(s?.total ?? 0)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at!)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selectedClient?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {selectedClient?.email}</p>
            <p><span className="text-muted-foreground">Telefone:</span> {selectedClient?.phone || '—'}</p>
            <p><span className="text-muted-foreground">Empresa:</span> {selectedClient?.company_name || '—'}</p>
            <p><span className="text-muted-foreground">CPF/CNPJ:</span> {selectedClient?.cpf_cnpj || '—'}</p>
          </div>
          {clientOrders && clientOrders.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Pedidos ({clientOrders.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clientOrders.map(o => (
                  <Link key={o.id} to={`/admin/pedidos/${o.id}`} onClick={() => setSelectedClient(null)} className="flex items-center justify-between p-2 rounded hover:bg-muted/30">
                    <div>
                      <span className="text-sm font-medium">{o.order_number}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(o.created_at!)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-semibold">{formatBRL(Number(o.total))}</span>
                      <Badge className={ORDER_STATUS_COLORS[o.status as OrderStatus] + ' text-xs'}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
