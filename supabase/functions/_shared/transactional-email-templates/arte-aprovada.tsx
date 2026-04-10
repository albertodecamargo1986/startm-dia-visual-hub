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
}

const ArteAprovadaEmail = ({ customerName, orderNumber }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Arte aprovada — pedido {orderNumber} em produção!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{SITE_NAME}</Heading>
        <Hr style={hr} />
        <Heading as="h2" style={h2}>Arte Aprovada! 🎉</Heading>
        <Text style={text}>Olá {customerName || 'Cliente'},</Text>
        <Text style={text}>Sua arte do pedido <strong>{orderNumber}</strong> foi aprovada e o pedido já está em produção!</Text>
        <Text style={text}>Você receberá uma notificação quando o pedido estiver pronto.</Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ArteAprovadaEmail,
  subject: (data: Record<string, any>) => `Arte aprovada — pedido ${data?.orderNumber || ''} em produção`,
  displayName: 'Arte aprovada',
  previewData: { customerName: 'Maria Silva', orderNumber: 'SM-2026-0001' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: PRIMARY_COLOR, margin: '0 0 10px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '1px' }
const h2 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '20px 0 10px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#eeeeee', margin: '10px 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eeeeee', paddingTop: '15px' }
