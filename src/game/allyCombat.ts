import { ARENA_SIZE, moveAroundWalls, territoryZones } from './arenaMap';
import type { GameState } from './types';
import { dropCrystals } from './crystalMode';
import { fireBotAttack } from './botAbilities';
import { getElement } from './catalog';
import { getHyperProfile } from './abilities';
import { ATTACK_POWER } from './combatBalance';

export function updateAllies(state: GameState, dt: number) {
  for (const ally of state.allies) {
    const nearbyEnemy = [...state.enemies].sort((a, b) => (
      Math.hypot(a.x - ally.x, a.y - ally.y) - Math.hypot(b.x - ally.x, b.y - ally.y)
    ))[0];
    const nearestCrystal = [...state.crystals].sort((a, b) => (
      Math.hypot(a.x - ally.x, a.y - ally.y) - Math.hypot(b.x - ally.x, b.y - ally.y)
    ))[0];
    const enemyIsClose = nearbyEnemy
      && Math.hypot(nearbyEnemy.x - ally.x, nearbyEnemy.y - ally.y) < 300;
    const carriesBall = state.battleMode === 'football'
      && state.footballBall.ownerTeam === 'player' && state.footballBall.ownerId === ally.id;
    const enemyCarrier = state.battleMode === 'football' && state.footballBall.ownerTeam === 'enemy'
      ? state.enemies.find(({ id }) => id === state.footballBall.ownerId)
      : undefined;
    const teammateCarries = state.battleMode === 'football'
      && state.footballBall.ownerTeam === 'player' && !carriesBall;
    const target = carriesBall
      ? { x: 1590, y: 800, health: 1, maxHealth: 1, angle: 0 }
      : enemyCarrier
        ? enemyCarrier
      : teammateCarries
        ? { x: 1120, y: ally.id % 2 ? 570 : 1030, health: 1, maxHealth: 1, angle: 0 }
      : state.battleMode === 'football' && state.footballBall.ownerTeam === null
        ? { ...state.footballBall, health: 1, maxHealth: 1, angle: 0 }
      : state.battleMode === '3v3' && !enemyIsClose && nearestCrystal
      ? { ...nearestCrystal, health: 1, maxHealth: 1, angle: 0 }
      : state.battleMode === '3v3' && !enemyIsClose && !nearestCrystal
        ? { x: ARENA_SIZE / 2, y: ARENA_SIZE / 2, health: 1, maxHealth: 1, angle: 0 }
      : state.battleMode === 'territory'
      && (!nearbyEnemy || Math.hypot(nearbyEnemy.x - ally.x, nearbyEnemy.y - ally.y) > 360)
      ? { ...territoryZones.enemy, health: 1, maxHealth: 1, angle: 0 }
      : nearbyEnemy;
    if (!target) continue;
    const isCapturing = target !== nearbyEnemy;
    const dx = target.x - ally.x;
    const dy = target.y - ally.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    ally.angle = Math.atan2(dy, dx);
    if (ally.health < ally.maxHealth * 0.3) {
      const next = moveAroundWalls(
        ally.x, ally.y, -dx / distance * 90 * dt,
        -dy / distance * 90 * dt, 24, state.battleMode,
      );
      ally.x = next.x;
      ally.y = next.y;
      ally.health = Math.min(ally.maxHealth, ally.health + 5 * dt);
    } else if (distance > (isCapturing ? 55 : 310)) {
      const next = moveAroundWalls(
        ally.x, ally.y, dx / distance * 82 * dt * ally.speedPower,
        dy / distance * 82 * dt * ally.speedPower, 24, state.battleMode,
      );
      ally.x = next.x;
      ally.y = next.y;
    } else {
      const direction = Math.sin(performance.now() / 700 + ally.id) > 0 ? 1 : -1;
      const next = moveAroundWalls(
        ally.x, ally.y, -dy / distance * 52 * dt * direction,
        dx / distance * 52 * dt * direction, 24, state.battleMode,
      );
      ally.x = next.x;
      ally.y = next.y;
    }
    const hyper = performance.now() < ally.hyperUntil;
    const cooldown = getElement(ally.fighterId).cooldown
      * (hyper ? getHyperProfile(ally.fighterId).cooldown : 1)
      * (ally.fighterId === 'riot' ? 1.3 : 1)
      * ally.cooldownPower;
    if (nearbyEnemy && !isCapturing && distance < 460
      && performance.now() - ally.lastAttack > cooldown) {
      ally.lastAttack = performance.now();
      fireBotAttack(state, ally, nearbyEnemy, 'player', ATTACK_POWER * ally.damagePower);
    }
    ally.hitFlash = Math.max(0, ally.hitFlash - dt);
  }
  for (const ally of state.allies.filter((fighter) => fighter.health <= 0)) {
    dropCrystals(state, ally);
    if (state.battleMode === 'football') {
      ally.health = ally.maxHealth; ally.x = 220; ally.y = 800;
    }
  }
  if (state.battleMode !== 'football') state.allies = state.allies.filter((ally) => ally.health > 0);
}
