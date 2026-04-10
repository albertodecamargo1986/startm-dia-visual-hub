

# Prompt 9 — Recuperação de Senha + Prompt 10 — Pipeline CI

## Prompt 9: Fluxo de Reset de Senha

### Situação Atual
- `Login.tsx` já tem `handleForgotPassword` com `redirectTo: /reset-password`
- A página `/reset-password` **não existe** — usuário é redirecionado mas não há nada lá
- Rota não está registrada em `App.tsx`

### Plano

**1. Criar `src/pages/ResetPassword.tsx`**
- Detectar token de recuperação via `supabase.auth.onAuthStateChange` (evento `PASSWORD_RECOVERY`)
- Formulário com "Nova senha" + "Confirmar senha" com validação zod
- Chamar `supabase.auth.updateUser({ password })` ao submeter
- Estados visuais: carregando, token inválido/expirado, sucesso com redirect para `/login`
- Canonical tag e Helmet

**2. Atualizar `App.tsx`**
- Adicionar rota pública `/reset-password` → `<ResetPassword />`

**3. Testes básicos**
- Criar `src/pages/__tests__/ResetPassword.test.tsx`
- Testar renderização do formulário, validação de senhas diferentes, validação de senha curta

---

## Prompt 10: Pipeline CI

### Contexto
Lovable gerencia deploys internamente. Não temos acesso a criar GitHub Actions ou CI pipelines externos. O projeto já tem vitest configurado.

### O que podemos fazer
- Garantir que `npm run lint`, `npm test`, e `npm run build` funcionam corretamente
- Adicionar script `ci` no `package.json` que encadeia lint → test → build
- Isso não substitui um CI externo, mas prepara o projeto para quando o usuário exportar para GitHub

**Nota:** Lovable não suporta configuração de pipelines CI (GitHub Actions, etc.) diretamente. Se o usuário exportar o projeto, poderá usar o script `ci` como base para seu workflow.

---

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/pages/ResetPassword.tsx` | **Novo** — página de redefinição de senha |
| `src/App.tsx` | Adicionar rota `/reset-password` |
| `src/pages/__tests__/ResetPassword.test.tsx` | **Novo** — testes do fluxo |
| `package.json` | Adicionar script `"ci"` |

