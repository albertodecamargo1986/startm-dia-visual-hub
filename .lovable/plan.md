

# Layout Base e Navegação — StartMídia

## Resumo
Reescrever Header, Footer, WhatsApp button e CartButton com todas as funcionalidades solicitadas. Atualizar AuthContext e CartContext com campos/métodos adicionais.

## Arquivos a criar/modificar

### 1. `src/types/index.ts` — Atualizar CartItem
Adicionar campos `id`, `notes`, `needsArtwork` ao CartItem.

### 2. `src/contexts/AuthContext.tsx` — Expandir interface
- Adicionar `isSuperAdmin` boolean
- Adicionar métodos `login(email, password)`, `register(data)`, `updateProfile(data)`
- `logout` como alias de `signOut`

### 3. `src/contexts/CartContext.tsx` — Expandir com novos campos
- Gerar `id` (uuid) para cada item
- Persistir `notes`, `needsArtwork` nos itens
- Exportar `subtotal` como alias de `total`

### 4. `src/components/layout/Header.tsx` — Reescrever completo
- Logo "STARTMÍDIA" em Bebas Neue com tagline "Comunicação Visual"
- Nav desktop: Home, Produtos, Portfolio, Sobre, Contato
- Botão busca com input expansível (toggle state)
- CartButton integrado (ícone + badge via useCart)
- Conta: se logado, avatar com DropdownMenu contendo nome, Meus Pedidos, Meus Arquivos, Meu Perfil, Painel Admin (se admin), Sair. Se não logado, botão "Entrar"
- Menu hamburguer mobile com Sheet lateral contendo todos os links + ações de conta

### 5. `src/components/CartButton.tsx` — Novo componente
- Ícone carrinho com badge
- Ao clicar, abre Sheet (drawer lateral) com lista de itens do carrinho, subtotal, botões remover, link "Finalizar Compra" para /checkout ou /carrinho

### 6. `src/components/layout/Footer.tsx` — Reescrever com 4 colunas
- **Empresa**: Logo + descrição + ícones redes sociais (Instagram, Facebook, WhatsApp) via SettingsContext
- **Produtos**: Links para cada categoria (buscar do banco via react-query)
- **Atendimento**: WhatsApp clicável, telefones, e-mail, horário
- **Links**: Sobre, Portfolio, Contato, Área do Cliente, Política de Privacidade
- Fundo `bg-secondary`, rodapé com copyright

### 7. `src/components/WhatsAppButton.tsx` → renomear/reescrever como `WhatsAppFloat`
- Botão flutuante verde, ao hover expande mostrando "Orçamento pelo WhatsApp"
- Usa `getSetting('whatsapp_number')` para link dinâmico
- Atualizar import no PublicLayout

### 8. `src/components/layout/PublicLayout.tsx` — Atualizar import do WhatsApp

## Detalhes técnicos
- Header usa `Sheet` do shadcn para menu mobile, `DropdownMenu` para conta logada
- CartButton usa `Sheet` para drawer lateral do carrinho
- WhatsApp float usa CSS transition para expandir texto no hover
- Footer busca categorias via `useQuery` para listar links de produtos
- Todos os componentes usam cores do tema (primary, secondary, muted, etc.)

