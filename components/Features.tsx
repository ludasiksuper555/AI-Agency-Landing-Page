'use client';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';

const Features = () => {
  const { t } = useTranslation('common');

  const features = [
    {
      title: t('features.items.0.title'),
      description: t('features.items.0.description'),
      icon: '🚀',
    },
    {
      title: t('features.items.1.title'),
      description: t('features.items.1.description'),
      icon: '🔍',
    },
    {
      title: t('features.items.2.title'),
      description: t('features.items.2.description'),
      icon: '📈',
    },
    {
      title: t('features.items.3.title'),
      description: t('features.items.3.description'),
      icon: '🔒',
    },
    {
      title: t('features.items.4.title'),
      description: t('features.items.4.description'),
      icon: '🛠️',
    },
    {
      title: t('features.items.5.title'),
      description: t('features.items.5.description'),
      icon: '⚡',
    },
  ];

  return (
    <div id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('features.description')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
