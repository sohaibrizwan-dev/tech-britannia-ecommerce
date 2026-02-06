export const formatGBP = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(amount);
};

export const calculateVAT = (price: number) => {
  const rate = 0.20; // 20% UK VAT
  return price * (rate / (1 + rate));
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};