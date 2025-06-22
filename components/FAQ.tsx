'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'Що таке штучний інтелект і як він може допомогти моєму бізнесу?',
      answer:
        "Штучний інтелект (AI) - це технологія, яка дозволяє комп'ютерам навчатися, міркувати та приймати рішення подібно до людей. Для бізнесу AI може автоматизувати рутинні завдання, аналізувати великі обсяги даних, покращувати обслуговування клієнтів через чат-ботів, персоналізувати маркетингові кампанії та оптимізувати операційні процеси.",
    },
    {
      question: 'Скільки часу займає впровадження AI-рішення?',
      answer:
        'Час впровадження залежить від складності проекту та готовності вашої інфраструктури. Базові рішення можуть бути впроваджені за 2-4 тижні, тоді як більш складні проекти можуть зайняти 2-3 місяці. Ми завжди проводимо детальну оцінку на початковому етапі та надаємо точний графік реалізації.',
    },
    {
      question: 'Чи потрібні спеціальні технічні знання для використання ваших рішень?',
      answer:
        'Ні, наші рішення розроблені з урахуванням зручності використання. Ми надаємо інтуїтивно зрозумілі інтерфейси та проводимо навчання ваших співробітників. Крім того, наша команда підтримки завжди готова допомогти з будь-якими питаннями.',
    },
    {
      question: 'Як забезпечується безпека даних при використанні AI-рішень?',
      answer:
        'Безпека даних є нашим пріоритетом. Ми використовуємо шифрування даних, дотримуємося всіх стандартів безпеки (включаючи GDPR), проводимо регулярні аудити безпеки та впроваджуємо багаторівневу систему захисту. Всі дані зберігаються на захищених серверах з обмеженим доступом.',
    },
    {
      question: 'Чи можна інтегрувати ваші рішення з існуючими системами?',
      answer:
        'Так, наші рішення розроблені для легкої інтеграції з більшістю популярних бізнес-систем та платформ. Ми підтримуємо інтеграцію з CRM, ERP, системами електронної комерції, маркетинговими платформами та багатьма іншими системами через API.',
    },
    {
      question: 'Що відбувається після впровадження рішення?',
      answer:
        'Після впровадження ми забезпечуємо постійну підтримку, моніторинг та оптимізацію рішення. Ми регулярно надаємо звіти про продуктивність, проводимо оновлення та вдосконалення системи, а також консультуємо щодо максимально ефективного використання AI-рішення у вашому бізнесі.',
    },
  ];

  return (
    <div id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Часті запитання</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Відповіді на найпоширеніші запитання про наші AI-рішення
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="mb-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div>
                <button
                  onClick={() => toggleAccordion(index)}
                  className="flex justify-between items-center w-full p-5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  aria-expanded={activeIndex === index}
                >
                  <span className="text-lg font-semibold text-gray-800 text-left">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${activeIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: activeIndex === index ? 1 : 0,
                        height: activeIndex === index ? 'auto' : 0,
                      }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="overflow-hidden">
                        <div className="p-5 bg-white border-t border-gray-100 rounded-b-lg">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
