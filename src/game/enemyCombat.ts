import type { Enemy, Fighter, GameState } from './types';
import { ARENA_SIZE, moveAroundWalls, territoryZones } from './arenaMap';
import { getElement } from './catalog';
import { getHyperProfile } from './abilities';
import { fireBotAttack } from './botAbilities';
import { ATTACK_POWER } from './combatBalance';

type Target = Fighter & { enemy?: Enemy; ally?: Enemy; objective?: boolean };

function territoryTarget(state: GameState, attacker: Enemy): Target {
  const opponents: Target[] = [
    ...(state.player.health > 0 && performance.now() >= state.invisibleUntil
      ? [{ ...state.player }] : []),
    ...state.allies.filter((ally) => ally.health > 0).map((ally) => ({ ...ally, ally })),
  ];
  const closestOpponent = opponents.sort((a, b) => (
    Math.hypot(a.x - attacker.x, a.y - attacker.y)
    - Math.hypot(b.x - attacker.x, b.y - attacker.y)
  ))[0];
  const isDefender = attacker.id % 3 === 0;

  if (isDefender) {
    const baseThreat = opponents
      .filter((opponent) => Math.hypot(
        opponent.x - territoryZones.enemy.x,
        opponent.y - territoryZones.enemy.y,
      ) < 390)
      .sort((a, b) => (
        Math.hypot(a.x - territoryZones.enemy.x, a.y - territoryZones.enemy.y)
        - Math.hypot(b.x - territoryZones.enemy.x, b.y - territoryZones.enemy.y)
      ))[0];
    return baseThreat
      ?? { ...territoryZones.enemy, health: 1, maxHealth: 1, angle: 0, objective: true };
  }

  if (closestOpponent
    && Math.hypot(closestOpponent.x - attacker.x, closestOpponent.y - attacker.y) < 320) {
    return closestOpponent;
  }
  return { ...territoryZones.player, health: 1, maxHealth: 1, angle: 0, objective: true };
}

function closestTarget(state: GameState, attacker: Enemy): Target {
  if (state.battleMode === 'football') {
    const carriesBall = state.footballBall.ownerTeam === 'enemy'
      && state.footballBall.ownerId === attacker.id;
    if (carriesBall) return { x: 10, y: 800, health: 1, maxHealth: 1, angle: 0, objective: true };
    if (state.footballBall.ownerTeam === null) {
      return { ...state.footballBall, health: 1, maxHealth: 1, angle: 0, objective: true };
    }
  }
  if (state.battleMode === 'territory') return territoryTarget(state, attacker);
  if (state.battleMode === '3v3') {
    const opponents: Target[] = [
      ...(state.player.health > 0 ? [{ ...state.player }] : []),
      ...state.allies.map((ally) => ({ ...ally, ally })),
    ];
    const nearbyOpponent = opponents.sort((a, b) => (
      Math.hypot(a.x - attacker.x, a.y - attacker.y)
      - Math.hypot(b.x - attacker.x, b.y - attacker.y)
    ))[0];
    if (nearbyOpponent
      && Math.hypot(nearbyOpponent.x - attacker.x, nearbyOpponent.y - attacker.y) < 300) {
      return nearbyOpponent;
    }
    const crystal = [...state.crystals].sort((a, b) => (
      Math.hypot(a.x - attacker.x, a.y - attacker.y)
      - Math.hypot(b.x - attacker.x, b.y - attacker.y)
    ))[0];
    return {
      x: crystal?.x ?? ARENA_SIZE / 2,
      y: crystal?.y ?? ARENA_SIZE / 2,
      health: 1, maxHealth: 1, angle: 0, objective: true,
    };
  }
  const targets: Target[] = state.player.health > 0 && performance.now() >= state.invisibleUntil
    ? [{ ...state.player }] : [];
  if (state.battleMode !== 'solo') {
    targets.push(...state.allies.map((ally) => ({ ...ally, ally })));
  }
  if (state.battleMode === 'solo') {
    targets.push(...state.enemies
      .filter((enemy) => enemy.id !== attacker.id)
      .map((enemy) => ({ ...enemy, enemy })));
  }
  const closest = targets.sort((a, b) => (
    Math.hypot(a.x - attacker.x, a.y - attacker.y)
    - Math.hypot(b.x - attacker.x, b.y - attacker.y)
  ))[0];
  return closest ?? { ...state.player };
}

export function updateEnemies(state: GameState, dt: number) {
  for (const enemy of state.enemies) {
    if (enemy.health <= 0) continue;
    if (performance.now() < enemy.stunnedUntil || performance.now() < enemy.airborneUntil) continue;
    const target = closestTarget(state, enemy);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    enemy.angle = Math.atan2(dy, dx);

    if (distance > (target.objective ? 55 : 280)) {
      const slow = performance.now() < enemy.slowedUntil ? 0.5 : 1;
      const next = moveAroundWalls(
        enemy.x, enemy.y,
        (dx / distance) * 82 * dt * slow * enemy.speedPower,
        (dy / distance) * 82 * dt * slow * enemy.speedPower,
        24, state.battleMode,
      );
      enemy.x = next.x;
      enemy.y = next.y;
    } else if (!target.objective) {
      const hyper = performance.now() < enemy.hyperUntil;
      const cooldown = getElement(enemy.fighterId).cooldown
        * (hyper ? getHyperProfile(enemy.fighterId).cooldown : 1)
        * (enemy.fighterId === 'riot' ? 2 : 1.6)
        * enemy.cooldownPower;
      if (performance.now() - enemy.lastAttack < cooldown) continue;
      enemy.lastAttack = performance.now();
      if (target.enemy) {
        fireBotAttack(state, enemy, target.enemy, 'enemy', ATTACK_POWER * enemy.damagePower, false);
        target.enemy.hitFlash = 0.12;
      } else {
        fireBotAttack(
          state, enemy, target.ally ?? state.player, 'enemy', ATTACK_POWER * enemy.damagePower,
        );
      }
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  }

  state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
  if (state.battleMode === 'solo' && state.enemies.length === 0) {
    state.gameOver = true;
    state.result = 'victory';
    state.rubiesEarned = 10;
  }
}
