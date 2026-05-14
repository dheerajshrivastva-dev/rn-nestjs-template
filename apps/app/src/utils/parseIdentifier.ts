/**
 * Parse identifier string to determine type and create LoginRequest fields
 * @param identifier Can be email, phone, or userId
 * @returns Object with correct field set (userId, email, or phone)
 */
export function parseIdentifier(identifier: string): {
  userId?: string;
  email?: string;
  phone?: string;
} {
  const trimmed = identifier.trim();

  // Check if it's an email (contains @ and .)
  if (trimmed.includes('@') && trimmed.includes('.')) {
    return { email: trimmed };
  }

  // Check if it's a phone number (starts with + or contains only digits/spaces/dashes/parens)
  if (/^[\d\s\-+()]+$/.test(trimmed)) {
    return { phone: trimmed };
  }

  // Otherwise, treat as userId
  return { userId: trimmed };
}
