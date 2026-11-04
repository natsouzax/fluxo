import { formatCurrency, initials, parseMoney, safeRatio } from '../format';

// pt-BR currency output separates the symbol with a non-breaking space, and the
// exact codepoint varies by ICU version — compare on normalised whitespace.
const normalize = (value: string) => value.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('formats BRL with the pt-BR convention', () => {
    expect(normalize(formatCurrency(4238.56))).toBe('R$ 4.238,56');
  });

  it('keeps the sign on negative balances (credit card invoices)', () => {
    expect(normalize(formatCurrency(-1876.4))).toBe('-R$ 1.876,40');
  });

  it('honours a non-default currency', () => {
    expect(normalize(formatCurrency(10, 'USD'))).toContain('10,00');
  });
});

describe('safeRatio', () => {
  it('returns the plain ratio for a normal goal', () => {
    expect(safeRatio(50, 200)).toBe(0.25);
  });

  it('returns 0 instead of Infinity when the target is 0', () => {
    expect(safeRatio(100, 0)).toBe(0);
  });

  it('returns 0 instead of NaN when both values are 0', () => {
    expect(safeRatio(0, 0)).toBe(0);
  });

  it('returns 0 for a negative target', () => {
    expect(safeRatio(10, -5)).toBe(0);
  });

  it('clamps a negative numerator to 0', () => {
    expect(safeRatio(-10, 100)).toBe(0);
  });

  it('allows ratios above 1 so overspending stays visible', () => {
    expect(safeRatio(150, 100)).toBe(1.5);
  });

  it('returns 0 for non-finite input', () => {
    expect(safeRatio(NaN, 100)).toBe(0);
    expect(safeRatio(100, Infinity)).toBe(0);
  });
});

describe('parseMoney', () => {
  it('parses Brazilian decimal and thousands separators', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('75,90')).toBe(75.9);
  });

  it('accepts decimal dots and rejects empty or malformed values', () => {
    expect(parseMoney('75.90')).toBe(75.9);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Natan Souza')).toBe('NS');
  });

  it('handles a single name', () => {
    expect(initials('Natan')).toBe('N');
  });

  it('ignores extra whitespace', () => {
    expect(initials('  Ana   Maria  Silva ')).toBe('AM');
  });

  it('returns an empty string for an empty name', () => {
    expect(initials('')).toBe('');
  });
});
