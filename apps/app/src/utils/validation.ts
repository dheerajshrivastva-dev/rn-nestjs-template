import {z} from 'zod';

/**
 * Indian mobile number validator.
 *
 * Rules:
 *  - Exactly 10 digits (no country code prefix)
 *  - Must start with 6, 7, 8, or 9
 *    → excludes landlines (0xx), toll-free (1800x), and invalid series
 *
 * Valid:   9876543210, 6123456789
 * Invalid: 1800123456, 0123456789, 12345, 98765432101
 */
export const INDIAN_MOBILE_REGEX = /^[6-9][0-9]{9}$/;

export const indianMobileSchema = z
  .string({required_error: 'Phone number is required'})
  .length(10, 'Phone number must be exactly 10 digits')
  .regex(INDIAN_MOBILE_REGEX, 'Enter a valid Indian mobile number (starts with 6–9)');
