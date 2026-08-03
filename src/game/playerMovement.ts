import { ARENA_SIZE, moveAroundWalls } from './arenaMap';
import { getFighter } from './catalog';
import { getHyperProfile } from './abilities';
import type { Controls, GameState } from './types';

const PLAYER_RADIUS = 27;
const ACCELERATION = 18;
const BRAKING = 24;

export function updatePlayerMovement(state: GameState, controls: Controls, dt: number) {
  const horizontal = Number(controls.keys.has('d')) - Number(controls.keys.has('a'));
  const vertical = Number(controls.keys.has('s')) - Number(controls.keys.has('w'));
  const directionLength = Math.hypot(horizontal, vertical);
  const now = performance.now();
  const fighter = getFighter(state.loadout.fighterId);
  const hyperSpeed = now < state.hyperUntil ? getHyperProfile(state.loadout.fighterId).speed : 1;
  const superSpeed = now < state.speedBoostUntil ? 1.9 : 1;
  const maxSpeed = (fighter.speed + state.loadout.speedLevel * 13
    + (state.loadout.fighterLevel - 1) * 2) * hyperSpeed * superSpeed * 1.25;
  const targetX = directionLength ? horizontal / directionLength * maxSpeed : 0;
  const targetY = directionLength ? vertical / directionLength * maxSpeed : 0;
  const response = directionLength ? ACCELERATION : BRAKING;
  const blend = 1 - Math.exp(-response * dt);

  state.playerVelocity.x += (targetX - state.playerVelocity.x) * blend;
  state.playerVelocity.y += (targetY - state.playerVelocity.y) * blend;
  if (!directionLength && Math.hypot(state.playerVelocity.x, state.playerVelocity.y) < 1) {
    state.playerVelocity.x = 0;
    state.playerVelocity.y = 0;
  }

  const dx = state.playerVelocity.x * dt;
  const dy = state.playerVelocity.y * dt;
  const next = state.loadout.fighterId === 'spirit'
    ? {
      x: Math.max(PLAYER_RADIUS, Math.min(ARENA_SIZE - PLAYER_RADIUS, state.player.x + dx)),
      y: Math.max(PLAYER_RADIUS, Math.min(ARENA_SIZE - PLAYER_RADIUS, state.player.y + dy)),
    }
    : moveAroundWalls(state.player.x, state.player.y, dx, dy, PLAYER_RADIUS, state.battleMode);

  if (next.x === state.player.x && dx !== 0) state.playerVelocity.x = 0;
  if (next.y === state.player.y && dy !== 0) state.playerVelocity.y = 0;
  state.player.x = next.x;
  state.player.y = next.y;
}
