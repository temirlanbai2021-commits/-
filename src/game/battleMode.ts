export type BattleMode = 'solo' | '2v2' | '3v3';

export const battleModes: { id: BattleMode; title: string; subtitle: string }[] = [
  { id: 'solo', title: 'Каждый сам за себя', subtitle: '7 соперников' },
  { id: '2v2', title: '2 на 2', subtitle: 'Командный бой' },
  { id: '3v3', title: '3 на 3', subtitle: 'Большая команда' },
];

export function getEnemyCount(mode: BattleMode) {
  if (mode === '2v2') return 2;
  if (mode === '3v3') return 3;
  return 7;
}
