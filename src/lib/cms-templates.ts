// CMS page templates – each returns an array of section stubs
export interface TemplateSectionStub {
  type: string;
  name: string;
  data: Record<string, unknown>;
}

export interface PageTemplate {
  id: string;
  label: string;
  description: string;
  sections: TemplateSectionStub[];
}

export const PAGE_TYPES = [
  { id: 'institutional', label: 'Institucional', description: 'Páginas fixas como Sobre, Privacidade, Termos.' },
  { id: 'landing', label: 'Landing Page', description: 'Página de conversão com hero e CTA.' },
  { id: 'campaign', label: 'Campanha', description: 'Página temporária para promoções ou eventos.' },
] as const;

export type PageType = (typeof PAGE_TYPES)[number]['id'];

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    label: 'Em branco',
    description: 'Comece do zero, sem blocos pré-definidos.',
    sections: [],
  },
  {
    id: 'hero_cards',
    label: 'Hero + Cards',
    description: 'Banner principal seguido de cards de destaque.',
    sections: [
      { type: 'hero', name: 'Banner Principal', data: { title: '', subtitle: '', background_image: '', cta_label: '', cta_link: '' } },
      { type: 'cards', name: 'Cards de Destaque', data: { title: 'Destaques', subtitle: '', items: [{ title: 'Card 1', description: '', icon: '', image: '', link: '' }] } },
      { type: 'cta', name: 'Chamada para Ação', data: { title: '', text: '', button_label: 'Saiba mais', button_link: '' } },
    ],
  },
  {
    id: 'contact',
    label: 'Contato',
    description: 'Página de contato com informações e CTA.',
    sections: [
      { type: 'hero', name: 'Cabeçalho', data: { title: 'Entre em Contato', subtitle: 'Estamos prontos para atendê-lo', background_image: '', cta_label: '', cta_link: '' } },
      { type: 'rich_text', name: 'Informações', data: { content: '<p>Preencha o formulário ou entre em contato pelos nossos canais.</p>' } },
      { type: 'cta', name: 'WhatsApp', data: { title: 'Prefere WhatsApp?', text: 'Fale conosco agora mesmo.', button_label: 'Abrir WhatsApp', button_link: '' } },
    ],
  },
  {
    id: 'about',
    label: 'Sobre',
    description: 'Página institucional com história e valores.',
    sections: [
      { type: 'hero', name: 'Cabeçalho', data: { title: 'Sobre Nós', subtitle: 'Conheça nossa história', background_image: '', cta_label: '', cta_link: '' } },
      { type: 'rich_text', name: 'Nossa História', data: { content: '<p>Conte a história da sua empresa aqui.</p>' } },
      { type: 'cards', name: 'Valores', data: { title: 'Nossos Valores', subtitle: '', items: [{ title: 'Qualidade', description: '', icon: '', image: '', link: '' }, { title: 'Inovação', description: '', icon: '', image: '', link: '' }] } },
      { type: 'cta', name: 'CTA', data: { title: 'Vamos conversar?', text: '', button_label: 'Fale conosco', button_link: '/contato' } },
    ],
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Página de perguntas frequentes.',
    sections: [
      { type: 'hero', name: 'Cabeçalho', data: { title: 'Perguntas Frequentes', subtitle: '', background_image: '', cta_label: '', cta_link: '' } },
      { type: 'faq', name: 'FAQ', data: { items: [{ question: 'Pergunta exemplo?', answer: 'Resposta exemplo.' }] } },
      { type: 'cta', name: 'CTA', data: { title: 'Não encontrou sua resposta?', text: '', button_label: 'Fale conosco', button_link: '/contato' } },
    ],
  },
];
