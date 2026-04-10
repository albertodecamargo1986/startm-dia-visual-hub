import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, TrendingUp } from 'lucide-react';

const FUNNEL_STEPS = [
  { key: 'checkout_started', label: 'Checkout Iniciado' },
  { key: 'order_created', label: 'Pedido Criado' },
  { key: 'payment_redirected', label: 'Pagamento Redirecionado' },
  { key: 'payment_confirmed', label: 'Pagamento Confirmado' },
] as const;

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
];

type EventRow = { event_name: string; created_at: string };

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - Number(period));

      const { data } = await (supabase as any)
        .from('analytics_events')
        .select('event_name, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      setEvents((data as EventRow[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, [period]);

  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });

    return FUNNEL_STEPS.map((step, i) => {
      const count = counts[step.key] || 0;
      const prev = i > 0 ? counts[FUNNEL_STEPS[i - 1].key] || 0 : count;
      const rate = prev > 0 ? Math.round((count / prev) * 100) : 0;
      return { ...step, count, rate, dropOff: prev > 0 ? 100 - rate : 0 };
    });
  }, [events]);

  const dailyData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    events.forEach(e => {
      const day = e.created_at.slice(0, 10);
      if (!map[day]) map[day] = {};
      map[day][e.event_name] = (map[day][e.event_name] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }, [events]);

  const totalCheckouts = funnelData[0]?.count || 0;
  const totalConfirmed = funnelData[3]?.count || 0;
  const overallRate = totalCheckouts > 0 ? Math.round((totalConfirmed / totalCheckouts) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Analytics do Funil</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Checkouts Iniciados</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalCheckouts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pagamentos Confirmados</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalConfirmed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Taxa de Conversão</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{overallRate}%</p></CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader><CardTitle>Funil de Conversão</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 13 }} />
                <Tooltip formatter={(value: number) => [value, 'Eventos']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Drop-off table */}
      <Card>
        <CardHeader><CardTitle>Taxas por Etapa</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Abandono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelData.map((step, i) => (
                <TableRow key={step.key}>
                  <TableCell className="font-medium">{step.label}</TableCell>
                  <TableCell className="text-right">{step.count}</TableCell>
                  <TableCell className="text-right">{i === 0 ? '—' : `${step.rate}%`}</TableCell>
                  <TableCell className="text-right">
                    {i === 0 ? '—' : (
                      <span className={step.dropOff > 50 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        <ArrowDown className="w-3 h-3 inline mr-1" />{step.dropOff}%
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily breakdown */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Eventos Diários</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    {FUNNEL_STEPS.map(s => (
                      <TableHead key={s.key} className="text-right">{s.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map(row => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      {FUNNEL_STEPS.map(s => (
                        <TableCell key={s.key} className="text-right">
                          {(row as Record<string, unknown>)[s.key] as number || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalytics;
