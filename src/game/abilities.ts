import { getCounterMultiplier, type FighterId } from './catalog';
import { dropCrystals } from './crystalMode';
import { makeEnemy } from './enemyFactory';
import type { Enemy, GameState } from './types';
import { SUPER_DAMAGE_MULTIPLIER } from './combatBalance';

const nearbyEnemies = (state: GameState, radius: number) => state.enemies.filter((enemy) => (
  Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= radius
));

const superNames: Record<FighterId, string> = {
  spark: 'Зелье восстановления',
  tank: 'Землетрясение',
  ghost: 'Неудержимая скорость',
  riot: 'Шторм',
  blaze: 'Огненный дракон',
  volta: 'Потоп грома',
  frost: 'Ледяная гора',
  spirit: 'Призрачное ускорение',
  nova: 'Космический разлом',
  rift: 'Магматический удар',
};

const hyperProfiles: Record<FighterId, {
  name: string; speed: number; damage: number; cooldown: number; superPower: number;
}> = {
  spark: { name: 'Дикая роща', speed: 1.25, damage: 1.25, cooldown: 0.8, superPower: 1.8 },
  tank: { name: 'Каменный титан', speed: 1.15, damage: 1.55, cooldown: 0.8, superPower: 1.7 },
  ghost: { name: 'Теневой разлом', speed: 1.8, damage: 1.3, cooldown: 0.55, superPower: 1.9 },
  riot: { name: 'Сердце шторма', speed: 1.4, damage: 1.3, cooldown: 0.45, superPower: 2 },
  blaze: { name: 'Инферно', speed: 1.3, damage: 1.8, cooldown: 0.7, superPower: 2 },
  volta: { name: 'Перегрузка', speed: 1.55, damage: 1.45, cooldown: 0.42, superPower: 1.85 },
  frost: { name: 'Абсолютный ноль', speed: 1.2, damage: 1.5, cooldown: 0.75, superPower: 1.85 },
  spirit: { name: 'Бесплотная форма', speed: 1.65, damage: 1.35, cooldown: 0.6, superPower: 1.8 },
  nova: { name: 'Сердце галактики', speed: 1.5, damage: 1.45, cooldown: 0.58, superPower: 1.8 },
  rift: { name: 'Ядро земли', speed: 1.15, damage: 1.55, cooldown: 0.78, superPower: 1.7 },
};

export const getHyperProfile = (fighterId: FighterId) => hyperProfiles[fighterId];
export const getHyperName = (state: GameState) => getHyperProfile(state.loadout.fighterId).name;
export const getSuperName = (state: GameState) => superNames[state.loadout.fighterId];

export function useSuper(state: GameState) {
  if (state.gameOver || state.player.health <= 0 || state.superCharge < 100) return false;
  state.superCharge = 0;
  state.superFlash = 0.7;
  const now = performance.now();
  const hyperActive = now < state.hyperUntil;
  const power = hyperActive ? getHyperProfile(state.loadout.fighterId).superPower : 1;
  if (!hyperActive) state.hyperCharge = Math.min(100, state.hyperCharge + 34);
  const id = state.loadout.fighterId;

  if (id === 'spark') {
    state.player.health = state.player.maxHealth;
    for (const ally of state.allies) ally.health = ally.maxHealth;
  } else if (id === 'spirit') {
    state.speedBoostUntil = now + 6000 * power;
  } else if (id === 'ghost') {
    teleportToNearest(state, power);
  }

  const radius = (id === 'volta' ? 470 : id === 'riot' ? 390 : 300)
    * (hyperActive ? 1.35 : 1);
  for (const enemy of nearbyEnemies(state, radius)) applySuperHit(state, enemy, id, power, now);
  removeDefeated(state);
  return true;
}

function teleportToNearest(state: GameState, power: number) {
  const target = nearbyEnemies(state, 900).sort((a, b) => (
    Math.hypot(a.x - state.player.x, a.y - state.player.y)
    - Math.hypot(b.x - state.player.x, b.y - state.player.y)
  ))[0];
  if (!target) return;
  state.player.x = target.x - Math.cos(target.angle) * 55;
  state.player.y = target.y - Math.sin(target.angle) * 55;
  target.health -= 70 * power * SUPER_DAMAGE_MULTIPLIER
    * getCounterMultiplier('ghost', target.fighterId);
  target.hitFlash = 0.3;
}

function applySuperHit(
  state: GameState, enemy: Enemy, id: FighterId, power: number, now: number,
) {
  const distance = Math.max(1, Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y));
  if (id === 'riot') {
    enemy.airborneUntil = now + 1000;
    enemy.landingDamage = 65 * power * SUPER_DAMAGE_MULTIPLIER
      * getCounterMultiplier('riot', enemy.fighterId);
  }
  if (id === 'frost') enemy.stunnedUntil = now + 3000 * power;
  if (id === 'blaze') enemy.burningUntil = now + 5000 * power;
  if (id === 'tank') {
    enemy.x += (enemy.x - state.player.x) / distance * 220;
    enemy.y += (enemy.y - state.player.y) / distance * 220;
  }
  const damage: Record<FighterId, number> = {
    spark: 0, tank: 105, ghost: 0, riot: 0,
    blaze: 80, volta: 120, frost: 30, spirit: 0, nova: 70, rift: 95,
  };
  enemy.health -= damage[id] * power * SUPER_DAMAGE_MULTIPLIER
    * getCounterMultiplier(id, enemy.fighterId);
  if (damage[id]) enemy.hitFlash = 0.3;
}

export function useHypercharge(state: GameState) {
  if (state.gameOver || state.player.health <= 0 || state.hyperCharge < 100) return false;
  state.hyperCharge = 0;
  state.hyperUntil = performance.now() + 8000;
  state.hyperFlash = 0.8;
  return true;
}

export function updateAbilityEffects(state: GameState, dt: number) {
  const now = performance.now();
  for (const enemy of state.enemies) {
    if (now < enemy.burningUntil) {
      enemy.health -= 24 * SUPER_DAMAGE_MULTIPLIER * dt;
      enemy.hitFlash = Math.max(enemy.hitFlash, 0.06);
    }
    if (enemy.landingDamage > 0 && now >= enemy.airborneUntil) {
      enemy.health -= enemy.landingDamage;
      enemy.landingDamage = 0;
      enemy.hitFlash = 0.3;
    }
  }
  removeDefeated(state);
}

function removeDefeated(state: GameState) {
  const defeated = state.enemies.filter((enemy) => enemy.health <= 0);
  for (const enemy of defeated) dropCrystals(state, enemy);
  state.score += defeated.length;
  state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
  if (state.battleMode !== 'solo') {
    for (let index = 0; index < defeated.length; index += 1) {
      const template = defeated[0];
      state.enemies.push(makeEnemy(performance.now() + index, template && {
        healthBonus: template.healthBonus,
        damagePower: template.damagePower,
        speedPower: template.speedPower,
        cooldownPower: template.cooldownPower,
      }));
    }
  }
}
