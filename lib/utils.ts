// lib/utils.ts - Auto-generated type-safe version
import { clsx, type ClassValue } from 'clsx';
import path from 'path';
import { twMerge } from 'tailwind-merge';

export interface LibConfig {
  [key: string]: any;
}

export const config: LibConfig = {};

export function initialize(): void {
  console.log(`Initializing ${path.basename(__filename)}...`);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default { config, initialize };
