import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  keywords?: string;
}

const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'StartMídia Comunicação Visual',
  description: 'Gráfica e comunicação visual em Limeira/SP',
  url: 'https://startmidialimeira.com.br',
  telephone: '+55 19 98364-9875',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Limeira',
    addressRegion: 'SP',
    addressCountry: 'BR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -22.564,
    longitude: -47.4017,
  },
  openingHours: 'Mo-Fr 08:00-18:00, Sa 08:00-12:00',
  priceRange: '$$',
};

export function SEO({ title, description, image, canonical, keywords }: SEOProps) {
  const fullTitle = `${title} | StartMídia`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      <script type="application/ld+json">{JSON.stringify(LOCAL_BUSINESS_SCHEMA)}</script>
    </Helmet>
  );
}
