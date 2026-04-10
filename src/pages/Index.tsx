import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import HeroBanner from '@/components/home/HeroBanner';
import CategoriesSection from '@/components/home/CategoriesSection';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedProducts = lazy(() => import('@/components/home/FeaturedProducts'));
const DifferentialsSection = lazy(() => import('@/components/home/DifferentialsSection'));
const PortfolioPreviewSection = lazy(() => import('@/components/home/PortfolioPreviewSection'));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection'));
const CTASection = lazy(() => import('@/components/home/CTASection'));

const SectionSkeleton = () => (
  <div className="py-20">
    <div className="container space-y-4">
      <Skeleton className="h-10 w-64 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

const Index = () => (
  <>
    <Helmet>
      <title>StartMídia Comunicação Visual | Banners, Adesivos, Placas em Limeira/SP</title>
      <meta name="description" content="Gráfica e comunicação visual em Limeira/SP. Banners, lonas, adesivos, placas de sinalização, etiquetas, rótulos, envelopamento e fachadas com altíssima qualidade. Orçamento rápido!" />
      <link rel="canonical" href="https://startmidialimeira.com.br/" />
      <meta name="keywords" content="gráfica Limeira, comunicação visual Limeira, banner Limeira, adesivo Limeira, placa sinalização Limeira, etiqueta rótulo Limeira, envelopamento veículo Limeira, fachada ACM Limeira" />
      <meta property="og:title" content="StartMídia Comunicação Visual — Limeira/SP" />
      <meta property="og:description" content="Sua mensagem com impacto visual. Banners, lonas, adesivos, placas, etiquetas e muito mais." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://startmidialimeira.com.br" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "StartMídia Comunicação Visual",
        "description": "Gráfica e comunicação visual em Limeira/SP",
        "url": "https://startmidialimeira.com.br",
        "telephone": "+55 19 98364-9875",
        "address": { "@type": "PostalAddress", "addressLocality": "Limeira", "addressRegion": "SP", "addressCountry": "BR" },
        "geo": { "@type": "GeoCoordinates", "latitude": -22.564, "longitude": -47.4017 },
        "openingHours": "Mo-Fr 08:00-18:00, Sa 08:00-12:00",
        "priceRange": "$$"
      })}</script>
    </Helmet>
    <HeroBanner />
    <CategoriesSection />
    <Suspense fallback={<SectionSkeleton />}>
      <FeaturedProducts />
    </Suspense>
    <Suspense fallback={<SectionSkeleton />}>
      <DifferentialsSection />
    </Suspense>
    <Suspense fallback={<SectionSkeleton />}>
      <PortfolioPreviewSection />
    </Suspense>
    <Suspense fallback={<SectionSkeleton />}>
      <TestimonialsSection />
    </Suspense>
    <Suspense fallback={<SectionSkeleton />}>
      <CTASection />
    </Suspense>
  </>
);

export default Index;
