/**
 * Payment Utilities
 * Credit card detection, formatting, and validation
 */

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown';

interface CardPattern {
  type: CardType;
  pattern: RegExp;
  format: RegExp;
  length: number[];
  cvvLength: number;
}

// Card patterns based on IIN ranges
const cardPatterns: CardPattern[] = [
  {
    type: 'visa',
    pattern: /^4/,
    format: /(\d{1,4})/g,
    length: [16, 19],
    cvvLength: 3,
  },
  {
    type: 'mastercard',
    pattern: /^(5[1-5]|2[2-7])/,
    format: /(\d{1,4})/g,
    length: [16],
    cvvLength: 3,
  },
  {
    type: 'amex',
    pattern: /^3[47]/,
    format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
    length: [15],
    cvvLength: 4,
  },
  {
    type: 'discover',
    pattern: /^(6011|65|64[4-9])/,
    format: /(\d{1,4})/g,
    length: [16],
    cvvLength: 3,
  },
  {
    type: 'diners',
    pattern: /^(36|38|30[0-5])/,
    format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
    length: [14],
    cvvLength: 3,
  },
  {
    type: 'jcb',
    pattern: /^35(2[89]|[3-8])/,
    format: /(\d{1,4})/g,
    length: [16],
    cvvLength: 3,
  },
  {
    type: 'unionpay',
    pattern: /^62/,
    format: /(\d{1,4})/g,
    length: [16, 17, 18, 19],
    cvvLength: 3,
  },
];

/**
 * Detect card type based on card number prefix
 */
export function detectCardType(cardNumber: string): CardType {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  for (const card of cardPatterns) {
    if (card.pattern.test(cleanNumber)) {
      return card.type;
    }
  }
  
  return 'unknown';
}

/**
 * Get card configuration by type
 */
export function getCardConfig(cardType: CardType): CardPattern | undefined {
  return cardPatterns.find(c => c.type === cardType);
}

/**
 * Format card number with spaces every 4 digits
 * Amex uses 4-6-5 format
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cardType = detectCardType(cleanNumber);
  
  if (cardType === 'amex') {
    // Amex format: 4-6-5
    const parts = cleanNumber.match(/^(\d{0,4})(\d{0,6})(\d{0,5})$/);
    if (parts) {
      return [parts[1], parts[2], parts[3]].filter(Boolean).join(' ');
    }
  }
  
  // Default format: 4-4-4-4 (or 4-4-4-4-3 for 19 digit cards)
  const parts = cleanNumber.match(/(\d{1,4})/g);
  return parts ? parts.join(' ') : cleanNumber;
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiry(expiry: string): string {
  const cleanExpiry = expiry.replace(/\D/g, '');
  
  if (cleanExpiry.length === 0) return '';
  
  if (cleanExpiry.length === 1) {
    // If first digit is > 1, prepend 0
    if (parseInt(cleanExpiry) > 1) {
      return `0${cleanExpiry}/`;
    }
    return cleanExpiry;
  }
  
  if (cleanExpiry.length === 2) {
    const month = parseInt(cleanExpiry);
    if (month > 12) {
      return `0${cleanExpiry[0]}/${cleanExpiry[1]}`;
    }
    return `${cleanExpiry}/`;
  }
  
  // Format as MM/YY
  return `${cleanExpiry.slice(0, 2)}/${cleanExpiry.slice(2, 4)}`;
}

/**
 * Validate expiry date is in future
 */
export function validateExpiry(expiry: string): boolean {
  const cleanExpiry = expiry.replace(/\D/g, '');
  
  if (cleanExpiry.length < 4) return false;
  
  const month = parseInt(cleanExpiry.slice(0, 2));
  const year = parseInt(`20${cleanExpiry.slice(2, 4)}`);
  
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
}

/**
 * Luhn algorithm for card number validation
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate CVC based on card type
 */
export function validateCVC(cvc: string, cardType: CardType): boolean {
  const cleanCVC = cvc.replace(/\D/g, '');
  const config = getCardConfig(cardType);
  
  if (!config) {
    return cleanCVC.length >= 3 && cleanCVC.length <= 4;
  }
  
  return cleanCVC.length === config.cvvLength;
}

/**
 * Get the maximum card number length for a card type
 */
export function getMaxCardLength(cardType: CardType): number {
  const config = getCardConfig(cardType);
  return config ? Math.max(...config.length) : 19;
}

/**
 * Card brand display names
 */
export const cardBrandNames: Record<CardType, string> = {
  visa: 'Visa',
  mastercard: 'MasterCard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

/**
 * Get clean card number (digits only)
 */
export function getCleanCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '');
}
