import React from 'react';
import { motion } from 'motion/react';

const Services = () => {
  const services = [
    {
      title: 'AI Чат-боти',
      description: 'Розробка інтелектуальних чат-ботів для вашого бізнесу з використанням найсучасніших технологій штучного інтелекту.',
      icon: '💬'
    },
    {
      title: 'Аналіз даних',
      description: 'Глибокий аналіз ваших бізнес-даних за допомогою алгоритмів машинного навчання для виявлення прихованих закономірностей.',
      icon: '📊'
    },
    {
      title: 'Автоматизація процесів',
      description: 'Оптимізація та автоматизація рутинних бізнес-процесів за допомогою штучного інтелекту.',
      icon: '⚙️'
    },
    {
      title: 'Персоналізація контенту',
      description: 'Створення персоналізованого контенту для ваших клієнтів на основі їхніх уподобань та поведінки.',
      icon: '🎯'
    }
  ];

  return (
    <div id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Наші послуги</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ми пропонуємо широкий спектр послуг у сфері штучного інтелекту для вашого бізнесу
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;