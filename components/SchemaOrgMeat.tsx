import Head from 'next/head';
import React from 'react';

interface SchemaOrgMeatProps {
  type: 'Product' | 'Service' | 'Organization' | 'LocalBusiness' | 'FoodEstablishment';
  name: string;
  description?: string;
  image?: string;
  url?: string;
  // Специфічні поля для продуктів м'ясної індустрії
  offers?: {
    price?: number;
    priceCurrency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    validFrom?: string;
  };
  // Поля для послуг
  serviceType?: string;
  provider?: {
    name: string;
    url?: string;
  };
  // Поля для організацій
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  // Специфічні поля для м'ясної індустрії
  meatIndustryInfo?: {
    certifications?: string[];
    ingredients?: string[];
    nutritionalInfo?: {
      calories?: number;
      protein?: number;
      fat?: number;
      carbohydrates?: number;
    };
    processingMethod?: string[];
    originCountry?: string;
    expirationDate?: string;
    storageRequirements?: string;
  };
}

const SchemaOrgMeat: React.FC<SchemaOrgMeatProps> = ({
  type,
  name,
  description,
  image,
  url,
  offers,
  serviceType,
  provider,
  address,
  meatIndustryInfo,
}) => {
  // Базова структура даних
  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
  };

  // Додаємо опціональні поля
  if (description) baseSchema.description = description;
  if (image)
    baseSchema.image = image.startsWith('http')
      ? image
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://meat-consulting.com.ua'}${image}`;
  if (url)
    baseSchema.url = url.startsWith('http')
      ? url
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://meat-consulting.com.ua'}${url}`;

  // Додаємо специфічні поля в залежності від типу
  if (type === 'Product' && offers) {
    baseSchema.offers = {
      '@type': 'Offer',
      ...offers,
    };

    // Додаємо специфічну інформацію для м'ясних продуктів
    if (meatIndustryInfo) {
      if (meatIndustryInfo.ingredients) {
        baseSchema.ingredients = meatIndustryInfo.ingredients.join(', ');
      }

      if (meatIndustryInfo.nutritionalInfo) {
        baseSchema.nutrition = {
          '@type': 'NutritionInformation',
          ...meatIndustryInfo.nutritionalInfo,
        };
      }

      if (meatIndustryInfo.originCountry) {
        baseSchema.countryOfOrigin = meatIndustryInfo.originCountry;
      }

      if (meatIndustryInfo.certifications) {
        baseSchema.hasCredential = meatIndustryInfo.certifications.map(cert => ({
          '@type': 'Credential',
          name: cert,
        }));
      }
    }
  }

  if (type === 'Service' && serviceType) {
    baseSchema.serviceType = serviceType;

    if (provider) {
      baseSchema.provider = {
        '@type': 'Organization',
        ...provider,
      };
    }
  }

  if (
    (type === 'Organization' || type === 'LocalBusiness' || type === 'FoodEstablishment') &&
    address
  ) {
    baseSchema.address = {
      '@type': 'PostalAddress',
      ...address,
    };
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
      />
    </Head>
  );
};

export default SchemaOrgMeat;
