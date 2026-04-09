import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Upload, Cog, Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { OrderTimeline as OrderTimelineType } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  events: OrderTimelineType[];
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; spin?: boolean }> = {
  pending_payment: { icon: CreditCard, color: 'text-yellow-500' },
  awaiting_artwork: { icon: Upload, color: 'text-blue-500' },
  in_production: { icon: Cog, color: 'text-orange-500', spin: true },
  ready: { icon: Package, color: 'text-green-500' },
  shipped: { icon: Truck, color: 'text-green-500' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600' },
  cancelled: { icon: XCircle, color: 'text-destructive' },
  refunded: { icon: XCircle, color: 'text-muted-foreground' },
};

export function OrderTimeline({ events }: OrderTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
  );

  return (
    <div className="relative pl-6 space-y-6">
      {/* vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      {sorted.map((event, i) => {
        const config = STATUS_CONFIG[event.status] || { icon: Clock, color: 'text-muted-foreground' };
        const Icon = config.icon;
        const isLast = i === sorted.length - 1;

        return (
          <div key={event.id} className="relative flex gap-3">
            <div className={cn(
              'absolute -left-6 flex items-center justify-center h-6 w-6 rounded-full bg-background border-2 border-border z-10',
              isLast && 'border-primary'
            )}>
              <Icon className={cn('h-3.5 w-3.5', config.color, config.spin && 'animate-spin')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{event.message || event.status}</p>
              {event.created_at && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
