import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '{{.SiteName}}'
const PRIMARY_COLOR = '#e03354'

interface Props {
  customerName?: string
  orderNumber?: string
  recipientType?: string
}

const PedidoCanceladoEmail = ({ customerName, orderNumber, recipientType }: Props) => {
  const isAdmin = recipientType === 'admin'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Pedido {orderNumber} cancelado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{SITE_NAME}</Heading>
          <Hr style={hr} />
          <Heading as="h2" style={h2}>Pedido Cancelado</Heading>
          {isAdmin ? (
            <>
              <Text style={text}>O pedido <strong>{orderNumber}</strong> do cliente <strong>{customerName || 'Cliente'}</strong> foi cancelado.</Text>
              <Text style={text}>Verifique os detalhes no painel administrativo.</Text>
            </>
          ) : (
            <>
              <Text style={text}>Olá {customerName || 'Cliente'},</Text>
              <Text style={text}>Seu pedido <strong>{orderNumber}</strong> foi cancelado.</Text>
              <Text style={text}>Caso tenha alguma dúvida, entre em contato conosco.</Text>
            </>
          )}
          <Text style={footer}>Equipe {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PedidoCanceladoEmail,
  subject: (data: Record<string, any>) => `Pedido ${data?.orderNumber || ''} cancelado`,
  displayName: 'Pedido cancelado',
  previewData: { customerName: 'Maria Silva', orderNumber: 'SM-2026-0001', recipientType: 'customer' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: PRIMARY_COLOR, margin: '0 0 10px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '1px' }
const h2 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '20px 0 10px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#eeeeee', margin: '10px 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eeeeee', paddingTop: '15px' }
