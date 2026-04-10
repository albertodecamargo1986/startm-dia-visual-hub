

# Fix: Race condition no AuthContext — loading vs fetchProfile

## Problema
`setLoading(false)` é chamado imediatamente após `setSession`, antes de `fetchProfile` resolver. O `RequireAdmin` vê `loading=false` + `isAdmin=false` e redireciona o admin para `/` antes dos roles carregarem.

## Alteração

### `src/contexts/AuthContext.tsx` — Substituir useEffect (linhas 44–64)
- Criar função `syncSession` que faz `await fetchProfile()` antes de `setLoading(false)`
- Adicionar flag `isMounted` para evitar state updates após unmount
- Remover o `setTimeout` que desacoplava fetchProfile do fluxo
- `getSession` inicial: aguardar `syncSession` antes de liberar loading
- `onAuthStateChange`: chamar `syncSession` que também aguarda profile

Nenhuma outra alteração no arquivo.

