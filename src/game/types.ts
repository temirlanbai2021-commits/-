import type { FighterId, Loadout } from './catalog';

export type CameraMode = 'firstPerson' | 'topDown';
export type Fighter = { x: number; y: number; angle: number; health: number; maxHealth: number };
export type Enemy = Fighter & { id: number; hitFlash: number; fighterId: FighterId };
export type Bullet = { id: number; x: number; y: number; vx: number; vy: number; life: number };

export type GameState = {
  player: Fighter;
  enemies: Enemy[];
  bullets: Bullet[];
  loadout: Loadout;
  score: number;
  rubiesEarned: number;
  ammo: number;
  reserveAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadEnd: number;
  mode: CameraMode;
  gameOver: boolean;
  result: 'playing' | 'victory' | 'defeat';
  lastShot: number;
};

export type Controls = {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
};
