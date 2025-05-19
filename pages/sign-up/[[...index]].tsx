import { SignUp } from '@clerk/nextjs';
import { motion } from 'framer-motion';

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Створення облікового запису</h2>
          <p className="mt-2 text-sm text-gray-600">
            Зареєструйтесь, щоб отримати доступ до всіх функцій
          </p>
        </div>
        <div className="mt-8">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'rounded-lg shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400',
                formFieldInput: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              },
            }}
            routing="path"
            path="/sign-up"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;