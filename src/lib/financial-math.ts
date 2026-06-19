import { Decimal } from 'decimal.js';

/**
 * Utility for safe financial calculations.
 * Always returns values in cents (integers).
 */
export const FinancialMath = {
  /**
   * Calculates total price given unit price in cents and quantity.
   * Handles decimal quantities (e.g., kilograms) with precision.
   */
  calculateTotal(priceInCents: number, quantity: number | string | Decimal): number {
    const price = new Decimal(priceInCents);
    const qty = new Decimal(quantity);
    
    // We multiply and round to the nearest integer (cents)
    return price.times(qty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  },

  /**
   * Sums multiple values in cents safely.
   */
  sum(valuesInCents: number[]): number {
    return valuesInCents.reduce((acc, val) => acc + val, 0);
  },

  /**
   * Applies a discount to a total, ensuring it doesn't go below zero.
   */
  applyDiscount(totalInCents: number, discountInCents: number): number {
    const result = totalInCents - discountInCents;
    return Math.max(0, result);
  }
};
