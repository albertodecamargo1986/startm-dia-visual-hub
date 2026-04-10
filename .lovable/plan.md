

# Plano: Remover download de PDF do painel do cliente

O download/exportação de PDF deve ser exclusivo do painel administrativo. O cliente pode criar e editar etiquetas, mas não pode baixar o resultado.

## Mudanças

### `src/pages/client/LabelEditor.tsx`
1. **Remover o botão "Exportar PDF"** da toolbar (linha ~962-964 — botão com ícone `Download`)
2. **Remover o dialog de exportação** (linhas ~1314-1331 — `showExportDialog`)
3. **Remover estados e função relacionados**: `showExportDialog`, `includeBleed`, `includeCutMarks`, `handleExportPDF` (linhas ~228, ~599-612)
4. **Remover import** de `exportLabelPDF` (linha 27) e `Download` do lucide-react (linha 16)

O painel admin (`AdminLabelProjects.tsx`) já possui o botão de export PDF e continuará funcionando normalmente.

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — remoção de ~30 linhas (botão, dialog, função, estados, import)

## Sem mudanças
- Banco de dados, RLS, edge functions — nada muda
- `AdminLabelProjects.tsx` — mantém export PDF intacto

