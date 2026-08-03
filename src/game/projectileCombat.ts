import { hitsWall } from './arenaMap';
import { makeEnemy } from './enemyFactory';
import type { GameState } from './types';
import { dropCrystals } from './crystalMode';
import { getCounterMultiplier } from './catalog';

export function updateProjectiles(state: GameState, dt: number) {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (hitsWall(bullet.x, bullet.y, 5, state.battleMode)) {
      bullet.life = 0;
      continue;
    }

    if (bullet.team === 'enemy') {
      const targets = [state.player, ...state.allies].filter((fighter) => fighter.health > 0);
      const hit = targets.find((fighter) => Math.hypot(fighter.x - bullet.x, fighter.y - bullet.y) < 27);
      if (hit) {
        const targetId = hit === state.player
          ? state.loadout.fighterId
          : state.allies.find((ally) => ally === hit)?.fighterId;
        const counter = bullet.ownerFighterId && targetId
          ? getCounterMultiplier(bullet.ownerFighterId, targetId) : 1;
        const tankArmor = hit === state.player && state.loadout.fighterId === 'tank' ? 0.78 : 1;
        const shield = hit === state.player && performance.now() < state.shieldUntil ? 0.28 : 1;
        const armor = tankArmor * shield;
        hit.health = Math.max(0, hit.health - bullet.damage * armor * counter);
        if (hit === state.player) state.lastDamage = performance.now();
        bullet.life = 0;
      }
      continue;
    }

    const target = state.enemies.find((enemy) => (
      !bullet.hitEnemyIds?.includes(enemy.id)
      && Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < 29
    ));
    if (!target) continue;

    const bonus = target.elementId === 'ice' && bullet.elementId === 'fire'
      || target.elementId === 'earth' && bullet.elementId === 'lightning'
      || target.elementId === 'fire' && bullet.elementId === 'ice' ? 1.25 : 1;
    const counter = bullet.ownerFighterId
      ? getCounterMultiplier(bullet.ownerFighterId, target.fighterId) : 1;
    target.health -= bullet.damage * bonus * counter;
    const hyperActive = performance.now() < state.hyperUntil;
    const fighterId = state.loadout.fighterId;
    if (bullet.elementId === 'ice') {
      target.slowedUntil = performance.now() + (hyperActive && fighterId === 'frost' ? 4000 : 1900);
    }
    const attacker = bullet.ownerFighterId ?? fighterId;
    if (attacker === 'blaze') {
      target.burningUntil = Math.max(target.burningUntil, performance.now() + 1800);
    }
    if (attacker === 'spark') {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + (hyperActive ? 7 : 3));
    }
    if (attacker === 'riot') {
      const distance = Math.max(1, Math.hypot(target.x - state.player.x, target.y - state.player.y));
      target.x += (target.x - state.player.x) / distance * (hyperActive ? 34 : 16);
      target.y += (target.y - state.player.y) / distance * (hyperActive ? 34 : 16);
    }
    if (attacker === 'tank' || attacker === 'blaze') {
      const splash = attacker === 'blaze' ? 115 : 80;
      for (const enemy of state.enemies.filter((item) => (
        item.id !== target.id && Math.hypot(item.x - target.x, item.y - target.y) < splash
      ))) {
        enemy.health -= bullet.damage * (attacker === 'blaze' ? 0.55 : 0.38);
        enemy.hitFlash = 0.1;
      }
    }
    if (attacker === 'volta') {
      const chained = state.enemies.find((enemy) => (
        enemy.id !== target.id && Math.hypot(enemy.x - target.x, enemy.y - target.y) < 180
      ));
      if (chained) {
        chained.health -= bullet.damage * (hyperActive ? 0.75 : 0.4);
        chained.hitFlash = 0.14;
      }
    }
    if (attacker === 'spirit') {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 3);
    }
    if (hyperActive && fighterId === 'ghost') {
      state.superCharge = Math.min(100, state.superCharge + 7);
    }
    state.superCharge = Math.min(100, state.superCharge + 25);
    state.hyperCharge = Math.min(100, state.hyperCharge + 11);
    target.hitFlash = 0.14;
    bullet.hitEnemyIds?.push(target.id);
    if ((bullet.pierce ?? 0) > 0) bullet.pierce = (bullet.pierce ?? 0) - 1;
    else bullet.life = 0;
    if (target.health > 0) continue;

    state.score += 1;
    dropCrystals(state, target);
    state.enemies = state.enemies.filter((enemy) => enemy.id !== target.id);
    if (state.battleMode === '2v2' && state.score >= 10) {
      state.gameOver = true;
      state.result = 'victory';
      state.rubiesEarned = 10;
    } else if (state.battleMode !== 'solo') {
      state.enemies.push(makeEnemy(performance.now() + Math.random(), {
        healthBonus: target.healthBonus,
        damagePower: target.damagePower,
        speedPower: target.speedPower,
        cooldownPower: target.cooldownPower,
      }));
    }
  }
  state.bullets = state.bullets.filter((bullet) => bullet.life > 0);
}
