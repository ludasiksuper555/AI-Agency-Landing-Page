// Типы данных для Contentful CMS

// Базовый тип для всех записей
export interface Entry<T> {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    locale: string;
  };
  fields: T;
}

// Тип для страницы
export interface PageFields {
  title: string;
  slug: string;
  description?: string;
  content: Document;
  seoMetadata?: SEOMetadata;
  coverImage?: Asset;
}

export type TypePageSkeleton = Entry<PageFields>;

// Тип для SEO метаданных
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: Asset;
}

// Тип для медиа-ассета
export interface Asset {
  sys: {
    id: string;
  };
  fields: {
    title: string;
    description: string;
    file: {
      url: string;
      details: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
      fileName: string;
      contentType: string;
    };
  };
}

// Тип для rich text документа
export interface Document {
  nodeType: string;
  data: any;
  content: any[];
}
