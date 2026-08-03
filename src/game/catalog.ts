export type FighterId = 'spark' | 'tank' | 'ghost' | 'riot' | 'blaze' | 'volta'
  | 'frost' | 'spirit' | 'nova' | 'rift';
export type ElementId = 'nature' | 'earth' | 'shadow' | 'wind' | 'fire' | 'lightning' | 'ice';
export type RarityId = 'rare' | 'superRare' | 'epic' | 'mythic'
  | 'legendary' | 'ultraLegendary';

export type Loadout = {
  fighterId: FighterId;
  fighterLevel: number;
  healthLevel: number;
  speedLevel: number;
  damageLevel: number;
  fireRateLevel: number;
};

export const rarities: Record<RarityId, { name: string; color: string }> = {
  rare: { name: 'РЕДКИЙ', color: '#49a8ff' },
  superRare: { name: 'СВЕРХРЕДКИЙ', color: '#9d8cff' },
  epic: { name: 'ЭПИЧЕСКИЙ', color: '#d861df' },
  mythic: { name: 'МИФИЧЕСКИЙ', color: '#ef5350' },
  legendary: { name: 'ЛЕГЕНДАРНЫЙ', color: '#ffd166' },
  ultraLegendary: { name: 'УЛЬТРАЛЕГЕНДАРНЫЙ', color: '#ff8a42' },
};

export const fighters = [
  { id: 'spark' as const, rarity: 'legendary' as const, counteredBy: 'blaze' as const, name: 'Флора', role: 'Целитель', color: '#54d1a9', health: 100, speed: 190, elementId: 'nature' as const, ability: 'Восстанавливает здоровье быстрее' },
  { id: 'tank' as const, rarity: 'rare' as const, counteredBy: 'nova' as const, name: 'Титан', role: 'Защитник', color: '#ffb45c', health: 140, speed: 155, elementId: 'earth' as const, ability: 'Получает меньше урона' },
  { id: 'ghost' as const, rarity: 'rare' as const, counteredBy: 'spark' as const, name: 'Шейд', role: 'Разведчик', color: '#9d8cff', health: 80, speed: 240, elementId: 'shadow' as const, ability: 'Самый быстрый боец' },
  { id: 'riot' as const, rarity: 'ultraLegendary' as const, counteredBy: 'frost' as const, name: 'Аэро', role: 'Штурмовик', color: '#f06aa6', health: 115, speed: 205, elementId: 'wind' as const, ability: 'Атакует чаще остальных' },
  { id: 'blaze' as const, rarity: 'epic' as const, counteredBy: 'rift' as const, name: 'Инферно', role: 'Поджигатель', color: '#ff7043', health: 105, speed: 195, elementId: 'fire' as const, ability: 'Огонь наносит усиленный урон' },
  { id: 'volta' as const, rarity: 'mythic' as const, counteredBy: 'tank' as const, name: 'Импульс', role: 'Ускоритель', color: '#55c8ff', health: 90, speed: 225, elementId: 'lightning' as const, ability: 'Молнии летят и атакуют быстрее' },
  { id: 'frost' as const, rarity: 'epic' as const, counteredBy: 'volta' as const, name: 'Крио', role: 'Контроль', color: '#8de5ff', health: 120, speed: 175, elementId: 'ice' as const, ability: 'Ледяные заряды замедляют врага' },
  { id: 'spirit' as const, rarity: 'epic' as const, counteredBy: 'riot' as const, name: 'Призрак', role: 'Дух', color: '#70f4ee', health: 88, speed: 215, elementId: 'shadow' as const, ability: 'Свободно проходит сквозь стены' },
  { id: 'rift' as const, rarity: 'mythic' as const, counteredBy: 'spirit' as const, name: 'Рифт', role: 'Крушитель', color: '#e77d32', health: 135, speed: 165, elementId: 'earth' as const, ability: 'Тяжёлые заряды пробивают строй врагов' },
  { id: 'nova' as const, rarity: 'legendary' as const, counteredBy: 'ghost' as const, name: 'Нова', role: 'Космический маг', color: '#b86cff', health: 92, speed: 220, elementId: 'shadow' as const, ability: 'Теневая энергия проходит сквозь цель' },
];

export const elements = {
  nature: { name: 'Природа', icon: '🌿', damage: 30, cooldown: 180, speed: 760, color: '#54d1a9' },
  earth: { name: 'Земля', icon: '🪨', damage: 48, cooldown: 360, speed: 620, color: '#d69a55' },
  shadow: { name: 'Тень', icon: '🌑', damage: 26, cooldown: 135, speed: 900, color: '#9d8cff' },
  wind: { name: 'Ветер', icon: '🌪️', damage: 25, cooldown: 105, speed: 880, color: '#c7f5ff' },
  fire: { name: 'Огонь', icon: '🔥', damage: 42, cooldown: 210, speed: 790, color: '#ff7043' },
  lightning: { name: 'Молния', icon: '⚡', damage: 28, cooldown: 100, speed: 1040, color: '#55c8ff' },
  ice: { name: 'Лёд', icon: '❄️', damage: 34, cooldown: 240, speed: 720, color: '#8de5ff' },
} satisfies Record<ElementId, { name: string; icon: string; damage: number; cooldown: number; speed: number; color: string }>;

export const defaultLoadout: Loadout = {
  fighterId: 'spark', fighterLevel: 1,
  healthLevel: 0, speedLevel: 0, damageLevel: 0, fireRateLevel: 0,
};

export function getFighter(id: FighterId) {
  return fighters.find((fighter) => fighter.id === id) ?? fighters[0];
}

export function getElement(fighterId: FighterId) {
  return elements[getFighter(fighterId).elementId];
}

export function getCounterMultiplier(attackerId: FighterId, targetId: FighterId) {
  return getFighter(targetId).counteredBy === attackerId ? 1.35 : 1;
}
