import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface ContentfulRendererProps {
  document: any; // Документ Contentful Rich Text
  className?: string;
}

const ContentfulRenderer: React.FC<ContentfulRendererProps> = ({ document, className = '' }) => {
  // Настройка опций рендеринга для разных типов контента
  const options = {
    renderMark: {
      [MARKS.BOLD]: (text: React.ReactNode) => <strong className="font-bold">{text}</strong>,
      [MARKS.ITALIC]: (text: React.ReactNode) => <em className="italic">{text}</em>,
      [MARKS.UNDERLINE]: (text: React.ReactNode) => <u className="underline">{text}</u>,
      [MARKS.CODE]: (text: React.ReactNode) => (
        <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm">
          {text}
        </code>
      ),
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_: unknown, children: React.ReactNode) => (
        <p className="mb-4 last:mb-0">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (_: unknown, children: React.ReactNode) => (
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (_: unknown, children: React.ReactNode) => (
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (_: unknown, children: React.ReactNode) => (
        <h3 className="text-xl md:text-2xl font-bold mb-3">{children}</h3>
      ),
      [BLOCKS.HEADING_4]: (_: unknown, children: React.ReactNode) => (
        <h4 className="text-lg md:text-xl font-bold mb-2">{children}</h4>
      ),
      [BLOCKS.HEADING_5]: (_: unknown, children: React.ReactNode) => (
        <h5 className="text-base md:text-lg font-bold mb-2">{children}</h5>
      ),
      [BLOCKS.HEADING_6]: (_: unknown, children: React.ReactNode) => (
        <h6 className="text-sm md:text-base font-bold mb-2">{children}</h6>
      ),
      [BLOCKS.UL_LIST]: (_: unknown, children: React.ReactNode) => (
        <ul className="list-disc pl-6 mb-4">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (_: unknown, children: React.ReactNode) => (
        <ol className="list-decimal pl-6 mb-4">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (_: unknown, children: React.ReactNode) => (
        <li className="mb-1">{children}</li>
      ),
      [BLOCKS.QUOTE]: (_: unknown, children: React.ReactNode) => (
        <blockquote className="border-l-4 border-blue-500 pl-4 py-1 mb-4 italic">
          {children}
        </blockquote>
      ),
      [BLOCKS.HR]: () => <hr className="my-6 border-t border-gray-300 dark:border-gray-700" />,
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        const { title, description, file } = node.data.target.fields;
        const { url, details } = file;
        const { image } = details;

        return (
          <div className="my-4">
            <Image
              src={`https:${url}`}
              alt={description || title || 'Embedded asset'}
              width={image?.width || 800}
              height={image?.height || 600}
              className="rounded-lg"
            />
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                {description}
              </p>
            )}
          </div>
        );
      },
      [INLINES.HYPERLINK]: (node: any, children: React.ReactNode) => {
        const { uri } = node.data;
        const isInternal = uri.startsWith('/');

        if (isInternal) {
          return (
            <Link href={uri} className="text-blue-600 hover:underline dark:text-blue-400">
              {children}
            </Link>
          );
        }

        return (
          <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {children}
          </a>
        );
      },
    },
  };

  return <div className={className}>{documentToReactComponents(document, options)}</div>;
};

export default ContentfulRenderer;
