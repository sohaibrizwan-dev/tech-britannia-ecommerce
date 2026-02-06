import React, { useState, useCallback, useMemo } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import {
  detectCardType,
  formatCardNumber,
  formatExpiry,
  validateCardNumber,
  validateExpiry,
  validateCVC,
  getMaxCardLength,
  cardBrandNames,
  CardType,
} from '../utils/paymentUtils';

interface CardInputProps {
  onCardChange?: (cardNumber: string, isValid: boolean) => void;
  onExpiryChange?: (expiry: string, isValid: boolean) => void;
  onCVCChange?: (cvc: string, isValid: boolean) => void;
  onCardNameChange?: (name: string) => void;
  cardNumberError?: string;
  expiryError?: string;
  cvcError?: string;
  cardNameError?: string;
  showCardName?: boolean;
  className?: string;
}

// SVG Icons for card brands
const CardIcons: Record<CardType, React.ReactNode> = {
  visa: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#1565C0" x="6" y="12" width="36" height="24" rx="3"/>
      <path fill="#fff" d="M19.5 28l1.6-9.8h2.6l-1.6 9.8h-2.6zm11.2-9.6c-.5-.2-1.3-.4-2.3-.4-2.6 0-4.4 1.4-4.4 3.3 0 1.4 1.3 2.2 2.3 2.7 1 .5 1.4.8 1.4 1.3 0 .7-.8 1-1.6 1-1.1 0-1.6-.2-2.5-.5l-.3-.2-.4 2.3c.6.3 1.8.5 3 .5 2.7 0 4.5-1.3 4.5-3.4 0-1.1-.7-2-2.2-2.7-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.3-2.2z"/>
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <circle fill="#F44336" cx="18" cy="24" r="10"/>
      <circle fill="#FF9800" cx="30" cy="24" r="10"/>
      <path fill="#FF5722" d="M24 17.2c2 1.6 3.2 4 3.2 6.8s-1.2 5.2-3.2 6.8c-2-1.6-3.2-4-3.2-6.8s1.2-5.2 3.2-6.8z"/>
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#1976D2" x="6" y="12" width="36" height="24" rx="3"/>
      <text x="24" y="26" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">AMEX</text>
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#E65100" x="6" y="12" width="36" height="24" rx="3"/>
      <circle fill="#fff" cx="30" cy="24" r="6"/>
    </svg>
  ),
  diners: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#0D47A1" x="6" y="12" width="36" height="24" rx="3"/>
      <circle fill="#fff" cx="24" cy="24" r="8" fillOpacity="0.3"/>
    </svg>
  ),
  jcb: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#1A237E" x="6" y="12" width="12" height="24" rx="2"/>
      <rect fill="#D32F2F" x="18" y="12" width="12" height="24"/>
      <rect fill="#388E3C" x="30" y="12" width="12" height="24" rx="2"/>
    </svg>
  ),
  unionpay: (
    <svg viewBox="0 0 48 48" className="w-8 h-8">
      <rect fill="#E53935" x="6" y="12" width="36" height="24" rx="3"/>
      <path fill="#1565C0" d="M15 12h18l-6 24h-18z" opacity="0.8"/>
    </svg>
  ),
  unknown: (
    <CreditCard className="w-6 h-6 text-slate-400" />
  ),
};

export const CardInput: React.FC<CardInputProps> = ({
  onCardChange,
  onExpiryChange,
  onCVCChange,
  onCardNameChange,
  cardNumberError,
  expiryError,
  cvcError,
  cardNameError,
  showCardName = true,
  className = '',
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCVC] = useState('');
  const [cardName, setCardName] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);

  // Detect card type
  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);
  const maxLength = useMemo(() => getMaxCardLength(cardType), [cardType]);
  const cvcLength = cardType === 'amex' ? 4 : 3;

  // Handle card number input
  const handleCardNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '');
    
    // Limit to max length
    if (digitsOnly.length > maxLength) return;
    
    const formatted = formatCardNumber(digitsOnly);
    setCardNumber(formatted);
    
    const isValid = digitsOnly.length >= 13 && validateCardNumber(digitsOnly);
    onCardChange?.(digitsOnly, isValid);
  }, [maxLength, onCardChange]);

  // Handle expiry input
  const handleExpiryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length > 4) return;
    
    const formatted = formatExpiry(digitsOnly);
    setExpiry(formatted);
    
    const isValid = digitsOnly.length === 4 && validateExpiry(formatted);
    onExpiryChange?.(formatted, isValid);
  }, [onExpiryChange]);

  // Handle CVC input
  const handleCVCChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    
    if (value.length > cvcLength) return;
    
    setCVC(value);
    
    const isValid = validateCVC(value, cardType);
    onCVCChange?.(value, isValid);
  }, [cvcLength, cardType, onCVCChange]);

  // Handle card name input
  const handleCardNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCardName(value);
    onCardNameChange?.(value);
  }, [onCardNameChange]);

  const inputBaseClass = `w-full p-3 rounded-lg border bg-white dark:bg-slate-900 dark:text-white 
    focus:outline-none focus:ring-2 transition-all`;
  
  const getInputClass = (fieldName: string, error?: string) => {
    if (error) {
      return `${inputBaseClass} border-red-500 focus:ring-red-200`;
    }
    if (isFocused === fieldName) {
      return `${inputBaseClass} border-uk-blue focus:ring-uk-blue`;
    }
    return `${inputBaseClass} border-slate-200 dark:border-slate-600 focus:ring-uk-blue`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Card Type Badge */}
      {cardType !== 'unknown' && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          {CardIcons[cardType]}
          <span className="font-medium">{cardBrandNames[cardType]} detected</span>
        </div>
      )}

      {/* Cardholder Name */}
      {showCardName && (
        <div>
          <label className="block text-sm font-bold mb-1 dark:text-slate-300">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardName}
            onChange={handleCardNameChange}
            onFocus={() => setIsFocused('cardName')}
            onBlur={() => setIsFocused(null)}
            placeholder="NAME ON CARD"
            className={getInputClass('cardName', cardNameError)}
            autoComplete="cc-name"
          />
          {cardNameError && (
            <p className="text-red-500 text-xs mt-1">{cardNameError}</p>
          )}
        </div>
      )}

      {/* Card Number */}
      <div>
        <label className="block text-sm font-bold mb-1 dark:text-slate-300">
          Card Number
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {CardIcons[cardType]}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onFocus={() => setIsFocused('cardNumber')}
            onBlur={() => setIsFocused(null)}
            placeholder="0000 0000 0000 0000"
            className={`${getInputClass('cardNumber', cardNumberError)} pl-14`}
            autoComplete="cc-number"
          />
        </div>
        {cardNumberError && (
          <p className="text-red-500 text-xs mt-1">{cardNumberError}</p>
        )}
      </div>

      {/* Expiry and CVC Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-bold mb-1 dark:text-slate-300">
            Expiry Date
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={handleExpiryChange}
            onFocus={() => setIsFocused('expiry')}
            onBlur={() => setIsFocused(null)}
            placeholder="MM/YY"
            className={getInputClass('expiry', expiryError)}
            autoComplete="cc-exp"
          />
          {expiryError && (
            <p className="text-red-500 text-xs mt-1">{expiryError}</p>
          )}
        </div>

        {/* CVC */}
        <div>
          <label className="block text-sm font-bold mb-1 dark:text-slate-300">
            CVC
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={handleCVCChange}
              onFocus={() => setIsFocused('cvc')}
              onBlur={() => setIsFocused(null)}
              placeholder={cardType === 'amex' ? '0000' : '000'}
              className={`${getInputClass('cvc', cvcError)} pl-10`}
              autoComplete="cc-csc"
            />
          </div>
          {cvcError && (
            <p className="text-red-500 text-xs mt-1">{cvcError}</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-4">
        <Lock size={12} />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </div>
  );
};

export default CardInput;
