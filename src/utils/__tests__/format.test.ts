import { formatCurrency, initials } from '../format';

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
