/**
 * Decimal arithmetic utility for precise financial calculations
 * Prevents floating-point arithmetic errors in wallet transactions
 */

// Convert a number to fixed decimal places (for storage and calculations)
export function toDecimal(value: number | string, decimals: number = 8): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return '0';
  }
  
  // Use toFixed to ensure consistent decimal places
  return num.toFixed(decimals);
}

// Add two decimal numbers safely
export function addDecimals(a: number | string, b: number | string, decimals: number = 8): string {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  if (isNaN(numA) || !isFinite(numA) || isNaN(numB) || !isFinite(numB)) {
    throw new Error('Invalid decimal input');
  }
  
  // Multiply by 10^decimals to work with integers
  const multiplier = Math.pow(10, decimals);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  
  // Add as integers and convert back
  const result = (intA + intB) / multiplier;
  return result.toFixed(decimals);
}

// Subtract decimal numbers safely (a - b)
export function subtractDecimals(a: number | string, b: number | string, decimals: number = 8): string {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  if (isNaN(numA) || !isFinite(numA) || isNaN(numB) || !isFinite(numB)) {
    throw new Error('Invalid decimal input');
  }
  
  // Multiply by 10^decimals to work with integers
  const multiplier = Math.pow(10, decimals);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  
  // Subtract as integers and convert back
  const result = (intA - intB) / multiplier;
  return result.toFixed(decimals);
}

// Multiply decimal numbers safely
export function multiplyDecimals(a: number | string, b: number | string, decimals: number = 8): string {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  if (isNaN(numA) || !isFinite(numA) || isNaN(numB) || !isFinite(numB)) {
    throw new Error('Invalid decimal input');
  }
  
  // Multiply and round to prevent floating point errors
  const result = numA * numB;
  return result.toFixed(decimals);
}

// Divide decimal numbers safely (a / b)
export function divideDecimals(a: number | string, b: number | string, decimals: number = 8): string {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  if (isNaN(numA) || !isFinite(numA) || isNaN(numB) || !isFinite(numB)) {
    throw new Error('Invalid decimal input');
  }
  
  if (numB === 0) {
    throw new Error('Division by zero');
  }
  
  // Divide and round to prevent floating point errors
  const result = numA / numB;
  return result.toFixed(decimals);
}

// Compare decimal numbers (returns -1 if a < b, 0 if a = b, 1 if a > b)
export function compareDecimals(a: number | string, b: number | string, decimals: number = 8): number {
  const numA = typeof a === 'string' ? parseFloat(a) : a;
  const numB = typeof b === 'string' ? parseFloat(b) : b;
  
  if (isNaN(numA) || !isFinite(numA) || isNaN(numB) || !isFinite(numB)) {
    throw new Error('Invalid decimal input');
  }
  
  // Use epsilon for comparison to handle floating point imprecision
  const epsilon = Math.pow(10, -decimals);
  const diff = numA - numB;
  
  if (Math.abs(diff) < epsilon) {
    return 0; // Equal
  }
  
  return diff < 0 ? -1 : 1;
}

// Check if a decimal is greater than another
export function isGreaterThan(a: number | string, b: number | string, decimals: number = 8): boolean {
  return compareDecimals(a, b, decimals) > 0;
}

// Check if a decimal is less than another
export function isLessThan(a: number | string, b: number | string, decimals: number = 8): boolean {
  return compareDecimals(a, b, decimals) < 0;
}

// Check if a decimal is equal to another
export function isEqual(a: number | string, b: number | string, decimals: number = 8): boolean {
  return compareDecimals(a, b, decimals) === 0;
}

// Check if a decimal is greater than or equal to another
export function isGreaterOrEqual(a: number | string, b: number | string, decimals: number = 8): boolean {
  return compareDecimals(a, b, decimals) >= 0;
}

// Check if a decimal is less than or equal to another
export function isLessOrEqual(a: number | string, b: number | string, decimals: number = 8): boolean {
  return compareDecimals(a, b, decimals) <= 0;
}

// Calculate percentage (a% of b)
export function percentageOf(percentage: number | string, amount: number | string, decimals: number = 8): string {
  const percentNum = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(percentNum) || !isFinite(percentNum) || isNaN(amountNum) || !isFinite(amountNum)) {
    throw new Error('Invalid decimal input');
  }
  
  const result = (percentNum / 100) * amountNum;
  return result.toFixed(decimals);
}

// Round to nearest integer (for display purposes)
export function roundToInt(value: number | string): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  return Math.round(num);
}

// Format for display with thousand separators
export function formatForDisplay(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Validate if a value is a valid decimal
export function isValidDecimal(value: any): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && value.trim() !== '';
  }
  
  return false;
}

// Currency-specific configurations
export const CURRENCY_DECIMALS = {
  mind_gems: 0,    // Mind Gems are integers
  fluxon: 8,       // Fluxon uses 8 decimal places
  usd: 2,          // USD uses 2 decimal places
  default: 8       // Default precision
};

// Get the appropriate decimal places for a currency
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency as keyof typeof CURRENCY_DECIMALS] || CURRENCY_DECIMALS.default;
}

// Format a value for a specific currency
export function formatCurrency(value: number | string, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  return toDecimal(value, decimals);
}

// Add amounts in a specific currency
export function addCurrency(a: number | string, b: number | string, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  return addDecimals(a, b, decimals);
}

// Subtract amounts in a specific currency
export function subtractCurrency(a: number | string, b: number | string, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  return subtractDecimals(a, b, decimals);
}

// Multiply amount by a factor for a specific currency
export function multiplyCurrency(amount: number | string, factor: number | string, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  return multiplyDecimals(amount, factor, decimals);
}

// Compare currency amounts
export function compareCurrency(a: number | string, b: number | string, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  return compareDecimals(a, b, decimals);
}
