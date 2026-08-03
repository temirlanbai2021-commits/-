export type BattleMode = 'territory' | 'solo' | '2v2' | '3v3' | 'football' | 'friendly';

export const battleModes = [
  { id: 'territory' as const, title: 'Захват территории', subtitle: 'Удерживай базу соперника', icon: '🚩', color: '#ef5350' },
  { id: 'solo' as const, title: 'Столкновение', subtitle: 'Каждый сам за себя', icon: '☠️', color: '#75ad54' },
  { id: '2v2' as const, title: 'Парный бой', subtitle: 'Команда 2 на 2', icon: '⚔️', color: '#8a68d8' },
  { id: '3v3' as const, title: 'Кристальный бой', subtitle: 'Собери 10 и удержи 15 секунд', icon: '💎', color: '#377fc8' },
  { id: 'football' as const, title: 'Футбол', subtitle: 'Забей два гола', icon: '⚽', color: '#24a866' },
];

export function getEnemyCount(mode: BattleMode) {
  if (mode === 'friendly') return 0;
  if (mode === 'territory') return 3;
  if (mode === '2v2') return 2;
  if (mode === '3v3') return 3;
  if (mode === 'football') return 3;
  return 10;
}
