import { TabParamList } from '../navigation/types';

type Destination = Exclude<keyof TabParamList, 'Chat'>;
export interface AssistantNavigation { destination: Destination; reply: string }

const areas: { destination: Destination; terms: RegExp; label: string }[] = [
  { destination: 'Home', terms: /\b(financas|financeiro|financeira|saldo|gastos|despesas|orcamentos|dinheiro|contas)\b/, label: 'Finanças' },
  { destination: 'Agenda', terms: /\b(rotina|agenda|calendario|compromissos|horarios)\b/, label: 'Rotina' },
  { destination: 'Notes', terms: /\b(notas|anotacoes|anotacao|nota)\b/, label: 'Notas' },
  { destination: 'Settings', terms: /\b(ajustes|configuracoes|configuracao|conexoes)\b/, label: 'Ajustes' },
];

export function assistantNavigation(input: string): AssistantNavigation | null {
  const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (/\b(nao|nunca|sem)\b/.test(normalized)) return null;
  const matching = areas.filter((area) => area.terms.test(normalized));
  if (matching.length !== 1) return null;
  // Questions stay in chat. Only explicit navigation requests or an area name open a tab.
  const areaOnly = /^(financas|rotina|agenda|calendario|notas|anotacoes|ajustes|configuracoes)[.!?]?$/.test(normalized);
  const explicit = /\b(abrir|abra|abre|ver|veja|mostrar|mostre|ir para|ir pra|me lev[ae]|acessar|organizar|consultar)\b/.test(normalized);
  if (!areaOnly && !explicit) return null;
  const area = matching[0];
  return { destination: area.destination, reply: `Vou abrir ${area.label} para você. Pode voltar ao Fluxo para continuar a conversa.` };
}
