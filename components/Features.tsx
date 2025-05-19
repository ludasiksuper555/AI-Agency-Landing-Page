import React from 'react';
import { motion } from 'motion/react';

const Features = () => {
  const features = [
    {
      title: 'Передові технології',
      description: 'Ми використовуємо найновіші досягнення у сфері штучного інтелекту та машинного навчання.',
      icon: '🚀'
    },
    {
      title: 'Індивідуальний підхід',
      description: 'Кожне рішення розробляється з урахуванням специфіки вашого бізнесу та потреб.',
      icon: '🔍'
    },
    {
      title: 'Масштабованість',
      description: 'Наші рішення легко масштабуються разом із зростанням вашого бізнесу.',
      icon: '📈'
    },
    {
      title: 'Безпека даних',
      description: 'Ми забезпечуємо найвищий рівень захисту ваших даних та конфіденційної інформації.',
      icon: '🔒'
    },
    {
      title: 'Підтримка 24/7',
      description: 'Наша команда підтримки доступна цілодобово для вирішення будь-яких питань.',
      icon: '🛠️'
    },
    {
      title: 'Швидка інтеграція',
      description: 'Мінімальний час впровадження рішень у вашу існуючу інфраструктуру.',
      icon: '⚡'
    }
  ];

  return (
    <div id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Наші переваги</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Чому клієнти обирають саме нас для впровадження AI-рішень
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow"
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