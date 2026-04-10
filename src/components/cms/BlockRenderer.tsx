import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type Data = Record<string, unknown>;

interface BlockRendererProps {
  type: string;
  data: Data;
}

export const BlockRenderer = ({ type, data }: BlockRendererProps) => {
  switch (type) {
    case 'hero': return <HeroBlock data={data} />;
    case 'rich_text': return <RichTextBlock data={data} />;
    case 'image': return <ImageBlock data={data} />;
    case 'cards': return <CardsBlock data={data} />;
    case 'gallery': return <GalleryBlock data={data} />;
    case 'faq': return <FaqBlock data={data} />;
    case 'cta': return <CtaBlock data={data} />;
    case 'spacer': return <SpacerBlock data={data} />;
    default: return null;
  }
};

// ── Hero ──
const HeroBlock = ({ data }: { data: Data }) => {
  const title = (data.title as string) || '';
  const subtitle = (data.subtitle as string) || '';
  const bg = (data.background_image as string) || '';
  const ctaLabel = (data.cta_label as string) || '';
  const ctaLink = (data.cta_link as string) || '';

  return (
    <section
      className="relative flex items-center justify-center min-h-[360px] md:min-h-[480px] bg-muted overflow-hidden"
      style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {bg && <div className="absolute inset-0 bg-background/60" />}
      <div className="relative z-10 text-center px-4 py-16 max-w-3xl mx-auto">
        {title && <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>}
        {subtitle && <p className="text-lg md:text-xl text-muted-foreground mb-6">{subtitle}</p>}
        {ctaLabel && ctaLink && (
          <Button asChild size="lg">
            <Link to={ctaLink}>{ctaLabel}</Link>
          </Button>
        )}
      </div>
    </section>
  );
};

// ── Rich Text ──
const RichTextBlock = ({ data }: { data: Data }) => {
  const content = (data.content as string) || '';
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
};

// ── Image ──
const ImageBlock = ({ data }: { data: Data }) => {
  const url = (data.url as string) || '';
  const alt = (data.alt as string) || '';
  const caption = (data.caption as string) || '';
  if (!url) return null;

  return (
    <figure className="max-w-4xl mx-auto px-4 py-8">
      <img src={url} alt={alt} className="w-full rounded-lg" loading="lazy" />
      {caption && <figcaption className="text-sm text-muted-foreground text-center mt-3">{caption}</figcaption>}
    </figure>
  );
};

// ── Cards ──
const CardsBlock = ({ data }: { data: Data }) => {
  const title = (data.title as string) || '';
  const subtitle = (data.subtitle as string) || '';
  const items = (Array.isArray(data.items) ? data.items : []) as { title: string; description: string; image: string; link: string }[];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      {title && <h2 className="text-3xl font-display font-bold text-center mb-2">{title}</h2>}
      {subtitle && <p className="text-center text-muted-foreground mb-8">{subtitle}</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
            {item.image && <img src={item.image} alt={item.title} className="w-full h-48 object-cover" loading="lazy" />}
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              {item.link && (
                <Button variant="link" asChild className="px-0 mt-2">
                  <Link to={item.link}>Saiba mais →</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Gallery ──
const GalleryBlock = ({ data }: { data: Data }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { url: string; alt: string; caption: string }[];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <figure key={i} className="group overflow-hidden rounded-lg">
            <img src={item.url} alt={item.alt} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            {item.caption && <figcaption className="text-xs text-muted-foreground text-center mt-2">{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
};

// ── FAQ ──
const FaqBlock = ({ data }: { data: Data }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { question: string; answer: string }[];

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent>
              <div className="prose dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: item.answer }} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

// ── CTA ──
const CtaBlock = ({ data }: { data: Data }) => {
  const title = (data.title as string) || '';
  const text = (data.text as string) || '';
  const btnLabel = (data.button_label as string) || '';
  const btnLink = (data.button_link as string) || '';

  return (
    <section className="bg-primary/5 py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {title && <h2 className="text-3xl font-display font-bold mb-3">{title}</h2>}
        {text && <p className="text-muted-foreground mb-6">{text}</p>}
        {btnLabel && btnLink && (
          <Button asChild size="lg">
            <Link to={btnLink}>{btnLabel}</Link>
          </Button>
        )}
      </div>
    </section>
  );
};

// ── Spacer ──
const SpacerBlock = ({ data }: { data: Data }) => {
  const height = typeof data.height === 'number' ? data.height : 40;
  return <div style={{ height: `${height}px` }} aria-hidden />;
};
