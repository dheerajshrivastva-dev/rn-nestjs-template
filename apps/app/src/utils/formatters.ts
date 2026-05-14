/**
 * Formatting utilities for dates, currency, and other display values
 */

/**
 * Format a date as time ago (e.g., "5 minutes ago", "2 hours ago")
 */
export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format amount as Indian currency (INR)
 */
export const formatCurrency = (
  amount: number,
  options: {
    currency?: string;
    locale?: string;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    currency = 'INR',
    locale = 'en-IN',
    maximumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
};

/**
 * Format large numbers with suffixes (e.g., 1000 -> 1K, 1000000 -> 1M)
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};

/**
 * Calculate age in hours from a date string
 */
export const getAgeInHours = (dateString: string): number => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / 3600000);
};
