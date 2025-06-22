import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import React from 'react';

import { useRAG } from './RAGProvider';

type RAGResultsProps = {
  className?: string;
  maxResults?: number;
  showExcerpt?: boolean;
};

const RAGResults = ({ className = '', maxResults = 10, showExcerpt = true }: RAGResultsProps) => {
  const { t } = useTranslation('common');
  const { results, isSearching, error, query } = useRAG();

  // Helper function to create excerpt from content
  const createExcerpt = (content: string, maxLength = 150) => {
    if (!content) return '';

    // If content is rich text, try to extract plain text
    let plainText = content;
    if (typeof content === 'object') {
      try {
        // This is a simplified approach - in a real app you might need more robust parsing
        plainText = JSON.stringify(content);
      } catch (e) {
        plainText = '';
      }
    }

    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // Filter and limit results
  const displayResults = results.slice(0, maxResults);

  if (isSearching) {
    return (
      <div className={`mt-4 ${className}`}>
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`mt-4 p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400 ${className}`}
      >
        <p className="font-medium">{t('search.error', 'Error')}:</p>
        <p>
          {error.message ||
            t('search.genericError', 'An error occurred while searching. Please try again.')}
        </p>
      </div>
    );
  }

  if (query && displayResults.length === 0) {
    return (
      <div className={`mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800 ${className}`}>
        <p className="text-center text-gray-600 dark:text-gray-400">
          {t(
            'search.noResults',
            'No results found for "{{query}}". Please try a different search term.',
            { query }
          )}
        </p>
      </div>
    );
  }

  if (!query || displayResults.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        {t('search.resultsTitle', 'Search Results')}
      </h2>
      <ul className="space-y-4">
        {displayResults.map(result => {
          const id = result.sys?.id || result.id;
          const title = result.fields?.title || result.title || t('search.untitled', 'Untitled');
          const description = result.fields?.description || result.description || '';
          const slug = result.fields?.slug || result.slug || id;
          const content = result.fields?.content || result.content || '';

          return (
            <li
              key={id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Link href={`/${slug}`} className="block">
                <h3 className="text-lg font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {title}
                </h3>
                {showExcerpt && (description || content) && (
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    {description || createExcerpt(content)}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RAGResults;
