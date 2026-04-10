import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '{{.SiteName}}'
const PRIMARY_COLOR = '#e03354'

interface Props {
  customerName?: string
  orderNumber?: string
  recipientType?: string
}

const PedidoCriadoEmail = ({ customerName, orderNumber, recipientType }: Props) => {
  const isAdmin = recipientType === 'admin'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{isAdmin ? `Novo pedido ${orderNumber}` : `Pedido ${orderNumber} recebido!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{SITE_NAME}</Heading>
          <Hr style={hr} />
          {isAdmin ? (
            <>
              <Heading as="h2" style={h2}>Novo Pedido Recebido</Heading>
              <Text style={text}>O cliente <strong>{customerName || 'Cliente'}</strong> realizou o pedido <strong>{orderNumber}</strong>.</Text>
              <Text style={text}>Acesse o painel administrativo para visualizar os detalhes.</Text>
            </>
          ) : (
            <>
              <Heading as="h2" style={h2}>Pedido Recebido!</Heading>
              <Text style={text}>Olá {customerName || 'Cliente'},</Text>
              <Text style={text}>Seu pedido <strong>{orderNumber}</strong> foi recebido com sucesso! Estamos aguardando a confirmação do pagamento.</Text>
              <Text style={text}>Acompanhe o status do seu pedido pelo painel do cliente.</Text>
            </>
          )}
          <Text style={footer}>Equipe {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PedidoCriadoEmail,
  subject: (data: Record<string, any>) =>
    data?.recipientType === 'admin'
      ? `Novo pedido ${data?.orderNumber || ''}`
      : `Pedido ${data?.orderNumber || ''} recebido!`,
  displayName: 'Pedido criado',
  previewData: { customerName: 'Maria Silva', orderNumber: 'SM-2026-0001', recipientType: 'customer' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: PRIMARY_COLOR, margin: '0 0 10px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '1px' }
const h2 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '20px 0 10px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#eeeeee', margin: '10px 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eeeeee', paddingTop: '15px' }
