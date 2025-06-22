import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useState } from 'react';

import { useContentful } from '../../hooks/useContentful';

type RAGContextType = {
  query: string;
  setQuery: (query: string) => void;
  results: any[];
  isSearching: boolean;
  error: Error | null;
  search: () => void;
  clearResults: () => void;
};

const RAGContext = createContext<RAGContextType | undefined>(undefined);

type RAGProviderProps = {
  children: ReactNode;
};

export const RAGProvider = ({ children }: RAGProviderProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [contentfulAvailable, setContentfulAvailable] = useState(true);

  // Check if Contentful credentials are available
  const contentfulCredentialsAvailable =
    typeof process.env.CONTENTFUL_SPACE_ID === 'string' &&
    process.env.CONTENTFUL_SPACE_ID.length > 0 &&
    typeof process.env.CONTENTFUL_ACCESS_TOKEN === 'string' &&
    process.env.CONTENTFUL_ACCESS_TOKEN.length > 0;

  // Only try to use Contentful if credentials are available
  const contentful = contentfulCredentialsAvailable ? useContentful() : null;

  const { refetch, isLoading, error } = useQuery({
    queryKey: ['ragSearch', query],
    queryFn: async () => {
      if (!query.trim() || !contentful) return [];

      try {
        // Fetch content from Contentful based on the query
        const searchResults = await contentful.getEntries({
          content_type: 'article', // Adjust based on your content model
          query: query,
          select: ['sys.id', 'fields.title', 'fields.description', 'fields.content', 'fields.slug'],
          limit: 10,
        });

        setResults(searchResults.items || []);
        return searchResults.items;
      } catch (err) {
        console.error('RAG search error:', err);
        setContentfulAvailable(false);
        throw err;
      }
    },
    enabled: false, // Don't run automatically
  });

  const search = () => {
    if (query.trim() && contentfulCredentialsAvailable) {
      refetch();
    } else if (!contentfulCredentialsAvailable) {
      console.warn('Contentful credentials not available. RAG search is disabled.');
    }
  };

  const clearResults = () => {
    setResults([]);
    setQuery('');
  };

  return (
    <RAGContext.Provider
      value={{
        query,
        setQuery,
        results,
        isSearching: isLoading,
        error: error as Error | null,
        search,
        clearResults,
      }}
    >
      {children}
    </RAGContext.Provider>
  );
};

export const useRAG = (): RAGContextType => {
  const context = useContext(RAGContext);
  if (context === undefined) {
    throw new Error('useRAG must be used within a RAGProvider');
  }
  return context;
};

export default RAGProvider;
