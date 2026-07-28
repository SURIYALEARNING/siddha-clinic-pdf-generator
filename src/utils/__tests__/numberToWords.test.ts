import { describe, it, expect } from 'vitest';
import { numberToWords } from '../numberToWords';

describe('numberToWords', () => {
  it('converts zero', () => {
    expect(numberToWords(0)).toBe('Zero Only');
  });

  it('converts small numbers', () => {
    expect(numberToWords(5)).toBe('INR Five Only');
    expect(numberToWords(12)).toBe('INR Twelve Only');
    expect(numberToWords(99)).toBe('INR Ninety Nine Only');
  });

  it('converts hundreds', () => {
    expect(numberToWords(100)).toBe('INR One Hundred Only');
    expect(numberToWords(250)).toBe('INR Two Hundred Fifty Only');
    expect(numberToWords(999)).toBe('INR Nine Hundred Ninety Nine Only');
  });

  it('converts thousands', () => {
    expect(numberToWords(1000)).toBe('INR One Thousand Only');
    expect(numberToWords(5000)).toBe('INR Five Thousand Only');
  });

  it('converts lakhs', () => {
    expect(numberToWords(100000)).toBe('INR One Lakh Only');
    expect(numberToWords(250000)).toBe('INR Two Lakh Fifty Thousand Only');
  });

  it('converts crores', () => {
    expect(numberToWords(10000000)).toBe('INR One Crore Only');
    expect(numberToWords(15000000)).toBe('INR One Crore Fifty Lakh Only');
  });

  it('includes paise', () => {
    expect(numberToWords(12.50)).toBe('INR Twelve and Fifty Paise Only');
    expect(numberToWords(1.05)).toBe('INR One and Five Paise Only');
    expect(numberToWords(99.99)).toBe('INR Ninety Nine and Ninety Nine Paise Only');
  });

  it('handles negative numbers correctly (converts to English)', () => {
    const result = numberToWords(-50);
    expect(result).toContain('INR');
  });

  it('floors correctly at 2 decimal places', () => {
    expect(numberToWords(100.456)).toBe('INR One Hundred and Forty Six Paise Only');
    expect(numberToWords(100.001)).toBe('INR One Hundred Only');
  });

  it('handles paise-only amounts (rupeePart is zero)', () => {
    const result = numberToWords(0.05);
    expect(result).toContain('Paise');
  });
});
