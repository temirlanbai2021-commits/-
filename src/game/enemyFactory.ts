import type { Enemy } from './types';
import { ARENA_SIZE } from './arenaMap';
import { fighters, getFighter } from './catalog';
import { HEALTH_MULTIPLIER } from './combatBalance';

export type BotPower = {
  healthBonus: number;
  damagePower: number;
  speedPower: number;
  cooldownPower: number;
};

export const DEFAULT_BOT_POWER: BotPower = {
  healthBonus: 0,
  damagePower: 1,
  speedPower: 1,
  cooldownPower: 1,
};

export function makeEnemy(id: number, power: BotPower = DEFAULT_BOT_POWER): Enemy {
  const edge = Math.random() > 0.5;
  const fighterId = fighters[Math.floor(Math.random() * fighters.length)].id;
  const fighter = getFighter(fighterId);
  const health = (fighter.health + power.healthBonus) * HEALTH_MULTIPLIER;
  return {
    id,
    x: edge ? 80 + Math.random() * (ARENA_SIZE - 160) : Math.random() > 0.5 ? 80 : ARENA_SIZE - 80,
    y: edge ? (Math.random() > 0.5 ? 80 : ARENA_SIZE - 80) : 80 + Math.random() * (ARENA_SIZE - 160),
    angle: 0,
    health: Math.round(health),
    maxHealth: Math.round(health),
    hitFlash: 0,
    lastAttack: performance.now() + Math.random() * 700,
    fighterId,
    elementId: fighter.elementId,
    slowedUntil: 0,
    stunnedUntil: 0,
    burningUntil: 0,
    airborneUntil: 0,
    landingDamage: 0,
    superCharge: Math.random() * 35,
    hyperCharge: Math.random() * 20,
    hyperUntil: 0,
    healthBonus: power.healthBonus,
    damagePower: power.damagePower,
    speedPower: power.speedPower,
    cooldownPower: power.cooldownPower,
  };
}
