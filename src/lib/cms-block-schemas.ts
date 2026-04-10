import { z } from 'zod';

// --- Individual block schemas ---

export const heroSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  subtitle: z.string().default(''),
  background_image: z.string().default(''),
  cta_label: z.string().default(''),
  cta_link: z.string().default(''),
});

export const richTextSchema = z.object({
  content: z.string().min(1, 'Conteúdo obrigatório'),
});

export const imageSchema = z.object({
  url: z.string().min(1, 'URL obrigatória'),
  alt: z.string().min(1, 'Texto alternativo obrigatório'),
  caption: z.string().default(''),
});

export const cardItemSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().default(''),
  icon: z.string().default(''),
  image: z.string().default(''),
  link: z.string().default(''),
});

export const cardsSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().default(''),
  items: z.array(cardItemSchema).min(1, 'Adicione pelo menos 1 card'),
});

export const galleryItemSchema = z.object({
  url: z.string().min(1, 'URL obrigatória'),
  alt: z.string().min(1, 'Texto alternativo obrigatório'),
  caption: z.string().default(''),
});

export const gallerySchema = z.object({
  items: z.array(galleryItemSchema).min(1, 'Adicione pelo menos 1 imagem'),
});

export const faqItemSchema = z.object({
  question: z.string().min(1, 'Pergunta obrigatória'),
  answer: z.string().min(1, 'Resposta obrigatória'),
});

export const faqSchema = z.object({
  items: z.array(faqItemSchema).min(1, 'Adicione pelo menos 1 pergunta'),
});

export const ctaSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  text: z.string().default(''),
  button_label: z.string().min(1, 'Texto do botão obrigatório'),
  button_link: z.string().min(1, 'Link do botão obrigatório'),
});

export const spacerSchema = z.object({
  height: z.number().min(8).max(200).default(40),
});

// --- Registry ---

export const blockSchemas: Record<string, z.ZodType> = {
  hero: heroSchema,
  rich_text: richTextSchema,
  image: imageSchema,
  cards: cardsSchema,
  gallery: gallerySchema,
  faq: faqSchema,
  cta: ctaSchema,
  spacer: spacerSchema,
};

export const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero Banner', icon: '🖼️' },
  { value: 'rich_text', label: 'Texto Rico', icon: '📝' },
  { value: 'image', label: 'Imagem', icon: '🏞️' },
  { value: 'cards', label: 'Cards', icon: '🃏' },
  { value: 'gallery', label: 'Galeria', icon: '🖼️' },
  { value: 'faq', label: 'FAQ', icon: '❓' },
  { value: 'cta', label: 'Call to Action', icon: '📢' },
  { value: 'spacer', label: 'Espaçador', icon: '↕️' },
] as const;

export const defaultBlockData: Record<string, Record<string, unknown>> = {
  hero: { title: '', subtitle: '', background_image: '', cta_label: '', cta_link: '' },
  rich_text: { content: '' },
  image: { url: '', alt: '', caption: '' },
  cards: { title: '', subtitle: '', items: [{ title: '', description: '', icon: '', image: '', link: '' }] },
  gallery: { items: [{ url: '', alt: '', caption: '' }] },
  faq: { items: [{ question: '', answer: '' }] },
  cta: { title: '', text: '', button_label: '', button_link: '' },
  spacer: { height: 40 },
};

export function validateBlock(type: string, data: unknown): { valid: boolean; errors: string[] } {
  const schema = blockSchemas[type];
  if (!schema) return { valid: true, errors: [] };
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, errors: [] };
  return { valid: false, errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) };
}

export type BlockType = (typeof BLOCK_TYPES)[number]['value'];
