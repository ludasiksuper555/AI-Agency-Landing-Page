'use client';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';

const Testimonials = () => {
  const { t } = useTranslation('common');

  const testimonials = [
    {
      id: 'testimonial1',
      name: t('testimonials.items.0.name'),
      position: t('testimonials.items.0.position'),
      text: t('testimonials.items.0.text'),
      image: '👨‍💼',
    },
    {
      id: 'testimonial2',
      name: t('testimonials.items.1.name'),
      position: t('testimonials.items.1.position'),
      text: t('testimonials.items.1.text'),
      image: '👩‍💼',
    },
    {
      id: 'testimonial3',
      name: t('testimonials.items.2.name'),
      position: t('testimonials.items.2.position'),
      text: t('testimonials.items.2.text'),
      image: '👨‍💻',
    },
  ];

  return (
    <div id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('testimonials.description')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{testimonial.image}</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{testimonial.name}</h3>
                  <p className="text-gray-600">{testimonial.position}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
