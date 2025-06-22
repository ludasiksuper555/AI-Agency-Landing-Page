import { createClient } from 'contentful';

import type { TypePageSkeleton } from '../types/contentfulTypes';

export type { TypePageSkeleton };

// Инициализация клиента Contentful
export const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID || 'dummy-space',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || 'dummy-token',
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
});

// Получение всех страниц - временно возвращаем пустой массив
export const getAllPages = async () => {
  // Временно возвращаем пустой массив вместо запроса к Contentful
  console.log('getAllPages: Contentful временно отключен');
  return [];
};

// Получение страницы по slug - временно возвращаем null
export const getPageBySlug = async (slug: string) => {
  // Временно возвращаем null вместо запроса к Contentful
  console.log(`getPageBySlug: Contentful временно отключен для slug: ${slug}`);
  return null;
};

// Получение всех путей для статической генерации - временно возвращаем пустой массив
export const getAllPageSlugs = async () => {
  // Временно возвращаем пустой массив вместо запроса к Contentful
  console.log('getAllPageSlugs: Contentful временно отключен');
  return [];
};
