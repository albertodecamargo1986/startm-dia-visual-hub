

# Fix: Download de arquivos no admin

## Problema
`handleDownload` tenta extrair path de URL pública, mas `file_url` agora pode ser URL assinada ou path interno. A extração falha.

## Alterações

### `src/pages/admin/AdminFiles.tsx`
- Substituir `handleDownload` por versão que detecta se é URL (abre direto) ou path interno (gera signed URL)
- Atualizar chamada para passar `f.file_name` como segundo argumento

### `src/pages/admin/AdminOrderDetail.tsx`
- Mesma substituição de `handleDownload`
- Atualizar chamada para incluir `f.file_name`

Ambas as funções usarão a mesma lógica: URLs HTTP abrem direto via `<a>` tag com download; paths internos geram signed URL via `createSignedUrl`.

