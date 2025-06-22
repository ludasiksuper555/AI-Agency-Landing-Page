// Simple replacement for class-variance-authority
const cva = (base: string | string[], config?: any) => {
  return (props?: any) => {
    const baseClasses = Array.isArray(base) ? base.join(' ') : base;
    if (!props || !config) return baseClasses;

    let variantClasses = '';
    if (config.variants) {
      Object.keys(props).forEach(key => {
        if (config.variants[key] && config.variants[key][props[key]]) {
          variantClasses += ' ' + config.variants[key][props[key]];
        }
      });
    }

    return (baseClasses + variantClasses).trim();
  };
};

export const buttonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'font-medium',
    'transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:opacity-50',
    'disabled:pointer-events-none',
    'ring-offset-background',
  ],
  {
    variants: {
      variant: {
        default: ['bg-primary-600', 'text-white', 'hover:bg-primary-700', 'active:bg-primary-800'],
        destructive: ['bg-red-600', 'text-white', 'hover:bg-red-700', 'active:bg-red-800'],
        outline: [
          'border',
          'border-gray-300',
          'bg-transparent',
          'text-gray-900',
          'hover:bg-gray-50',
          'active:bg-gray-100',
          'dark:border-gray-600',
          'dark:text-gray-100',
          'dark:hover:bg-gray-800',
        ],
        secondary: [
          'bg-gray-100',
          'text-gray-900',
          'hover:bg-gray-200',
          'active:bg-gray-300',
          'dark:bg-gray-800',
          'dark:text-gray-100',
          'dark:hover:bg-gray-700',
        ],
        ghost: [
          'bg-transparent',
          'text-gray-900',
          'hover:bg-gray-100',
          'active:bg-gray-200',
          'dark:text-gray-100',
          'dark:hover:bg-gray-800',
        ],
        link: [
          'bg-transparent',
          'text-primary-600',
          'underline-offset-4',
          'hover:underline',
          'active:text-primary-700',
        ],
      },
      size: {
        default: ['h-10', 'px-4', 'py-2'],
        sm: ['h-9', 'rounded-md', 'px-3'],
        lg: ['h-11', 'rounded-md', 'px-8'],
        xl: ['h-12', 'rounded-lg', 'px-10', 'text-base'],
        icon: ['h-10', 'w-10'],
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
