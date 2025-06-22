import { VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes } from 'react';

import { buttonVariants } from './Button.styles';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Дополнительные CSS классы
   */
  className?: string;
  /**
   * Состояние загрузки
   */
  loading?: boolean;
  /**
   * Иконка слева от текста
   */
  leftIcon?: React.ReactNode;
  /**
   * Иконка справа от текста
   */
  rightIcon?: React.ReactNode;
  /**
   * Полная ширина
   */
  fullWidth?: boolean;
}
