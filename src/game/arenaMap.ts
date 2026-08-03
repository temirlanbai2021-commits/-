import type { BattleMode } from './battleMode';

export type ArenaBlock = {
  x: number; y: number; width: number; height: number; kind: 'wall' | 'bush';
};
export type ArenaTheme = { name: string; ground: string; accent: string; blocks: ArenaBlock[] };
export const ARENA_SIZE = 1600;

const territoryBlocks: ArenaBlock[] = [
  { x: 190, y: 210, width: 280, height: 90, kind: 'wall' },
  { x: 1130, y: 210, width: 280, height: 90, kind: 'wall' },
  { x: 630, y: 390, width: 340, height: 80, kind: 'bush' },
  { x: 220, y: 650, width: 150, height: 280, kind: 'bush' },
  { x: 1230, y: 650, width: 150, height: 280, kind: 'bush' },
  { x: 630, y: 760, width: 340, height: 80, kind: 'wall' },
  { x: 190, y: 1210, width: 280, height: 90, kind: 'wall' },
  { x: 1130, y: 1210, width: 280, height: 90, kind: 'wall' },
];

export const arenaMaps: Record<BattleMode, ArenaTheme> = {
  territory: { name: 'Красный рубеж', ground: '#d9ad4d', accent: '#ef5350', blocks: territoryBlocks },
  solo: { name: 'Зелёный лабиринт', ground: '#78a94f', accent: '#b8e66b', blocks: [
    { x: 330, y: 260, width: 110, height: 390, kind: 'wall' },
    { x: 1160, y: 260, width: 110, height: 390, kind: 'wall' },
    { x: 620, y: 650, width: 360, height: 150, kind: 'bush' },
    { x: 330, y: 970, width: 110, height: 360, kind: 'bush' },
    { x: 1160, y: 970, width: 110, height: 360, kind: 'bush' },
  ] },
  '2v2': { name: 'Парный каньон', ground: '#c88758', accent: '#8a68d8', blocks: [
    { x: 470, y: 160, width: 100, height: 500, kind: 'wall' },
    { x: 1030, y: 940, width: 100, height: 500, kind: 'wall' },
    { x: 700, y: 600, width: 200, height: 400, kind: 'bush' },
    { x: 150, y: 1110, width: 330, height: 90, kind: 'wall' },
    { x: 1120, y: 400, width: 330, height: 90, kind: 'wall' },
  ] },
  '3v3': { name: 'Кристальная площадь', ground: '#637fc0', accent: '#62c8ff', blocks: [
    { x: 260, y: 360, width: 300, height: 100, kind: 'wall' },
    { x: 1040, y: 360, width: 300, height: 100, kind: 'wall' },
    { x: 260, y: 1140, width: 300, height: 100, kind: 'wall' },
    { x: 1040, y: 1140, width: 300, height: 100, kind: 'wall' },
    { x: 650, y: 650, width: 300, height: 300, kind: 'bush' },
  ] },
  football: { name: 'Зелёный стадион', ground: '#3e9b5f', accent: '#f6f7e8', blocks: [
    { x: 420, y: 300, width: 120, height: 210, kind: 'wall' },
    { x: 1060, y: 1090, width: 120, height: 210, kind: 'wall' },
    { x: 730, y: 390, width: 140, height: 120, kind: 'bush' },
    { x: 730, y: 1090, width: 140, height: 120, kind: 'bush' },
  ] },
  friendly: { name: 'Дружеская арена', ground: '#526e8f', accent: '#70f4ee', blocks: [
    { x: 330, y: 300, width: 130, height: 420, kind: 'wall' },
    { x: 1140, y: 880, width: 130, height: 420, kind: 'wall' },
    { x: 650, y: 650, width: 300, height: 300, kind: 'bush' },
  ] },
};

export const arenaBlocks = territoryBlocks;
export const territoryZones = {
  player: { x: 180, y: 800, radius: 125 }, enemy: { x: 1420, y: 800, radius: 125 },
};
export const playerSpawn = { x: 220, y: 800 };
export const getArena = (mode: BattleMode) => arenaMaps[mode];

export function hitsWall(x: number, y: number, radius: number, mode: BattleMode = 'territory') {
  return getArena(mode).blocks.some((block) => block.kind === 'wall'
    && x + radius > block.x && x - radius < block.x + block.width
    && y + radius > block.y && y - radius < block.y + block.height);
}

export function moveAroundWalls(
  x: number, y: number, dx: number, dy: number, radius: number, mode: BattleMode = 'territory',
) {
  const nextX = Math.max(radius, Math.min(ARENA_SIZE - radius, x + dx));
  const nextY = Math.max(radius, Math.min(ARENA_SIZE - radius, y + dy));
  const safeX = hitsWall(nextX, y, radius, mode) ? x : nextX;
  const safeY = hitsWall(safeX, nextY, radius, mode) ? y : nextY;
  return { x: safeX, y: safeY };
}
