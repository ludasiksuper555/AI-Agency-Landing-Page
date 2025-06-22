import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';

import Contact from '../components/Contact';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';

// Використовуємо dynamic import для компонентів, які використовують ThemeContext
// щоб уникнути проблем з SSR
const DynamicLayout = dynamic(() => import('../components/Layout'), {
  ssr: false,
});

const Home = () => {
  return (
    <DynamicLayout
      seo={{
        title: "М'ясний Консалтинг - Професійні рішення для м'ясної індустрії",
        description:
          "Консалтингова фірма, що спеціалізується на просуванні м'ясо-ковбасних виробів на ринку України та за кордоном. Впроваджуємо сучасні практики для планування, конкурування та просування продукції.",
        keywords: [
          "м'ясна індустрія",
          'ковбасні вироби',
          'консалтинг',
          'просування продукції',
          'аналіз ринку',
          "маркетинг м'ясних виробів",
          "експорт м'ясної продукції",
        ],
      }}
    >
      <Hero />
      <Services />
      <Team />
      <Contact />
    </DynamicLayout>
  );
};

// Получение переводов на стороне сервера
export async function getStaticProps({ locale }: { locale?: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'uk', ['common'])),
    },
  };
}

export default Home;
