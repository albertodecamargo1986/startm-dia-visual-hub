/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as pedidoCriado } from './pedido-criado.tsx'
import { template as pagamentoConfirmado } from './pagamento-confirmado.tsx'
import { template as aguardandoArte } from './aguardando-arte.tsx'
import { template as arteAprovada } from './arte-aprovada.tsx'
import { template as pedidoEnviado } from './pedido-enviado.tsx'
import { template as pedidoCancelado } from './pedido-cancelado.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'pedido-criado': pedidoCriado,
  'pagamento-confirmado': pagamentoConfirmado,
  'aguardando-arte': aguardandoArte,
  'arte-aprovada': arteAprovada,
  'pedido-enviado': pedidoEnviado,
  'pedido-cancelado': pedidoCancelado,
}
