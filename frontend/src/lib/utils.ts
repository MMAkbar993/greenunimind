import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (USD)
 * @param amount The amount to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}) {
  // Default options for USD currency formatting
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Merge default options with provided options
  const formatOptions = { ...defaultOptions, ...options };

  // Format the amount
  return new Intl.NumberFormat('en-US', formatOptions).format(amount);
}
