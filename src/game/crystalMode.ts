import { ARENA_SIZE } from './arenaMap';
import type { ArenaCrystal, Enemy, Fighter, GameState } from './types';

const WIN_CRYSTALS = 10;
const HOLD_TIME = 15_000;

const crystalCount = (fighters: Enemy[]) => (
  fighters.reduce((total, fighter) => total + (fighter.crystals ?? 0), 0)
);

export const getTeamCrystalCount = (state: GameState, team: 'player' | 'enemy') => (
  team === 'player'
    ? state.playerCrystals + crystalCount(state.allies)
    : crystalCount(state.enemies)
);

export function updateCrystalMode(state: GameState) {
  if (state.battleMode !== '3v3') return;
  const now = performance.now();
  if (now - state.lastCrystalSpawn >= 2500 && state.crystals.length < 8) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 35 + Math.random() * 115;
    state.crystals.push({
      id: now,
      x: ARENA_SIZE / 2 + Math.cos(angle) * distance,
      y: ARENA_SIZE / 2 + Math.sin(angle) * distance,
    });
    state.lastCrystalSpawn = now;
  }

  collectNearby(state, state.player, 'player');
  for (const ally of state.allies) collectNearby(state, ally, 'player');
  for (const enemy of state.enemies) collectNearby(state, enemy, 'enemy');

  const playerCount = getTeamCrystalCount(state, 'player');
  const enemyCount = getTeamCrystalCount(state, 'enemy');
  const leader = playerCount >= WIN_CRYSTALS ? 'player'
    : enemyCount >= WIN_CRYSTALS ? 'enemy' : null;

  if (!leader) {
    state.crystalCountdownTeam = null;
    state.crystalCountdownEnd = 0;
    return;
  }
  if (state.crystalCountdownTeam !== leader) {
    state.crystalCountdownTeam = leader;
    state.crystalCountdownEnd = now + HOLD_TIME;
  }
  if (now < state.crystalCountdownEnd) return;
  finishCrystalBattle(state, leader);
}

function collectNearby(state: GameState, fighter: Fighter, team: 'player' | 'enemy') {
  if (fighter.health <= 0) return;
  const crystal = state.crystals.find((item) => (
    Math.hypot(item.x - fighter.x, item.y - fighter.y) < 38
  ));
  if (!crystal) return;
  state.crystals = state.crystals.filter((item) => item.id !== crystal.id);
  if (fighter === state.player) state.playerCrystals += 1;
  else fighter.crystals = (fighter.crystals ?? 0) + 1;
  if (team === 'player' && fighter === state.player) state.score += 1;
}

export function dropCrystals(state: GameState, fighter: Fighter) {
  const count = fighter === state.player ? state.playerCrystals : fighter.crystals ?? 0;
  if (count === 0) return;
  const dropped: ArenaCrystal[] = Array.from({ length: count }, (_, index) => ({
    id: performance.now() + index,
    x: fighter.x + Math.cos(index * 2.4) * 25,
    y: fighter.y + Math.sin(index * 2.4) * 25,
  }));
  state.crystals.push(...dropped);
  if (fighter === state.player) state.playerCrystals = 0;
  else fighter.crystals = 0;
}

function finishCrystalBattle(state: GameState, winner: 'player' | 'enemy') {
  state.gameOver = true;
  state.result = winner === 'player' ? 'victory' : 'defeat';
  state.rubiesEarned = winner === 'player' ? 5 : -2;
}
