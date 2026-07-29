import { FinanceSnapshot, offlineFallbackReply, toApiHistory } from '../aiService';

describe('toApiHistory', () => {
  it('drops the leading assistant greeting so the first message is a user turn', () => {
    const result = toApiHistory([
      { role: 'assistant', content: 'Oi! Eu sou a IA da Fluxo.' },
      { role: 'user', content: 'Quanto tenho?' },
    ]);

    expect(result).toEqual([{ role: 'user', content: 'Quanto tenho?' }]);
  });

  it('returns an empty history when the user has not spoken yet', () => {
    expect(toApiHistory([{ role: 'assistant', content: 'Oi!' }])).toEqual([]);
  });

  it('merges consecutive turns from the same role', () => {
    const result = toApiHistory([
      { role: 'user', content: 'Oi' },
      { role: 'user', content: 'Quanto gastei?' },
      { role: 'assistant', content: 'R$ 100' },
      { role: 'assistant', content: 'em alimentação' },
    ]);

    expect(result).toEqual([
      { role: 'user', content: 'Oi\n\nQuanto gastei?' },
      { role: 'assistant', content: 'R$ 100\n\nem alimentação' },
    ]);
  });

  it('skips blank messages and trims whitespace', () => {
    const result = toApiHistory([
      { role: 'user', content: '   ' },
      { role: 'user', content: '  Onde cortar gastos?  ' },
    ]);

    expect(result).toEqual([{ role: 'user', content: 'Onde cortar gastos?' }]);
  });

  it('preserves an already valid alternating history', () => {
    const history = [
      { role: 'user' as const, content: 'A' },
      { role: 'assistant' as const, content: 'B' },
      { role: 'user' as const, content: 'C' },
    ];

    expect(toApiHistory(history)).toEqual(history);
  });
});

describe('offlineFallbackReply', () => {
  const snapshot: FinanceSnapshot = {
    accounts: [
      { id: 'a', institution: 'Banco', kind: 'checking', nickname: 'Conta', balance: 1000, currency: 'BRL', color: '#000', lastSyncedAt: null, isMock: true },
    ],
    transactions: [],
    budgets: [],
    goals: [],
    notes: [],
  };

  it('answers balance questions from the snapshot', () => {
    expect(offlineFallbackReply('qual meu saldo?', snapshot)).toContain('1.000');
  });

  it('ignores budgets with a zero limit instead of dividing by zero', () => {
    const reply = offlineFallbackReply('como estão meus gastos?', {
      ...snapshot,
      budgets: [{ id: 'b0', category: 'Vazio', limit: 0, spent: 50, color: '#000' }],
    });

    expect(reply).not.toMatch(/NaN|Infinity/);
  });

  it('picks the budget closest to its limit', () => {
    const reply = offlineFallbackReply('meus gastos', {
      ...snapshot,
      budgets: [
        { id: 'b1', category: 'Lazer', limit: 100, spent: 20, color: '#000' },
        { id: 'b2', category: 'Alimentação', limit: 100, spent: 90, color: '#000' },
      ],
    });

    expect(reply).toContain('Alimentação');
    expect(reply).toContain('90%');
  });

  it('tells the user how to enable the real AI when nothing matches', () => {
    expect(offlineFallbackReply('bom dia', snapshot)).toContain('Ajustes');
  });
});
