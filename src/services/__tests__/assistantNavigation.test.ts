import { assistantNavigation } from '../assistantNavigation';

it.each([
  ['Quero ver minhas finanças', 'Home'], ['Quero organizar minha rotina', 'Agenda'],
  ['Abrir minhas notas', 'Notes'], ['Me leve para as configurações', 'Settings'], ['Rotina', 'Agenda'],
])('routes explicit requests: %s', (message, destination) => {
  expect(assistantNavigation(message)?.destination).toBe(destination);
});

it.each(['Quanto gastei hoje?', 'Não quero abrir notas', 'Abrir finanças e agenda', 'gastei 35 no almoço',
  'Qual compromisso custa mais dinheiro?'])('keeps questions and ambiguous or negated requests in chat: %s', (message) => {
  expect(assistantNavigation(message)).toBeNull();
});
