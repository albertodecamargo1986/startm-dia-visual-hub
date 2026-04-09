

# Verificação de Email em Tempo Real + Norma Brasileira

## Resumo
Duas frentes: (1) criar fluxo pos-cadastro com pagina de espera que verifica email em tempo real, e (2) criar helper `formatBRL` e padronizar formatacao brasileira de moeda e datas em todo o site.

## Parte 1 — Fluxo de Verificacao de Email

### `src/pages/EmailVerification.tsx` — Criar
- Pagina com animacao de envelope/loading
- Texto: "Enviamos um link de verificacao para {email}. Verifique sua caixa de entrada."
- Botao "Reenviar email" com cooldown de 60s
- Polling a cada 5s: `supabase.auth.getSession()` — se sessao existir e email confirmado, redireciona para pagina de obrigado
- Tambem escuta `onAuthStateChange` para deteccao instantanea quando usuario clica no link em outra aba
- Se nao tiver email no state, redireciona para `/login`

### `src/pages/EmailVerified.tsx` — Criar
- Pagina de "Obrigado! Sua conta foi verificada."
- Icone CheckCircle2 verde animado
- Texto: "Bem-vindo a StartMidia! Sua conta foi ativada com sucesso."
- Botao "Acessar Minha Conta" → `/cliente`
- Auto-redirect apos 5s

### `src/pages/Login.tsx` — Modificar
- Apos `signUp` com sucesso, fazer `navigate('/verificar-email', { state: { email: signupForm.email } })` em vez de apenas toast

### `src/App.tsx` — Adicionar rotas
- `/verificar-email` → `EmailVerification`
- `/email-verificado` → `EmailVerified`
- Ambas como rotas publicas dentro do `PublicLayout`

## Parte 2 — Norma Brasileira (BRL + Datas)

### `src/lib/format.ts` — Criar
- `formatBRL(value: number): string` → `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)` → "R$ 25,00"
- `formatDate(date: string | Date): string` → `new Intl.DateTimeFormat('pt-BR').format(...)` → "09/04/2026"
- `formatDateTime(date: string | Date): string` → data + hora → "09/04/2026 14:30"

### Substituir em ~15 arquivos
Trocar todos os padroes `R$ ${value.toFixed(2).replace('.', ',')}` por `formatBRL(value)` e `new Date(x).toLocaleDateString('pt-BR')` por `formatDate(x)` nos seguintes arquivos:
- `CartPage.tsx`, `Checkout.tsx`, `CheckoutSuccess.tsx`, `Shop.tsx`, `ProductDetail.tsx`
- `ClientOrders.tsx`, `ClientOrderDetail.tsx`, `ClientFiles.tsx`, `ClientDashboard.tsx`
- `AdminOrders.tsx`, `AdminOrderDetail.tsx`, `AdminDashboard.tsx`, `AdminClients.tsx`, `AdminFiles.tsx`, `AdminProducts.tsx`

## Detalhes tecnicos
- Polling via `setInterval` com cleanup no `useEffect`
- `supabase.auth.resend({ type: 'signup', email })` para reenvio
- `Intl.NumberFormat('pt-BR')` e norma ABNT para valores monetarios
- Nenhuma migration necessaria

