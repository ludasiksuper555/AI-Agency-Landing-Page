// Type definitions for framer-motion
import React from 'react';

declare module 'framer-motion' {
  import { FormHTMLAttributes, HTMLAttributes } from 'react';
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileInView?: any;
    viewport?: any;
    layout?: boolean | string;
    layoutId?: string;
    layoutDependency?: any;
    layoutScroll?: boolean;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onUpdate?: (latest: any) => void;
    onDragStart?: (event: any, info: any) => void;
    onDrag?: (event: any, info: any) => void;
    onDragEnd?: (event: any, info: any) => void;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    dragElastic?: number | boolean;
    dragMomentum?: boolean;
    dragPropagation?: boolean;
    dragSnapToOrigin?: boolean;
    dragTransition?: any;
  }

  export const motion: {
    div: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLDivElement> & MotionProps & React.RefAttributes<HTMLDivElement>
    >;
    form: React.ForwardRefExoticComponent<
      FormHTMLAttributes<HTMLFormElement> & MotionProps & React.RefAttributes<HTMLFormElement>
    >;
    section: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    span: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLSpanElement> & MotionProps & React.RefAttributes<HTMLSpanElement>
    >;
    button: React.ForwardRefExoticComponent<
      React.ButtonHTMLAttributes<HTMLButtonElement> &
        MotionProps &
        React.RefAttributes<HTMLButtonElement>
    >;
    h1: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLHeadingElement> & MotionProps & React.RefAttributes<HTMLHeadingElement>
    >;
    h2: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLHeadingElement> & MotionProps & React.RefAttributes<HTMLHeadingElement>
    >;
    h3: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLHeadingElement> & MotionProps & React.RefAttributes<HTMLHeadingElement>
    >;
    p: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLParagraphElement> & MotionProps & React.RefAttributes<HTMLParagraphElement>
    >;
    img: React.ForwardRefExoticComponent<
      React.ImgHTMLAttributes<HTMLImageElement> &
        MotionProps &
        React.RefAttributes<HTMLImageElement>
    >;
    a: React.ForwardRefExoticComponent<
      React.AnchorHTMLAttributes<HTMLAnchorElement> &
        MotionProps &
        React.RefAttributes<HTMLAnchorElement>
    >;
    li: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLLIElement> & MotionProps & React.RefAttributes<HTMLLIElement>
    >;
    ul: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLUListElement> & MotionProps & React.RefAttributes<HTMLUListElement>
    >;
    nav: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    header: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    footer: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    article: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    aside: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
    main: React.ForwardRefExoticComponent<
      HTMLAttributes<HTMLElement> & MotionProps & React.RefAttributes<HTMLElement>
    >;
  };

  export { AnimatePresence } from 'framer-motion';
}
