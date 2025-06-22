import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import ContentfulRenderer from '../components/ContentfulRenderer';
import Layout from '../components/Layout';
import { getAllPageSlugs, getPageBySlug, TypePageSkeleton } from '../lib/contentful';
import { logger } from '../utils/logger';

interface PageProps {
  page: TypePageSkeleton;
}

const DynamicPage = ({ page }: PageProps) => {
  const router = useRouter();

  // Показываем заглушку при генерации страницы на сервере
  if (router.isFallback) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-8"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Если страница не найдена
  if (!page) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Страница не найдена</h1>
          <p className="mb-6">Запрашиваемая страница не существует или была удалена.</p>
        </div>
      </Layout>
    );
  }

  const { title, description, content } = page.fields;

  return (
    <Layout
      seo={{
        title,
        description,
        keywords: page.fields.seoMetadata?.keywords || [],
        ogImage: page.fields.seoMetadata?.ogImage?.fields?.file?.url,
      }}
    >
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">{title}</h1>
        {description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{description}</p>
        )}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ContentfulRenderer document={content} />
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllPageSlugs();

  // Якщо slugs - порожній масив, повертаємо порожній paths
  // Це дозволить Next.js використовувати fallback режим для всіх маршрутів
  return {
    paths: slugs.map(slug => ({
      params: { slug },
    })),
    fallback: true, // Генерация страниц по запросу, если они не были сгенерированы при сборке
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  try {
    const slug = params?.slug as string;
    const page = await getPageBySlug(slug);

    // Если страница не найдена, возвращаем 404
    if (!page) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        page,
        ...(await serverSideTranslations(locale || 'uk', ['common'])),
      },
      revalidate: 60 * 10, // Регенерация страницы каждые 10 минут
    };
  } catch (error) {
    logger.error('Ошибка при получении страницы', { error });
    return {
      notFound: true,
    };
  }
};

export default DynamicPage;
