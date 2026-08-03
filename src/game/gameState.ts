import { defaultLoadout, getElement, getFighter, Loadout } from './catalog';
import { BattleMode, getEnemyCount } from './battleMode';
import { updateEnemies } from './enemyCombat';
import { playerSpawn, territoryZones } from './arenaMap';
import { updateProjectiles } from './projectileCombat';
import { BotPower, makeEnemy } from './enemyFactory';
import type { Controls, GameState } from './types';
import { updateAllies } from './allyCombat';
import { getHyperProfile, updateAbilityEffects } from './abilities';
import { dropCrystals, updateCrystalMode } from './crystalMode';
import { ATTACK_POWER, HEALTH_MULTIPLIER } from './combatBalance';
import { kickFootball, updateFootball } from './footballMode';
import { updatePlayerMovement } from './playerMovement';

export function createGame(
  loadout: Loadout = defaultLoadout,
  battleMode: BattleMode = 'solo',
  _ammoStock = 90,
  _fighterTrophies = 0,
): GameState {
  const fighter = getFighter(loadout.fighterId);
  const levelBonus = loadout.fighterLevel - 1;
  const maxHealth = Math.round((battleMode === 'football'
    ? fighter.health
    : fighter.health + loadout.healthLevel * 12 + levelBonus * 4) * HEALTH_MULTIPLIER);
  const opponentPower = 1;
  const botPower: BotPower = battleMode === 'football' ? {
    healthBonus: 0, damagePower: 1, speedPower: 1, cooldownPower: 1,
  } : {
    healthBonus: loadout.healthLevel * 12 + levelBonus * 4,
    damagePower: (1 + loadout.damageLevel * 0.12) * (1 + levelBonus * 0.025),
    speedPower: (fighter.speed + loadout.speedLevel * 13 + levelBonus * 2) / fighter.speed,
    cooldownPower: 1 - loadout.fireRateLevel * 0.08,
  };
  const makeAlly = (id: number, x: number, y: number) => {
    const ally = makeEnemy(id, botPower);
    return battleMode === 'football'
      ? { ...ally, x, y, health: maxHealth, maxHealth }
      : { ...ally, x, y };
  };
  return {
    player: { ...playerSpawn, angle: 0, health: maxHealth, maxHealth },
    playerVelocity: { x: 0, y: 0 },
    enemies: Array.from({ length: getEnemyCount(battleMode) }, (_, id) => {
      const enemy = makeEnemy(id, botPower);
      if (battleMode === 'territory' || battleMode === 'football') {
        enemy.x = 1360 + id * 35;
        enemy.y = 730 + id * 70;
      }
      if (battleMode === 'football') {
        enemy.health = maxHealth;
        enemy.maxHealth = maxHealth;
      }
      return enemy;
    }),
    allies: battleMode === '2v2'
      ? [makeAlly(-1, 170, 880)]
      : battleMode === '3v3' || battleMode === 'territory' || battleMode === 'football'
        ? [makeAlly(-1, 170, 880), makeAlly(-2, 240, 720)]
        : [],
    bullets: [],
    crystals: [],
    footballBall: {
      x: 800, y: 800, vx: 0, vy: 0, ownerTeam: null, ownerId: null,
      blockedOwnerId: null, pickupBlockedUntil: 0, lastKickTeam: null,
    },
    footballScore: { player: 0, enemy: 0 },
    loadout, battleMode, opponentPower, score: 0, rubiesEarned: 0,
    ammo: Number.POSITIVE_INFINITY,
    reserveAmmo: Number.POSITIVE_INFINITY,
    maxAmmo: Number.POSITIVE_INFINITY,
    isReloading: false, reloadEnd: 0,
    mode: 'topDown', gameOver: false, result: 'playing', lastShot: 0,
    territoryProgress: 0, enemyTerritoryProgress: 0, territoryTime: 0,
    superCharge: 0, superFlash: 0,
    hyperCharge: 0, hyperUntil: 0, hyperFlash: 0, shieldUntil: 0,
    lastDamage: 0,
    respawnAt: 0,
    lastCrystalSpawn: performance.now() - 2000,
    crystalCountdownEnd: 0,
    crystalCountdownTeam: null,
    playerCrystals: 0,
    regenUntil: 0,
    invisibleUntil: 0,
    speedBoostUntil: 0,
    burnAuraUntil: 0,
    freezeAuraUntil: 0,
  };
}

export function updateGame(state: GameState, controls: Controls, dt: number) {
  if (state.gameOver) return;
  if (state.player.health > 0) {
    updatePlayerMovement(state, controls, dt);
  }
  updateProjectiles(state, dt);
  updateAbilityEffects(state, dt);
  updateAllies(state, dt);
  updateEnemies(state, dt);
  state.superFlash = Math.max(0, state.superFlash - dt);
  state.hyperFlash = Math.max(0, state.hyperFlash - dt);
  if (performance.now() - state.lastDamage > 3000 && state.player.health < state.player.maxHealth) {
    const healing = state.loadout.fighterId === 'spark' ? 0.21 : 0.13;
    state.player.health = Math.min(state.player.maxHealth, state.player.health + state.player.maxHealth * healing * dt);
  }
  updateTerritory(state, dt);
  updateCrystalMode(state);
  updateFootball(state, dt);
  updateRespawn(state);
}

export function shoot(state: GameState) {
  const element = getElement(state.loadout.fighterId);
  const hyperActive = performance.now() < state.hyperUntil;
  const hyper = getHyperProfile(state.loadout.fighterId);
  const fireRateUpgrade = state.battleMode === 'football' ? 1 : 1 - state.loadout.fireRateLevel * 0.08;
  const attackSpeedBalance = state.battleMode === 'football' ? 1 : 0.72;
  const cooldown = element.cooldown * fireRateUpgrade
    * (hyperActive ? hyper.cooldown : 1) * attackSpeedBalance;
  const now = performance.now();
  if (state.gameOver || state.player.health <= 0) return;
  if (state.battleMode === 'football' && kickFootball(state)) {
    state.lastShot = now;
    return;
  }
  if (state.isReloading || now - state.lastShot < cooldown) return;
  state.lastShot = now;
  const fighterId = state.loadout.fighterId;
  const fighterBoost: Partial<Record<typeof fighterId, number>> = {
    tank: 1.18,
    blaze: 1.2,
    frost: 1.12,
    spirit: 1.1,
  };
  const footballBalance = state.battleMode === 'football' ? 1 : fighterBoost[fighterId] ?? 1;
  const upgradeDamage = state.battleMode === 'football' ? 1 : 1 + state.loadout.damageLevel * 0.12;
  const levelDamage = state.battleMode === 'football' ? 1 : 1 + (state.loadout.fighterLevel - 1) * 0.025;
  const damage = element.damage * ATTACK_POWER * footballBalance
    * upgradeDamage
    * (hyperActive ? hyper.damage : 1)
    * levelDamage;
  const offsets = fighterId === 'spark' ? [-0.11, 0, 0.11]
    : fighterId === 'riot' ? [-0.18, -0.09, 0, 0.09, 0.18]
      : fighterId === 'tank' ? [-0.09, 0, 0.09] : [0];
  for (const [index, offset] of offsets.entries()) {
    const angle = state.player.angle + offset;
    state.bullets.push({
      id: now + index,
      x: state.player.x + Math.cos(angle) * 38,
      y: state.player.y + Math.sin(angle) * 38,
      vx: Math.cos(angle) * element.speed,
      vy: Math.sin(angle) * element.speed,
      life: fighterId === 'ghost' ? 1.05 : 0.8,
      damage: damage / (offsets.length > 1 ? 2.15 : 1),
      elementId: getFighter(fighterId).elementId,
      team: 'player',
      ownerFighterId: fighterId,
      pierce: fighterId === 'ghost' ? 2 : fighterId === 'spirit' ? 1 : 0,
      hitEnemyIds: [],
    });
  }
}

function updateRespawn(state: GameState) {
  if (state.player.health > 0) return;
  const teamMode = state.battleMode === '2v2'
    || state.battleMode === '3v3'
    || state.battleMode === 'territory';
  const footballMode = state.battleMode === 'football';
  const teammate = state.allies[0];
  if ((!teamMode && !footballMode) || !teammate) {
    state.gameOver = true;
    state.result = 'defeat';
    state.rubiesEarned = -5;
    return;
  }
  if (!state.respawnAt) {
    dropCrystals(state, state.player);
    state.respawnAt = performance.now() + 3500;
  }
  if (performance.now() < state.respawnAt) return;
  state.player.x = playerSpawn.x;
  state.player.y = playerSpawn.y;
  state.player.angle = 0;
  state.playerVelocity.x = 0;
  state.playerVelocity.y = 0;
  state.player.health = state.player.maxHealth;
  state.lastDamage = performance.now();
  state.respawnAt = 0;
}

export function reload(state: GameState) {
  state.ammo = state.maxAmmo;
  state.isReloading = false;
}

function updateTerritory(state: GameState, dt: number) {
  if (state.battleMode !== 'territory') return;
  const allyZone = territoryZones.enemy;
  const enemyZone = territoryZones.player;
  const livingAllies = [
    ...(state.player.health > 0 ? [state.player] : []),
    ...state.allies.filter((ally) => ally.health > 0),
  ];
  const livingEnemies = state.enemies.filter((enemy) => enemy.health > 0);
  const alliesInside = livingAllies.filter((fighter) => (
    Math.hypot(fighter.x - allyZone.x, fighter.y - allyZone.y) <= allyZone.radius
  )).length;
  const enemiesDefending = livingEnemies.some((enemy) => (
    Math.hypot(enemy.x - allyZone.x, enemy.y - allyZone.y) <= allyZone.radius
  ));
  const enemiesInside = livingEnemies.filter((enemy) => (
    Math.hypot(enemy.x - enemyZone.x, enemy.y - enemyZone.y) <= enemyZone.radius
  )).length;
  const alliesDefending = livingAllies.some((fighter) => (
    Math.hypot(fighter.x - enemyZone.x, fighter.y - enemyZone.y) <= enemyZone.radius
  ));
  const captureSpeed = 8;

  if (alliesInside > 0 && !enemiesDefending) {
    state.territoryProgress = Math.min(100, state.territoryProgress + dt * captureSpeed * alliesInside);
  }
  if (enemiesInside > 0 && !alliesDefending) {
    state.enemyTerritoryProgress = Math.min(
      100,
      state.enemyTerritoryProgress + dt * captureSpeed * enemiesInside,
    );
  }
  state.territoryTime += dt;
  if (state.territoryProgress >= 100) {
    state.gameOver = true;
    state.result = 'victory';
    state.rubiesEarned = 15;
  } else if (state.enemyTerritoryProgress >= 100) {
    state.gameOver = true;
    state.result = 'defeat';
    state.rubiesEarned = -5;
  }
}

export function getTrophyReward(state: GameState) {
  if (state.battleMode === '3v3') return state.result === 'victory' ? 10 : -4;
  return state.result === 'victory' ? Math.min(10, 5 + Math.floor(state.score / 2)) : -3;
}
