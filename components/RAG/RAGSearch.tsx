import { useTranslation } from 'next-i18next';
import React, { FormEvent } from 'react';

import { useRAG } from './RAGProvider';

type RAGSearchProps = {
  placeholder?: string;
  className?: string;
  buttonText?: string;
};

const RAGSearch = ({ placeholder, className = '', buttonText }: RAGSearchProps) => {
  const { t } = useTranslation('common');
  const { query, setQuery, search, isSearching, clearResults } = useRAG();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder || t('search.placeholder', 'Search knowledge base...')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            aria-label={t('search.ariaLabel', 'Search query')}
          />
          {query && (
            <button
              type="button"
              onClick={clearResults}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label={t('search.clear', 'Clear search')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={
            isSearching ? t('search.searching', 'Searching...') : t('search.submit', 'Search')
          }
        >
          {isSearching ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t('search.searching', 'Searching...')}
            </span>
          ) : (
            buttonText || t('search.submit', 'Search')
          )}
        </button>
      </form>
    </div>
  );
};

export default RAGSearch;
