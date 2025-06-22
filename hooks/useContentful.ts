import { useQuery } from '@tanstack/react-query';
import { createClient } from 'contentful';

import { getAllPages, getPageBySlug, TypePageSkeleton } from '../lib/contentful';

/**
 * Хук для получения клиента Contentful
 */
export const useContentful = () => {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID || '',
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '',
    environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  });

  return client;
};

/**
 * Хук для получения всех страниц из Contentful с использованием React Query для кэширования
 */
export const useAllPages = () => {
  return useQuery<TypePageSkeleton[], Error>({
    queryKey: ['pages'],
    queryFn: () => getAllPages(),
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30, // 30 минут
  });
};

/**
 * Хук для получения конкретной страницы по slug из Contentful с использованием React Query
 * @param slug - Уникальный идентификатор страницы
 */
export const usePage = (slug: string) => {
  return useQuery<TypePageSkeleton, Error>({
    queryKey: ['page', slug],
    queryFn: () => getPageBySlug(slug),
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30, // 30 минут
    enabled: !!slug, // Запрос выполняется только если slug определен
  });
};
