import React from 'react';
import { motion } from 'motion/react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Олександр Петренко',
      position: 'CEO, TechInnovate',
      text: 'Співпраця з AI Agency перевершила всі наші очікування. Їхні рішення допомогли нам автоматизувати рутинні процеси та збільшити продуктивність на 40%.',
      image: '👨‍💼'
    },
    {
      name: 'Марія Ковальчук',
      position: 'CTO, DataSmart',
      text: 'Завдяки впровадженню AI-чат-бота від AI Agency ми змогли значно покращити обслуговування клієнтів та зменшити навантаження на наш колл-центр.',
      image: '👩‍💼'
    },
    {
      name: 'Іван Мельник',
      position: 'Директор з маркетингу, GrowthHub',
      text: 'Персоналізація контенту, яку нам запропонувала AI Agency, дозволила збільшити конверсію на нашому сайті на 25%. Рекомендую їх як надійного партнера.',
      image: '👨‍💻'
    }
  ];

  return (
    <div id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Відгуки клієнтів</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Що кажуть наші клієнти про співпрацю з нами
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-8"
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