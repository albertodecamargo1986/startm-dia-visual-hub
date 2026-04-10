# Política de Backup e Plano de Recuperação

## 1. Política de Backup

### Banco de Dados
- **Frequência:** Backups automáticos diários (gerenciado pela plataforma Lovable Cloud).
- **Retenção:** 7 dias de point-in-time recovery.
- **Escopo:** Todas as tabelas públicas, funções, triggers e políticas RLS.

### Storage (Arquivos)
- **Buckets protegidos:** `customer-files`, `artwork-files` (privados, com RLS).
- **Buckets públicos:** `product-images`, `banners`.
- **Backup:** Os arquivos de storage são armazenados de forma redundante pela plataforma.

### Edge Functions
- **Versionamento:** Código-fonte no repositório Git. Qualquer versão pode ser reimplantada via deploy.

---

## 2. Verificação de Integridade

### Health Check Automático
- **Edge function:** `health-check` executa verificações de:
  - Conectividade com o banco de dados
  - Contagem de registros em tabelas críticas (orders, profiles, products)
  - Acessibilidade dos buckets de storage
  - Atividade recente (pedidos nos últimos 30 dias)
- **Frequência:** Semanal (cron job) + execução manual via painel admin.
- **Resultado:** Gravado na tabela `health_checks` com status `healthy`, `degraded` ou `unhealthy`.

### Alertas
- Se o status for `degraded` ou `unhealthy`, uma notificação é enfileirada para o administrador via `notifications_queue`.

---

## 3. Checklist de Restore

### Pré-requisitos
- [ ] Acesso ao painel Lovable Cloud
- [ ] Identificar o ponto de restauração desejado (data/hora)
- [ ] Comunicar equipe sobre janela de manutenção

### Procedimento de Restore do Banco
1. [ ] Acessar o painel de gerenciamento do backend
2. [ ] Navegar até a seção de backups
3. [ ] Selecionar o ponto de restauração mais recente antes do incidente
4. [ ] Iniciar o processo de restore
5. [ ] Aguardar confirmação de conclusão
6. [ ] Executar health check manual para validar integridade
7. [ ] Verificar tabelas críticas: `orders`, `profiles`, `products`, `order_items`
8. [ ] Verificar que as RLS policies estão ativas

### Procedimento de Restore de Storage
1. [ ] Verificar acessibilidade dos buckets via health check
2. [ ] Se bucket inacessível, contatar suporte da plataforma
3. [ ] Validar que arquivos de clientes estão acessíveis

### Procedimento de Restore de Edge Functions
1. [ ] Identificar a versão correta no Git
2. [ ] Fazer deploy via Lovable (automático no push)
3. [ ] Testar cada function com `curl` ou via painel

---

## 4. Plano de Rollback para Migrações

### Antes de aplicar uma migração
- [ ] Revisar o SQL da migração
- [ ] Garantir que a migração é reversível (preparar SQL de rollback)
- [ ] Testar em ambiente de staging primeiro (se disponível)

### Em caso de falha
1. [ ] Identificar a migração problemática
2. [ ] Aplicar o SQL de rollback manualmente
3. [ ] Se rollback não for possível, restaurar backup do banco
4. [ ] Reverter o código no Git para a versão anterior
5. [ ] Redeployar edge functions da versão anterior

### Exemplos de rollback
```sql
-- Rollback de criação de tabela
DROP TABLE IF EXISTS public.nova_tabela;

-- Rollback de adição de coluna
ALTER TABLE public.tabela DROP COLUMN IF EXISTS nova_coluna;

-- Rollback de política RLS
DROP POLICY IF EXISTS "Nome da policy" ON public.tabela;
```

---

## 5. Contatos e Responsáveis

| Papel | Responsabilidade |
|---|---|
| Admin do sistema | Monitorar health checks, executar verificações manuais |
| Desenvolvedor | Aplicar migrações, rollbacks, deploy de functions |
| Suporte plataforma | Restore de banco/storage em caso de falha grave |

---

## 6. Periodicidade de Revisão

- **Mensal:** Revisar resultados dos health checks
- **Trimestral:** Testar procedimento de restore completo
- **A cada deploy:** Garantir que rollback é possível
