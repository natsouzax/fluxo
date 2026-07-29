export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value);
}

/**
 * Progress as a 0..1 ratio. A zero or missing denominator (a goal with no
 * target, a budget with no limit) would otherwise yield Infinity or NaN and
 * render as "Infinity%" or an empty progress bar.
 */
export function safeRatio(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.max(0, part / whole);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
