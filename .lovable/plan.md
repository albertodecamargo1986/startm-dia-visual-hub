

# Ajustes Finais e Sitemap

## Resumo
Criar sitemap.xml, atualizar robots.txt, e inserir 3 produtos de exemplo.

## Alterações

### 1. `public/sitemap.xml` — Criar
- XML com as 5 URLs principais (home, produtos, sobre, portfolio, contato) com prioridades e frequências conforme especificado

### 2. `public/robots.txt` — Reescrever
- Allow geral, Disallow /admin/, /cliente/, /checkout/
- Referência ao sitemap

### 3. Seed de produtos
- Inserir 3 produtos via insert tool: Banner Lona (banners-lonas), Adesivo Recortado (adesivos), Placa PVC (placas)
- Categorias já existem no banco com os slugs corretos

### 4. Variáveis de Edge Functions
- As secrets PAGSEGURO_EMAIL, PAGSEGURO_TOKEN, PAGSEGURO_SANDBOX e SITE_URL ainda não estão configuradas
- Usar add_secret para solicitar ao usuário os valores do PagSeguro

