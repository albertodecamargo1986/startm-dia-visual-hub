

# Observabilidade de Checkout e Pagamento

## Plano

### 1. Criar tabela `analytics_events`

Migration SQL:
```sql
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics: admin read"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Analytics: authenticated insert"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at);
```

LGPD: `user_id` is nullable (SET NULL on delete). No PII stored in metadata — only IDs, amounts, counts.

### 2. Criar helper `src/lib/analytics.ts`

Utility function `trackEvent(eventName, metadata?)` that inserts into `analytics_events` using the current auth user. Silent on error (never blocks UX).

### 3. Instrumentar eventos no frontend

| Evento | Onde | Metadata |
|---|---|---|
| `checkout_started` | `Checkout.tsx` — mount | `{ itemCount, total }` |
| `order_created` | `Checkout.tsx` — após RPC sucesso | `{ orderId, orderNumber, total }` |
| `artwork_uploaded` | `Checkout.tsx` — após upload sucesso | `{ orderId, itemId }` |
| `payment_redirected` | `Checkout.tsx` — `handlePayment` antes do redirect | `{ orderId, method: 'pagseguro' }` |
| `payment_confirmed` | `CheckoutSuccess.tsx` — mount com order válido | `{ orderId }` |

### 4. Criar página admin `AdminAnalytics.tsx`

Nova rota `/admin/analytics` com:
- Filtro de período (7d, 30d, custom)
- KPIs de funil: checkout_started → order_created → payment_redirected → payment_confirmed
- Taxa de conversão entre etapas (%)
- Gráfico de barras do funil (recharts)
- Tabela com contagem diária por evento

### 5. Registrar no AdminLayout

Adicionar link "Analytics" no menu lateral com ícone `BarChart3`.

## Arquivos

| Arquivo | Alteração |
|---|---|
| Migration SQL | Nova tabela `analytics_events` |
| `src/lib/analytics.ts` | Novo — helper trackEvent |
| `src/pages/Checkout.tsx` | Adicionar chamadas trackEvent |
| `src/pages/CheckoutSuccess.tsx` | Adicionar trackEvent payment_confirmed |
| `src/pages/admin/AdminAnalytics.tsx` | Nova página com funil e KPIs |
| `src/pages/admin/AdminLayout.tsx` | Adicionar link Analytics |
| `src/App.tsx` | Adicionar rota /admin/analytics |

