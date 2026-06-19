import { describe, it, expect } from 'vitest';
import { FinancialMath } from '../../src/lib/financial-math.js';

describe('PDV Financial Calculations', () => {
  describe('Total Calculation', () => {
    it('should calculate simple integer totals correctly', () => {
      expect(FinancialMath.calculateTotal(1000, 2)).toBe(2000); // $10.00 * 2 = $20.00
    });

    it('should handle decimal quantities (weight) correctly', () => {
      expect(FinancialMath.calculateTotal(1000, 0.5)).toBe(500); // $10.00 * 0.5kg = $5.00
      expect(FinancialMath.calculateTotal(1000, 0.15)).toBe(150); // $10.00 * 0.15kg = $1.50
    });

    it('should round correctly according to standard rules (ROUND_HALF_UP)', () => {
      // 1001 * 0.333 = 333.333 -> 333
      expect(FinancialMath.calculateTotal(1001, 0.333)).toBe(333);
      
      // 1001 * 0.3335 = 333.8335 -> 334
      expect(FinancialMath.calculateTotal(1001, 0.3335)).toBe(334);
    });

    it('should avoid floating point precision issues', () => {
      // 0.1 + 0.2 in JS is 0.30000000000000004
      const price = 300; // $3.00
      const qty = 0.1 + 0.2; 
      
      // Traditional approach might fail in more complex scenarios, 
      // but Decimal.js handles the precision of the input float better.
      expect(FinancialMath.calculateTotal(price, qty)).toBe(90); 
    });

    it('should handle very small quantities and large prices', () => {
      // Price $100.00 (10000 cents), qty 0.001 (1 gram)
      expect(FinancialMath.calculateTotal(10000, 0.001)).toBe(10); // 10 cents
    });
  });

  describe('Discount and Sums', () => {
    it('should sum items correctly', () => {
      expect(FinancialMath.sum([100, 200, 350])).toBe(650);
    });

    it('should apply discounts correctly', () => {
      expect(FinancialMath.applyDiscount(1000, 100)).toBe(900);
      expect(FinancialMath.applyDiscount(1000, 1200)).toBe(0); // Cannot be negative
    });
  });
});
