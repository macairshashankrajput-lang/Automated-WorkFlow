import { CurrencyCode } from '../types';

export const FX_RATES: Record<CurrencyCode, { symbol: string; rateFromUSD: number; name: string }> = {
  USD: { symbol: '$', rateFromUSD: 1.0, name: 'US Dollar' },
  EUR: { symbol: '€', rateFromUSD: 0.92, name: 'Euro' },
  GBP: { symbol: '£', rateFromUSD: 0.79, name: 'British Pound' },
  INR: { symbol: '₹', rateFromUSD: 83.5, name: 'Indian Rupee' },
  JPY: { symbol: '¥', rateFromUSD: 155.2, name: 'Japanese Yen' },
  AED: { symbol: 'د.إ', rateFromUSD: 3.67, name: 'UAE Dirham' },
  SGD: { symbol: 'S$', rateFromUSD: 1.35, name: 'Singapore Dollar' },
  CAD: { symbol: 'CA$', rateFromUSD: 1.37, name: 'Canadian Dollar' },
  AUD: { symbol: 'AU$', rateFromUSD: 1.52, name: 'Australian Dollar' },
};

/**
 * Converts an amount from a source currency to a target currency
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode = 'USD',
  to: CurrencyCode = 'USD'
): number {
  if (!amount || isNaN(amount)) return 0;
  if (from === to) return amount;
  const fromRate = FX_RATES[from]?.rateFromUSD || 1.0;
  const toRate = FX_RATES[to]?.rateFromUSD || 1.0;
  const amountInUSD = amount / fromRate;
  return Math.round(amountInUSD * toRate * 100) / 100;
}

/**
 * Formats a currency value with its appropriate symbol and digit groupings
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  compact: boolean = false
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  const config = FX_RATES[currency] || FX_RATES.USD;
  
  if (compact && Math.abs(amount) >= 1000000) {
    return `${config.symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `${config.symbol}${(amount / 1000).toFixed(1)}k`;
  }

  return `${config.symbol}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  })}`;
}
