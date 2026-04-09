import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'order' | 'payment' | 'artwork';
}

const PAYMENT_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-400' },
  paid: { label: 'Pago', className: 'bg-green-500/20 text-green-400' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-500/20 text-gray-400' },
};

const ARTWORK_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Aprovado', className: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/20 text-red-400' },
  revision: { label: 'Em Revisão', className: 'bg-blue-500/20 text-blue-400' },
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let label = status;
  let colorClass = 'bg-muted text-muted-foreground';

  if (type === 'order') {
    label = ORDER_STATUS_LABELS[status as OrderStatus] || status;
    colorClass = ORDER_STATUS_COLORS[status as OrderStatus] || colorClass;
  } else if (type === 'payment') {
    const m = PAYMENT_MAP[status];
    if (m) { label = m.label; colorClass = m.className; }
  } else if (type === 'artwork') {
    const m = ARTWORK_MAP[status];
    if (m) { label = m.label; colorClass = m.className; }
  }

  return (
    <Badge variant="outline" className={cn('border-0 font-medium', colorClass)}>
      {label}
    </Badge>
  );
}
