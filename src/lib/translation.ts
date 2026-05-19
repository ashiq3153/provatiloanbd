const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts English digits (0-9) to Bangla digits (০-৯) or vice versa.
 */
export const convertDigits = (val: string | number | null | undefined, isBn: boolean): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str
    .split('')
    .map((char) => {
      if (isBn) {
        const idx = enDigits.indexOf(char);
        return idx !== -1 ? bnDigits[idx] : char;
      } else {
        const idx = bnDigits.indexOf(char);
        return idx !== -1 ? enDigits[idx] : char;
      }
    })
    .join('');
};

/**
 * Formats a number with Indian/Bangladeshi style grouping commas and prepends the Taka symbol.
 */
export const formatCurrency = (amount: number | string | null | undefined, isBn: boolean): string => {
  if (amount === null || amount === undefined) return isBn ? '৳ ০' : '৳ 0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  
  // Format with Indian locale grouping (e.g. 1,00,000)
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
  
  return isBn ? `৳${convertDigits(formatted, true)}` : `৳${convertDigits(formatted, false)}`;
};

/**
 * Formats plain numbers with commas (e.g., total count of users) localized.
 */
export const formatNumber = (val: number | string | null | undefined, isBn: boolean): string => {
  if (val === null || val === undefined) return '0';
  const str = typeof val === 'number' ? val.toLocaleString('en-IN') : String(val);
  return convertDigits(str, isBn);
};
