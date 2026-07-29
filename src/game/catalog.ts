export type FighterId = 'spark' | 'tank' | 'ghost' | 'riot';
export type WeaponId = 'viper' | 'storm' | 'hammer';

export type Loadout = {
  fighterId: FighterId;
  weaponId: WeaponId;
  fighterLevel: number;
  healthLevel: number;
  speedLevel: number;
  damageLevel: number;
  fireRateLevel: number;
};

export const fighters = [
  { id: 'spark' as const, name: 'Искра', role: 'Универсал', color: '#54d1a9', health: 100, speed: 190 },
  { id: 'tank' as const, name: 'Гранит', role: 'Защитник', color: '#ffb45c', health: 135, speed: 155 },
  { id: 'ghost' as const, name: 'Фантом', role: 'Разведчик', color: '#9d8cff', health: 80, speed: 235 },
  { id: 'riot' as const, name: 'Бунтарка', role: 'Боец с битой', color: '#f06aa6', health: 115, speed: 205 },
];

export const weapons = [
  { id: 'viper' as const, name: 'Viper AR', kind: 'Автомат', damage: 34, cooldown: 170, ammo: 30, reloadMs: 2000 },
  { id: 'storm' as const, name: 'Storm SMG', kind: 'Пистолет-пулемёт', damage: 22, cooldown: 95, ammo: 40, reloadMs: 2000 },
  { id: 'hammer' as const, name: 'Hammer', kind: 'Дробовик', damage: 62, cooldown: 460, ammo: 8, reloadMs: 2000 },
];

export const defaultLoadout: Loadout = {
  fighterId: 'spark',
  weaponId: 'viper',
  fighterLevel: 1,
  healthLevel: 0,
  speedLevel: 0,
  damageLevel: 0,
  fireRateLevel: 0,
};

export function getFighter(id: FighterId) {
  return fighters.find((fighter) => fighter.id === id) ?? fighters[0];
}

export function getWeapon(id: WeaponId) {
  return weapons.find((weapon) => weapon.id === id) ?? weapons[0];
}
