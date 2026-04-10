

# Fix: Logos PNG com fundo transparente

## Diagnóstico

O código já foi corrigido anteriormente — tanto o `ImageEditor` quanto o `LogoUploadManager` já exportam em PNG. O problema é que **as logos atualmente salvas no banco foram geradas antes da correção** (quando o editor ainda usava JPEG, que não suporta transparência).

## Ação necessária

### 1. Verificar e limpar qualquer resquício — sem alteração de código

O código atual (`image-editor.tsx` linha 89-95 e `LogoUploadManager.tsx` linha 73) já usa `image/png`. Não há alteração de código necessária.

### 2. Orientação ao administrador

O admin precisa **re-enviar a logo original** pela tela de Configurações → Identidade Visual para que as novas variações sejam geradas corretamente em PNG com transparência.

### Alternativa: se preferir, posso forçar a regeração

Se quiser, posso adicionar um botão "Regenerar logos" na tela de settings que busca a logo atual do storage, reprocessa todas as variações em PNG transparente e substitui as URLs no banco — sem precisar re-upload manual.

