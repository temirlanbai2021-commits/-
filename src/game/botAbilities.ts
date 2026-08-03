import { getCounterMultiplier, getElement } from './catalog';
import { getHyperProfile } from './abilities';
import type { Enemy, Fighter, GameState } from './types';
import { SUPER_DAMAGE_MULTIPLIER } from './combatBalance';

type BotTeam = 'player' | 'enemy';

export function fireBotAttack(
  state: GameState, bot: Enemy, target: Fighter, team: BotTeam, power: number,
  useProjectile = true,
) {
  const element = getElement(bot.fighterId);
  const hyper = performance.now() < bot.hyperUntil;
  const profile = getHyperProfile(bot.fighterId);
  const angles = bot.fighterId === 'spark' ? [-0.11, 0, 0.11]
    : bot.fighterId === 'riot' ? [-0.18, -0.09, 0, 0.09, 0.18]
      : bot.fighterId === 'tank' ? [-0.09, 0, 0.09] : [0];
  const aim = Math.atan2(target.y - bot.y, target.x - bot.x);
  const fighterDamageBoost = {
    spark: 1.08,
    tank: 1.2,
    ghost: 1.08,
    riot: 0.82,
    blaze: 1.2,
    volta: 1.08,
    frost: 1.12,
    spirit: 1.1,
    nova: 1.1,
    rift: 1.18,
  }[bot.fighterId];
  const damageBoost = state.battleMode === 'football' ? 1 : fighterDamageBoost;

  angles.forEach((offset, index) => {
    if (!useProjectile) {
      const targetId = (target as Partial<Enemy>).fighterId;
      const counter = targetId ? getCounterMultiplier(bot.fighterId, targetId) : 1;
      target.health = Math.max(
        0,
        target.health - element.damage * power * damageBoost
          * (hyper ? profile.damage : 1) * counter / (angles.length > 1 ? 1.75 : 1),
      );
      return;
    }
    const angle = aim + offset;
    state.bullets.push({
      id: performance.now() + bot.id * 10 + index,
      x: bot.x + Math.cos(angle) * 32,
      y: bot.y + Math.sin(angle) * 32,
      vx: Math.cos(angle) * element.speed,
      vy: Math.sin(angle) * element.speed,
      life: bot.fighterId === 'tank' ? 1.15 : 0.9,
      damage: element.damage * power * damageBoost
        * (hyper ? profile.damage : 1)
        / (angles.length > 1 ? state.battleMode === 'football' ? 2.15 : 1.75 : 1),
      elementId: bot.elementId,
      team,
      ownerFighterId: bot.fighterId,
      pierce: bot.fighterId === 'ghost' || bot.fighterId === 'spirit' ? 1 : 0,
      hitEnemyIds: [],
    });
  });
  bot.superCharge = Math.min(100, bot.superCharge + 22);
  bot.hyperCharge = Math.min(100, bot.hyperCharge + 9);
  tryBotAbilities(state, bot, target, team, power);
}

function tryBotAbilities(
  state: GameState, bot: Enemy, target: Fighter, team: BotTeam, power: number,
) {
  const now = performance.now();
  if (bot.hyperCharge >= 100) {
    bot.hyperCharge = 0;
    bot.hyperUntil = now + 8000;
  }
  if (bot.superCharge < 100) return;
  bot.superCharge = 0;
  bot.hyperCharge = Math.min(100, bot.hyperCharge + 34);
  const distance = Math.hypot(target.x - bot.x, target.y - bot.y);

  if (bot.fighterId === 'spark') {
    bot.health = bot.maxHealth;
    return;
  }
  if (bot.fighterId === 'ghost' && distance < 700) {
    bot.x = target.x - Math.cos(bot.angle) * 60;
    bot.y = target.y - Math.sin(bot.angle) * 60;
  }
  const radius = bot.fighterId === 'volta' ? 470 : bot.fighterId === 'riot' ? 390 : 310;
  if (distance > radius) return;
  const hyperPower = now < bot.hyperUntil ? getHyperProfile(bot.fighterId).superPower : 1;
  const damage = {
    spark: 0, tank: 105, ghost: 70, riot: 65,
    blaze: 80, volta: 120, frost: 55, spirit: 45, nova: 70, rift: 95,
  }[bot.fighterId];
  const targetId = (target as Partial<Enemy>).fighterId;
  const counter = targetId ? getCounterMultiplier(bot.fighterId, targetId) : 1;
  target.health = Math.max(
    0,
    target.health - damage * power * hyperPower * SUPER_DAMAGE_MULTIPLIER * counter,
  );
  if (team === 'enemy' && target === state.player) state.lastDamage = now;
}
