import type { GameState } from './types';
import { getFighterSprite } from './fighterSprites';
import type { OnlinePlayer } from './onlineArena';

export function drawFirstPerson(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  onlinePlayers: OnlinePlayer[] = [],
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.58);
  sky.addColorStop(0, '#477a91');
  sky.addColorStop(1, '#b6d7d5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.58);
  ctx.fillStyle = '#243d46';
  ctx.fillRect(0, height * 0.58, width, height * 0.42);
  drawArena(ctx, width, height);

  const targets = [
    ...state.enemies.map((enemy) => ({ ...enemy, isOnline: false })),
    ...onlinePlayers.map((player) => ({ ...player, hitFlash: 0, isOnline: true })),
  ];
  const visible = targets.map((enemy) => {
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const angle = Math.atan2(dy, dx);
    const offset = Math.atan2(Math.sin(angle - state.player.angle), Math.cos(angle - state.player.angle));
    return { enemy, offset, distance: Math.hypot(dx, dy) };
  }).filter(({ offset }) => Math.abs(offset) < 0.75)
    .sort((a, b) => b.distance - a.distance);

  for (const { enemy, offset, distance } of visible) {
    const x = width / 2 + (offset / 0.75) * width / 2;
    const size = Math.min(height * 0.55, 21000 / distance);
    const sprite = getFighterSprite(enemy.fighterId);
    if (sprite) ctx.drawImage(sprite, x - size * 0.42, height * 0.58 - size, size * 0.84, size);
    const barWidth = Math.max(30, size * 0.55);
    const barY = height * 0.58 - size * 0.86;
    ctx.fillStyle = '#071217cc';
    ctx.fillRect(x - barWidth / 2, barY, barWidth, 7);
    ctx.fillStyle = enemy.isOnline ? '#62a8ff' : '#f06161';
    ctx.fillRect(x - barWidth / 2 + 2, barY + 2, (barWidth - 4) * enemy.health / enemy.maxHealth, 3);
  }
  drawBulletTrails(ctx, state, width, height);
  drawWeapon(ctx, width, height, performance.now() - state.lastShot < 90);
  drawCrosshair(ctx, width / 2, height / 2);
}

function drawArena(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#18323d';
  for (let x = -80; x < width + 120; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, height * .58); ctx.lineTo(x + 55, height * .35);
    ctx.lineTo(x + 145, height * .35); ctx.lineTo(x + 180, height * .58); ctx.fill();
  }
  const road = ctx.createLinearGradient(0, height * .58, 0, height);
  road.addColorStop(0, '#344e55'); road.addColorStop(1, '#14262e');
  ctx.fillStyle = road; ctx.fillRect(0, height * .58, width, height * .42);
  ctx.strokeStyle = '#ffd16655'; ctx.lineWidth = 3;
  for (let y = height * .65; y < height; y += 55) {
    ctx.beginPath(); ctx.moveTo(width * .48, y); ctx.lineTo(width * .52, y); ctx.stroke();
  }
}

function drawBulletTrails(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
  if (!state.bullets.length) return;
  ctx.save();
  const glow = ctx.createLinearGradient(width / 2, height * 0.68, width / 2, height * 0.28);
  glow.addColorStop(0, '#fff');
  glow.addColorStop(1, '#ffd84d00');
  ctx.strokeStyle = glow;
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ffd84d';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(width / 2 + 12, height * 0.72);
  ctx.lineTo(width / 2, height * 0.3);
  ctx.stroke();
  ctx.restore();
}

function drawWeapon(ctx: CanvasRenderingContext2D, width: number, height: number, flash: boolean) {
  ctx.save();
  ctx.translate(width / 2, height);
  ctx.fillStyle = '#18252e';
  ctx.beginPath();
  ctx.moveTo(-80, 0); ctx.lineTo(-45, -150); ctx.lineTo(55, -150); ctx.lineTo(120, 0); ctx.fill();
  ctx.fillStyle = '#405763';
  ctx.fillRect(-26, -210, 52, 115);
  ctx.fillStyle = '#18252e';
  ctx.fillRect(-15, -275, 30, 90);
  if (flash) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(-35, -350); ctx.lineTo(0, -335); ctx.lineTo(35, -350); ctx.fill();
  }
  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15, y); ctx.lineTo(x - 5, y);
  ctx.moveTo(x + 5, y); ctx.lineTo(x + 15, y);
  ctx.moveTo(x, y - 15); ctx.lineTo(x, y - 5);
  ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 15);
  ctx.stroke();
}
