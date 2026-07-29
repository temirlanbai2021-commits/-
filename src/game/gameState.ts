import { defaultLoadout, getFighter, getWeapon, Loadout } from './catalog';
import { BattleMode, getEnemyCount } from './battleMode';
import type { Controls, Enemy, GameState } from './types';

const ARENA = 900;

function makeEnemy(id: number): Enemy {
  const edge = Math.random() > 0.5;
  const fighterIds = ['spark', 'tank', 'ghost', 'riot'] as const;
  return {
    id,
    x: edge ? 50 + Math.random() * 800 : Math.random() > 0.5 ? 60 : 840,
    y: edge ? (Math.random() > 0.5 ? 60 : 840) : 50 + Math.random() * 800,
    angle: 0, health: 100, maxHealth: 100, hitFlash: 0,
    fighterId: fighterIds[Math.floor(Math.random() * fighterIds.length)],
  };
}

export function createGame(
  loadout: Loadout = defaultLoadout,
  battleMode: BattleMode = 'solo',
  ammoStock = 90,
): GameState {
  const fighter = getFighter(loadout.fighterId);
  const weapon = getWeapon(loadout.weaponId);
  const levelBonus = loadout.fighterLevel - 1;
  const maxHealth = fighter.health + loadout.healthLevel * 12 + levelBonus * 4;
  return {
    player: { x: 450, y: 450, angle: 0, health: maxHealth, maxHealth },
    enemies: Array.from({ length: getEnemyCount(battleMode) }, (_, id) => makeEnemy(id)),
    bullets: [],
    loadout, score: 0, rubiesEarned: 0,
    ammo: Math.min(weapon.ammo, ammoStock),
    reserveAmmo: Math.max(0, ammoStock - weapon.ammo),
    maxAmmo: weapon.ammo,
    isReloading: false, reloadEnd: 0,
    mode: 'firstPerson', gameOver: false, result: 'playing', lastShot: 0,
  };
}

export function updateGame(state: GameState, controls: Controls, dt: number) {
  if (state.gameOver) return;
  if (state.isReloading && performance.now() >= state.reloadEnd) {
    const needed = state.maxAmmo - state.ammo;
    const loaded = Math.min(needed, state.reserveAmmo);
    state.ammo += loaded;
    state.reserveAmmo -= loaded;
    state.isReloading = false;
  }
  const fighter = getFighter(state.loadout.fighterId);
  const speed = (fighter.speed + state.loadout.speedLevel * 13 + (state.loadout.fighterLevel - 1) * 2) * dt;
  let dx = 0; let dy = 0;
  if (controls.keys.has('w')) dy -= speed;
  if (controls.keys.has('s')) dy += speed;
  if (controls.keys.has('a')) dx -= speed;
  if (controls.keys.has('d')) dx += speed;
  state.player.x = Math.max(35, Math.min(ARENA - 35, state.player.x + dx));
  state.player.y = Math.max(35, Math.min(ARENA - 35, state.player.y + dy));
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }
  state.bullets = state.bullets.filter((bullet) => bullet.life > 0);

  for (const enemy of state.enemies) {
    const ex = state.player.x - enemy.x;
    const ey = state.player.y - enemy.y;
    const distance = Math.hypot(ex, ey);
    enemy.angle = Math.atan2(ey, ex);
    if (distance > 45) {
      enemy.x += (ex / distance) * 72 * dt;
      enemy.y += (ey / distance) * 72 * dt;
    } else state.player.health = Math.max(0, state.player.health - 18 * dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  }
  if (state.player.health <= 0) {
    state.gameOver = true;
    state.result = 'defeat';
    state.rubiesEarned = -5;
  }
}

export function shoot(state: GameState) {
  const weapon = getWeapon(state.loadout.weaponId);
  const cooldown = weapon.cooldown * (1 - state.loadout.fireRateLevel * 0.08);
  const now = performance.now();
  if (state.gameOver || state.isReloading || now - state.lastShot < cooldown) return;
  if (state.ammo <= 0) {
    reload(state);
    return;
  }
  state.lastShot = now;
  state.ammo -= 1;
  state.bullets.push({
    id: now,
    x: state.player.x + Math.cos(state.player.angle) * 38,
    y: state.player.y + Math.sin(state.player.angle) * 38,
    vx: Math.cos(state.player.angle) * 850,
    vy: Math.sin(state.player.angle) * 850,
    life: 0.55,
  });
  const target = state.enemies.map((enemy) => {
    const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x);
    const difference = Math.abs(Math.atan2(Math.sin(angle - state.player.angle), Math.cos(angle - state.player.angle)));
    return { enemy, difference, distance: Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) };
  }).filter(({ difference }) => difference < 0.18).sort((a, b) => a.distance - b.distance)[0]?.enemy;
  if (!target) return;
  const levelMultiplier = 1 + (state.loadout.fighterLevel - 1) * 0.025;
  target.health -= weapon.damage * (1 + state.loadout.damageLevel * 0.12) * levelMultiplier;
  target.hitFlash = 0.1;
  if (target.health <= 0) {
    state.score += 1;
    state.enemies = state.enemies.filter((enemy) => enemy.id !== target.id);
    if (state.score >= 10) {
      state.gameOver = true;
      state.result = 'victory';
      state.rubiesEarned = 10;
    } else state.enemies.push(makeEnemy(now));
  }
}

export function reload(state: GameState) {
  if (state.gameOver || state.isReloading || state.ammo === state.maxAmmo || state.reserveAmmo === 0) return;
  const weapon = getWeapon(state.loadout.weaponId);
  state.isReloading = true;
  state.reloadEnd = performance.now() + weapon.reloadMs;
}

export function getTrophyReward(state: GameState) {
  return state.result === 'victory' ? Math.min(10, 5 + Math.floor(state.score / 2)) : -3;
}
