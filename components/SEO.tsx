import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

const SEO = ({
  title = "М'ясний Консалтинг - Професійні консультації для м'ясної індустрії",
  description = "Консалтингова фірма, що спеціалізується на просуванні м'ясо-ковбасних виробів на ринку України та за кордоном. Впроваджуємо сучасні професійні практики для планування, конкурування та просування продукції.",
  keywords = [
    "м'ясна індустрія",
    'ковбасні вироби',
    'консалтинг',
    "просування м'ясної продукції",
    "експорт м'ясних виробів",
    "аналіз ринку м'яса",
    'оптимізація виробництва',
  ],
  ogImage = '/images/og-image.jpg',
  ogType = 'website',
  canonicalUrl,
  structuredData,
}: SEOProps) => {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meatconsulting.ua';
  const fullUrl = canonicalUrl || `${siteUrl}${router.asPath}`;
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  // Базова структура даних для організації
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "М'ясний Консалтинг",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      "Консалтингова фірма, що спеціалізується на просуванні м'ясо-ковбасних виробів на ринку України та за кордоном",
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+380-44-123-4567',
      contactType: 'customer service',
      availableLanguage: ['Ukrainian', 'English', 'Polish', 'German'],
    },
    sameAs: [
      'https://facebook.com/meatconsulting',
      'https://twitter.com/meatconsulting',
      'https://linkedin.com/company/meatconsulting',
    ],
  };

  // Объединение базовой структуры с пользовательской
  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Канонический URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph метаданные */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="М'ясний Консалтинг" />

      {/* Twitter метаданные */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Структурированные данные */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData),
        }}
      />
    </Head>
  );
};

export default SEO;
export type { SEOProps };
