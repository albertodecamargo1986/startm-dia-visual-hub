

# Checkout Completo com PagSeguro

## Resumo
Reescrever o checkout com 4 steps visuais (Dados → Arte → Pagamento → Confirmação), integração ViaCEP para autocomplete de endereço, upload de arte para itens que necessitam, e integração PagSeguro via duas Edge Functions. Reescrever página de sucesso com status em tempo real.

## Arquivos a criar/modificar

### 1. `src/pages/Checkout.tsx` — Reescrever completamente
- **Stepper visual** no topo: 4 steps com ícones e linha de progresso
- **Step 1 — Dados**: pré-preenche nome, email, telefone, CPF/CNPJ do profile. CEP com fetch automático para `viacep.com.br/ws/{cep}/json/` que preenche rua, bairro, cidade, estado. Campo número, complemento manuais.
- **Step 2 — Envio de Arte**: lista itens com `needsArtwork=true`. Para cada: área de drag-and-drop upload (aceita PDF/AI/CDR/PNG/JPG, max 50MB), barra de progresso, preview do arquivo, botão "Guia de Medidas" (Dialog), opção "Solicitar arte da StartMídia" (link WhatsApp). Upload vai para bucket `artwork-files` path `{userId}/{orderId}/{filename}`. Registra em `customer_files`. Skip automático se nenhum item precisa de arte.
- **Step 3 — Pagamento**: resumo do pedido, botão "Pagar com PagSeguro" que chama edge function `create-pagseguro-payment` e redireciona para URL do PagSeguro.
- **Step 4**: não renderiza (usuário já foi redirecionado)
- Criar pedido no banco ao avançar do Step 1 para Step 2 (para ter `orderId` para uploads)
- Sidebar com resumo do pedido fixa em todas as steps

### 2. `src/pages/CheckoutSuccess.tsx` — Reescrever
- Recebe `?order=orderId` da URL
- Busca pedido e status em tempo real (subscribe realtime no `orders`)
- Animação de check com framer-motion
- Mostra número do pedido, resumo, status de pagamento atualizado
- Próximos passos (enviar arte, aguardar produção)
- Botão "Acompanhar Pedido" → `/cliente/pedidos/{id}`

### 3. `supabase/functions/create-pagseguro-payment/index.ts` — Criar
- Recebe `{ orderId }` no body
- Valida JWT do usuário
- Busca pedido com items e profile via service role
- Monta XML do PagSeguro (checkout v2)
- Envia para API PagSeguro (sandbox ou produção via env `PAGSEGURO_SANDBOX`)
- Extrai código de checkout da resposta
- Salva `payment_id` no pedido
- Retorna `{ redirectUrl }` para o frontend
- CORS headers incluídos

### 4. `supabase/functions/pagseguro-webhook/index.ts` — Criar
- Recebe POST do PagSeguro com `notificationCode`
- Consulta detalhes da transação na API PagSeguro
- Mapeia status PagSeguro (3/4=pago, 6/7=cancelado) para status interno
- Atualiza `orders.payment_status` e `orders.status`
- Insere evento no `order_timeline`
- Retorna 200 OK
- Sem verificação JWT (é webhook externo)

### 5. Secrets necessários (via add_secret)
- `PAGSEGURO_EMAIL` — email da conta PagSeguro
- `PAGSEGURO_TOKEN` — token da conta PagSeguro
- `PAGSEGURO_SANDBOX` — "true" ou "false"
- `SITE_URL` — URL do site para redirect

### 6. Realtime — Migration
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;` para status em tempo real na página de sucesso

## Detalhes técnicos
- ViaCEP: `fetch('https://viacep.com.br/ws/${cep.replace(/\D/g,'')}/json/')` no onBlur do campo CEP
- Upload: `supabase.storage.from('artwork-files').upload(path, file, { onUploadProgress })` com barra via Progress do shadcn
- Stepper: componente inline com divs circulares numeradas + linha entre elas, step ativo = `bg-primary`
- Edge functions usam `corsHeaders` para chamadas do frontend
- Pedido criado no Step 1, atualizado nos steps seguintes
- `order_items` inclui `notes` do item do carrinho

