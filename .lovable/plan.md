

# Tipagem forte — Remoção de `any` nos fluxos críticos

## Alterações

### 1. `src/types/index.ts` — Adicionar interfaces

```typescript
// Location state types
export interface LoginLocationState {
  from?: { pathname: string };
}

export interface EmailVerificationLocationState {
  email: string;
}

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}
```

### 2. `src/pages/Login.tsx` (linha 32)
- De: `(location.state as any)?.from?.pathname || '/cliente'`
- Para: `(location.state as LoginLocationState | null)?.from?.pathname || '/cliente'`

### 3. `src/pages/EmailVerification.tsx` (linha 14)
- De: `(location.state as any)?.email`
- Para: `(location.state as EmailVerificationLocationState | null)?.email`

### 4. `src/pages/CheckoutSuccess.tsx`
- Substituir `useState<any>(null)` por `useState<Order | null>(null)` (usando tipo `Order` de `@/types`)
- Substituir `useState<any[]>([])` por `useState<OrderItem[]>([])`
- No callback realtime (linha 43): tipar `prev` como `Order | null` em vez de `any`

### 5. `src/pages/client/ClientProfile.tsx` (linha 46)
- De: `(profile as any).default_address as AddressData | null`
- Para: `(profile?.default_address as unknown as AddressData) ?? null` — o tipo `Json` do Supabase requer cast via `unknown`
- Remover a interface `AddressData` local (já definida em `types/index.ts`)

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/types/index.ts` | Adiciona `LoginLocationState`, `EmailVerificationLocationState`, `AddressData` |
| `src/pages/Login.tsx` | Cast tipado na linha 32 |
| `src/pages/EmailVerification.tsx` | Cast tipado na linha 14 |
| `src/pages/CheckoutSuccess.tsx` | `Order` e `OrderItem` em vez de `any` |
| `src/pages/client/ClientProfile.tsx` | Usa `AddressData` de types, remove cast `as any` |

