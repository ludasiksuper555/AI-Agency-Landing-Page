import { GetStaticProps, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface RecommendationsPageProps {
  recommendations?: any[];
}

const RecommendationsPage: NextPage<RecommendationsPageProps> = ({ recommendations = [] }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Рекомендації</h1>
      <div className="grid gap-4">
        {recommendations.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <p>{JSON.stringify(item)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
    },
  };
};
