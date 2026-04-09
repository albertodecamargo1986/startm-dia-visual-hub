import { Helmet } from 'react-helmet-async';

const Privacy = () => (
  <>
    <Helmet>
      <title>Política de Privacidade | StartMídia Comunicação Visual</title>
      <meta name="description" content="Política de privacidade da StartMídia Comunicação Visual. Saiba como tratamos seus dados pessoais conforme a LGPD." />
    </Helmet>

    <div className="container py-12 max-w-4xl prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
      <h1>Política de Privacidade</h1>
      <p><strong>Última atualização:</strong> Abril de 2026</p>

      <p>
        A StartMídia Comunicação Visual ("nós", "nosso") está comprometida com a proteção dos dados pessoais de
        seus clientes, parceiros e visitantes do site, em conformidade com a Lei Geral de Proteção de Dados
        Pessoais (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Dados que Coletamos</h2>
      <p>Podemos coletar os seguintes dados pessoais:</p>
      <ul>
        <li><strong>Dados de identificação:</strong> nome completo, CPF/CNPJ, e-mail, telefone.</li>
        <li><strong>Dados de endereço:</strong> endereço completo para entrega de produtos.</li>
        <li><strong>Dados de navegação:</strong> cookies, endereço IP, páginas visitadas, tempo de permanência.</li>
        <li><strong>Dados de transação:</strong> informações de pedidos, histórico de compras, dados de pagamento (processados por terceiros).</li>
        <li><strong>Arquivos enviados:</strong> artes e arquivos de referência enviados para produção.</li>
      </ul>

      <h2>2. Finalidade do Tratamento</h2>
      <p>Utilizamos seus dados para:</p>
      <ul>
        <li>Processar e entregar pedidos realizados em nossa loja.</li>
        <li>Comunicar sobre o andamento de pedidos e produção.</li>
        <li>Enviar orçamentos e propostas comerciais solicitadas.</li>
        <li>Emitir notas fiscais e cumprir obrigações legais e fiscais.</li>
        <li>Melhorar nossos produtos, serviços e experiência do usuário.</li>
        <li>Enviar comunicações de marketing (apenas com seu consentimento).</li>
      </ul>

      <h2>3. Base Legal</h2>
      <p>O tratamento de dados é realizado com base em:</p>
      <ul>
        <li><strong>Execução de contrato:</strong> para processar e entregar seus pedidos.</li>
        <li><strong>Consentimento:</strong> para envio de comunicações de marketing.</li>
        <li><strong>Obrigação legal:</strong> para cumprimento de obrigações fiscais e regulatórias.</li>
        <li><strong>Legítimo interesse:</strong> para melhoria de nossos serviços e prevenção a fraudes.</li>
      </ul>

      <h2>4. Compartilhamento de Dados</h2>
      <p>Seus dados podem ser compartilhados com:</p>
      <ul>
        <li><strong>Processadores de pagamento:</strong> para processar transações financeiras de forma segura.</li>
        <li><strong>Serviços de entrega:</strong> para envio de produtos ao endereço informado.</li>
        <li><strong>Serviços de hospedagem e infraestrutura:</strong> para armazenamento seguro dos dados.</li>
      </ul>
      <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais para fins de marketing de terceiros.</p>

      <h2>5. Armazenamento e Segurança</h2>
      <p>
        Seus dados são armazenados em servidores seguros com criptografia e controles de acesso.
        Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado,
        perda, alteração ou divulgação indevida.
      </p>

      <h2>6. Seus Direitos (LGPD Art. 18)</h2>
      <p>Você tem direito a:</p>
      <ul>
        <li>Confirmar a existência de tratamento de dados.</li>
        <li>Acessar seus dados pessoais.</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
        <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
        <li>Solicitar a portabilidade dos dados.</li>
        <li>Revogar o consentimento a qualquer momento.</li>
        <li>Solicitar a eliminação dos dados tratados com consentimento.</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos cookies essenciais para o funcionamento do site e cookies de análise para entender
        como os visitantes interagem com nossas páginas. Você pode configurar seu navegador para
        recusar cookies, mas isso pode afetar a funcionalidade do site.
      </p>

      <h2>8. Retenção de Dados</h2>
      <p>
        Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política
        e conforme exigido por obrigações legais e regulatórias. Dados de transações são mantidos por
        no mínimo 5 anos para cumprimento de obrigações fiscais.
      </p>

      <h2>9. Contato</h2>
      <p>
        Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados pessoais,
        entre em contato conosco pelo e-mail disponível na página de contato ou através dos nossos
        canais de atendimento.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Esta política pode ser atualizada periodicamente. Recomendamos que você revise esta página
        regularmente para se manter informado sobre como protegemos seus dados.
      </p>
    </div>
  </>
);

export default Privacy;
