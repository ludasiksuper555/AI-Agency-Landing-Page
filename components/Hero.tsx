import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div id="hero" className="pt-32 pb-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 mb-10 md:mb-0"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Трансформуйте ваш бізнес за допомогою штучного інтелекту
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Ми допомагаємо компаніям впроваджувати інноваційні AI-рішення для підвищення ефективності та конкурентоспроможності
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                Замовити консультацію
              </button>
              <button className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors">
                Дізнатися більше
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2"
          >
            <div className="bg-white bg-opacity-10 p-6 rounded-lg border border-white border-opacity-20 backdrop-blur-sm">
              <div className="w-full h-64 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🤖</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;