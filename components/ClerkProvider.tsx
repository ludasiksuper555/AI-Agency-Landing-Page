import React from 'react';
import { ClerkProvider as ClerkProviderBase, enUS, ukUA } from '@clerk/nextjs';

interface ClerkProviderProps {
  children: React.ReactNode;
}

const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  return (
    <ClerkProviderBase 
      localization={ukUA}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'rounded-lg shadow-none',
          socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400',
          formFieldInput: 'rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  );
};

export default ClerkProvider;