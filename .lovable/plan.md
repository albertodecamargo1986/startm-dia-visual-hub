

# Fix: Logo com fundo preto — ImageEditor converte para JPEG

## Problema
O `ImageEditor` (image-editor.tsx) salva a imagem editada como **JPEG** (`image/jpeg`), que não suporta transparência. Qualquer PNG com fundo transparente perde a transparência e fica com fundo preto.

## Alterações

### 1. `src/components/ui/image-editor.tsx` (~linha 89-95)
- Alterar `canvas.toBlob` para usar `image/png` em vez de `image/jpeg`
- Alterar o nome do arquivo de `edited-image.jpg` para `edited-image.png`
- Remover o parâmetro de qualidade (não se aplica a PNG)

### 2. `src/components/admin/LogoUploadManager.tsx` — preview backgrounds (~linha 226)
- Usar fundo com padrão xadrez (checkerboard) para as previews, para que o admin possa ver a transparência corretamente, em vez de `#f5f5f5` sólido que esconde a transparência

## Resultado
Logos PNG manterão fundo transparente ao passar pelo editor de imagem e ao serem redimensionadas nas variações.

