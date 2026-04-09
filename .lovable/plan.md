

# Corrigir Logo Não Aparecendo no Site

## Problema
O `LogoUploadManager` faz upload das imagens para o storage e mostra "Todas as variações da logo foram salvas!", mas as URLs nunca sao gravadas na tabela `site_settings`. O `handleLogoSaved` apenas atualiza o state local. O usuario precisaria clicar "Salvar Configuracoes" manualmente, e mesmo assim, o save so faz update em keys existentes — as novas keys (footer, mobile, favicon) nao existem no banco, entao o insert so roda se `values[key]` for truthy, o que depende do timing.

## Solucao
Fazer o `LogoUploadManager` salvar diretamente no banco apos o upload, sem depender do botao "Salvar Configuracoes".

### `src/components/admin/LogoUploadManager.tsx`
- No `handleSaveAll`, apos fazer upload de cada variacao para o storage, fazer upsert direto na tabela `site_settings` para cada key (site_logo_url, site_logo_footer, site_logo_mobile, site_logo_favicon)
- Usar logica: tentar update, se nao encontrou row, fazer insert
- Apos salvar, chamar `onSaved(urls)` e tambem invalidar a query `site-settings` para que o Header/Footer atualizem imediatamente

### `src/pages/admin/AdminSettings.tsx`
- Passar `queryClient` ou adicionar invalidacao no `handleLogoSaved` para garantir que o contexto de settings recarrega

## Resultado
Ao clicar "Gerar e Salvar Todas as Versoes" no LogoUploadManager, as URLs serao persistidas imediatamente no banco e a logo aparecera no site sem precisar clicar outro botao.

