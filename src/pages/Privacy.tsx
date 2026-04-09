import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/contexts/SettingsContext';

const defaultContent = `# Política de Privacidade

**Última atualização:** Abril de 2026

A StartMídia Comunicação Visual ("nós", "nosso") está comprometida com a proteção dos dados pessoais de seus clientes, parceiros e visitantes do site, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).

## 1. Dados que Coletamos
- Dados de identificação: nome completo, CPF/CNPJ, e-mail, telefone.
- Dados de endereço: endereço completo para entrega de produtos.
- Dados de navegação: cookies, endereço IP, páginas visitadas.
- Dados de transação: informações de pedidos, histórico de compras.
- Arquivos enviados: artes e arquivos de referência enviados para produção.

## 2. Finalidade do Tratamento
- Processar e entregar pedidos realizados em nossa loja.
- Comunicar sobre o andamento de pedidos e produção.
- Enviar orçamentos e propostas comerciais solicitadas.
- Emitir notas fiscais e cumprir obrigações legais e fiscais.
- Melhorar nossos produtos, serviços e experiência do usuário.

## 3. Seus Direitos (LGPD Art. 18)
- Confirmar a existência de tratamento de dados.
- Acessar seus dados pessoais.
- Corrigir dados incompletos, inexatos ou desatualizados.
- Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.
- Revogar o consentimento a qualquer momento.

## 4. Contato
Para exercer seus direitos ou esclarecer dúvidas, entre em contato pelos nossos canais de atendimento.`;

const Privacy = () => {
  const { getSetting } = useSettings();
  const content = getSetting('privacy_content') || defaultContent;

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | StartMídia Comunicação Visual</title>
        <meta name="description" content="Política de privacidade da StartMídia Comunicação Visual. Saiba como tratamos seus dados pessoais conforme a LGPD." />
      </Helmet>

      <div className="container py-12 max-w-4xl prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    </>
  );
};

export default Privacy;
