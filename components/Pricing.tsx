'use client';
import { motion } from 'framer-motion';

const Pricing = () => {
  const plans = [
    {
      name: 'Базовий',
      price: '5,000',
      description: 'Ідеально для малого бізнесу, який тільки починає впроваджувати AI-рішення',
      features: [
        'Базовий AI-чат-бот',
        'Аналіз даних (до 10,000 записів)',
        'Базова автоматизація процесів',
        'Email підтримка',
        'Щомісячні звіти',
      ],
      isPopular: false,
      buttonText: 'Обрати план',
    },
    {
      name: 'Бізнес',
      price: '15,000',
      description: 'Оптимальний вибір для середнього бізнесу з більш складними потребами',
      features: [
        'Розширений AI-чат-бот з інтеграціями',
        'Аналіз даних (до 100,000 записів)',
        'Розширена автоматизація процесів',
        'Персоналізація контенту',
        'Пріоритетна підтримка',
        'Щотижневі звіти',
      ],
      isPopular: true,
      buttonText: 'Обрати план',
    },
    {
      name: 'Корпоративний',
      price: 'За запитом',
      description: 'Для великих підприємств з індивідуальними потребами та високими вимогами',
      features: [
        'Повністю кастомізований AI-чат-бот',
        'Необмежений аналіз даних',
        'Комплексна автоматизація процесів',
        'Розширена персоналізація контенту',
        'Виділений менеджер проекту',
        'Цілодобова підтримка',
        'Індивідуальні звіти',
      ],
      isPopular: false,
      buttonText: "Зв'язатися з нами",
    },
  ];

  return (
    <div id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Тарифні плани</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Оберіть оптимальний план для вашого бізнесу
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg p-8 ${plan.isPopular ? 'ring-2 ring-blue-500 transform scale-105' : ''}`}
            >
              {plan.isPopular && (
                <div className="bg-blue-500 text-white text-sm font-bold uppercase py-1 px-4 rounded-full inline-block mb-4">
                  Найпопулярніший
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                {plan.price !== 'За запитом' && <span className="text-gray-600"> грн/міс</span>}
              </div>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
