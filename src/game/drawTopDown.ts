import type { GameState } from './types';
import { getFighter } from './catalog';
import { getFighterSprite } from './fighterSprites';
import type { OnlinePlayer } from './onlineArena';

const SIZE = 900;

export function drawTopDown(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  onlinePlayers: OnlinePlayer[] = [],
) {
  const scale = Math.min(width / SIZE, height / SIZE);
  const ox = (width - SIZE * scale) / 2;
  const oy = (height - SIZE * scale) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#162934';
  ctx.fillRect(0, 0, SIZE, SIZE);
  drawGrid(ctx);
  drawCover(ctx);
  drawBullets(ctx, state);
  for (const enemy of state.enemies) {
    drawFighter(ctx, enemy.x, enemy.y, enemy.angle, enemy.fighterId);
    drawHealthBar(ctx, enemy.x, enemy.y - 38, enemy.health, enemy.maxHealth, '#f06161');
  }
  for (const player of onlinePlayers) {
    drawFighter(ctx, player.x, player.y, player.angle, player.fighterId);
    drawHealthBar(ctx, player.x, player.y - 52, player.health, player.maxHealth, '#62a8ff');
  }
  const fighter = getFighter(state.loadout.fighterId);
  drawFighter(ctx, state.player.x, state.player.y, state.player.angle, fighter.id);
  drawHealthBar(ctx, state.player.x, state.player.y - 39, state.player.health, state.player.maxHealth, '#54d1a9');
  ctx.restore();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  health: number,
  maxHealth: number,
  color: string,
) {
  const width = 54;
  ctx.fillStyle = '#071217cc';
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, width, 8, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - width / 2 + 2, y + 2, Math.max(0, (width - 4) * health / maxHealth), 4, 2);
  ctx.fill();
}

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.strokeStyle = '#ffe66d';
  ctx.fillStyle = '#fff7b2';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const bullet of state.bullets) {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    ctx.beginPath();
    ctx.moveTo(bullet.x - Math.cos(angle) * 18, bullet.y - Math.sin(angle) * 18);
    ctx.lineTo(bullet.x, bullet.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255,255,255,.035)';
  ctx.lineWidth = 2;
  for (let n = 0; n <= 900; n += 75) {
    ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, 900); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, n); ctx.lineTo(900, n); ctx.stroke();
  }
}

function drawCover(ctx: CanvasRenderingContext2D) {
  const blocks = [[180, 180, 150, 70], [570, 180, 150, 70], [180, 650, 150, 70], [570, 650, 150, 70]];
  ctx.fillStyle = '#284553';
  for (const [x, y, w, h] of blocks) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
  }
}

function drawFighter(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, fighterId: Parameters<typeof getFighterSprite>[0]) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const sprite = getFighterSprite(fighterId);
  if (sprite) ctx.drawImage(sprite, -34, -48, 68, 68);
  else {
    ctx.fillStyle = getFighter(fighterId).color;
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#fff9';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 0); ctx.stroke();
  ctx.restore();
}
