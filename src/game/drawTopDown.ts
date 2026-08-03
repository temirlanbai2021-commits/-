import type { GameState } from './types';
import { elements, getFighter } from './catalog';
import { getFighterSprite } from './fighterSprites';
import type { OnlinePlayer } from './onlineArena';
import { drawArenaGround, drawBushes } from './drawArena';
import { ARENA_SIZE, territoryZones } from './arenaMap';
import { getWalkPose } from './walkAnimation';
import { drawFootballField } from './drawFootball';

const SIZE = ARENA_SIZE;

export function drawTopDown(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  onlinePlayers: OnlinePlayer[] = [],
) {
  const scale = Math.max(width / 1000, height / 850);
  const ox = Math.min(0, Math.max(width - SIZE * scale, width / 2 - state.player.x * scale));
  const oy = Math.min(0, Math.max(height - SIZE * scale, height / 2 - state.player.y * scale));
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  drawArenaGround(ctx, state.battleMode);
  if (state.battleMode === 'football') drawFootballField(ctx, state);
  if (state.battleMode === 'territory') drawTerritories(ctx, state);
  if (state.battleMode === '3v3') drawCrystals(ctx, state);
  drawAimGuide(ctx, state);
  drawSuperWave(ctx, state);
  drawHyperAura(ctx, state);
  drawBullets(ctx, state);
  for (const enemy of state.enemies) {
    const airborneOffset = performance.now() < enemy.airborneUntil ? -28 : 0;
    drawFighter(ctx, `enemy-${enemy.id}`, enemy.x, enemy.y + airborneOffset, enemy.angle, enemy.fighterId, '#ef5350', enemy.hitFlash);
    drawHealthBar(ctx, enemy.x, enemy.y - 38, enemy.health, enemy.maxHealth, '#f06161');
    drawEnemyStatus(ctx, enemy);
    if (state.battleMode === '3v3') drawCrystalBadge(ctx, enemy.x, enemy.y - 65, enemy.crystals ?? 0);
  }
  for (const ally of state.allies) {
    drawFighter(ctx, `ally-${ally.id}`, ally.x, ally.y, ally.angle, ally.fighterId, '#49a8ff', ally.hitFlash);
    drawHealthBar(ctx, ally.x, ally.y - 38, ally.health, ally.maxHealth, '#49a8ff');
    if (state.battleMode === '3v3') drawCrystalBadge(ctx, ally.x, ally.y - 65, ally.crystals ?? 0);
  }
  for (const player of onlinePlayers) {
    drawFighter(ctx, `online-${player.id}`, player.x, player.y, player.angle, player.fighterId, '#62a8ff', 0);
    drawHealthBar(ctx, player.x, player.y - 52, player.health, player.maxHealth, '#62a8ff');
  }
  const fighter = getFighter(state.loadout.fighterId);
  drawFighter(ctx, 'local-player', state.player.x, state.player.y, state.player.angle, fighter.id, '#54d1a9', 0);
  drawHealthBar(ctx, state.player.x, state.player.y - 39, state.player.health, state.player.maxHealth, '#54d1a9');
  if (state.battleMode === '3v3') {
    drawCrystalBadge(ctx, state.player.x, state.player.y - 66, state.playerCrystals);
  }
  drawBushes(ctx, state.battleMode);
  ctx.restore();
}

function drawEnemyStatus(ctx: CanvasRenderingContext2D, enemy: GameState['enemies'][number]) {
  const now = performance.now();
  const status = now < enemy.stunnedUntil ? '❄ ЗАМОРОЖЕН'
    : now < enemy.airborneUntil ? '🌪 В ВОЗДУХЕ'
      : now < enemy.burningUntil ? '🔥 ГОРИТ' : '';
  if (!status) return;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '900 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(status, enemy.x, enemy.y - 52);
  ctx.restore();
}

function drawCrystals(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const crystal of state.crystals) {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.fillStyle = '#d786ff44';
    ctx.beginPath();
    ctx.arc(0, 0, 35 + Math.sin(performance.now() / 160) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(performance.now() / 700 + crystal.id);
    ctx.fillStyle = '#b757ff';
    ctx.strokeStyle = '#f1c7ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#c05cff';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(17, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-17, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawCrystalBadge(ctx: CanvasRenderingContext2D, x: number, y: number, count: number) {
  ctx.save();
  ctx.font = '900 19px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#25123eee';
  ctx.strokeStyle = '#d786ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 14, 52, 28, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText(`♦ ${count}`, x, y + 1);
  ctx.restore();
}

function drawSuperWave(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.superFlash <= 0) return;
  const progress = 1 - state.superFlash / 0.7;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 216, 65, ${1 - progress})`;
  ctx.lineWidth = 24 * (1 - progress);
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 40 + progress * 240, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHyperAura(ctx: CanvasRenderingContext2D, state: GameState) {
  if (performance.now() >= state.hyperUntil && state.hyperFlash <= 0) return;
  const pulse = 38 + Math.sin(performance.now() / 90) * 7;
  const element = getFighter(state.loadout.fighterId).elementId;
  const color = elements[element].color;
  ctx.save();
  ctx.translate(state.player.x, state.player.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = element === 'earth' ? 12 : 7;
  ctx.shadowColor = color;
  ctx.shadowBlur = element === 'shadow' ? 32 : 20;
  const rings = element === 'wind' ? 3 : element === 'lightning' ? 2 : 1;
  for (let index = 0; index < rings; index += 1) {
    ctx.rotate(performance.now() / (700 + index * 160));
    ctx.beginPath();
    if (element === 'lightning') {
      for (let point = 0; point < 10; point += 1) {
        const angle = point * Math.PI / 5;
        const radius = pulse + (point % 2 ? 13 : -5);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
    } else {
      ctx.arc(0, 0, pulse + index * 14, 0, Math.PI * 2);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawTerritories(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const [team, zone] of Object.entries(territoryZones)) {
    ctx.save();
    ctx.fillStyle = team === 'player' ? '#54d1a933' : '#ef535044';
    ctx.strokeStyle = team === 'player' ? '#54d1a9' : '#ef5350';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#fff';
  ctx.font = '900 30px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(state.enemyTerritoryProgress)}%`, territoryZones.player.x, territoryZones.player.y + 10);
  ctx.fillText(`${Math.floor(state.territoryProgress)}%`, territoryZones.enemy.x, territoryZones.enemy.y + 10);
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  health: number,
  maxHealth: number,
  color: string,
) {
  ctx.save();
  const width = 54;
  ctx.fillStyle = '#071217cc';
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, width, 8, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.shadowColor = '#0006';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.roundRect(x - width / 2 + 2, y + 2, Math.max(0, (width - 4) * health / maxHealth), 4, 2);
  ctx.fill();
  ctx.restore();
}

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const bullet of state.bullets) {
    const hostile = bullet.team === 'enemy';
    const color = elements[bullet.elementId].color;
    ctx.strokeStyle = color;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = color;
    ctx.shadowBlur = hostile ? 12 : 5;
    const angle = Math.atan2(bullet.vy, bullet.vx);
    ctx.beginPath();
    ctx.moveTo(bullet.x - Math.cos(angle) * 18, bullet.y - Math.sin(angle) * 18);
    ctx.lineTo(bullet.x, bullet.y);
    ctx.stroke();
    drawElementProjectile(ctx, bullet.elementId, bullet.x, bullet.y, angle);
  }
  ctx.restore();
}

function drawElementProjectile(
  ctx: CanvasRenderingContext2D,
  element: keyof typeof elements,
  x: number,
  y: number,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  if (element === 'nature') ctx.ellipse(0, 0, 10, 5, -0.4, 0, Math.PI * 2);
  else if (element === 'earth') ctx.arc(0, 0, 11, 0, Math.PI * 2);
  else if (element === 'shadow') ctx.arc(0, 0, 10, -1.2, 1.2);
  else if (element === 'wind') ctx.arc(-3, 0, 13, -0.8, 0.8);
  else if (element === 'fire') ctx.arc(0, 0, 9, 0, Math.PI * 2);
  else if (element === 'lightning') {
    ctx.moveTo(-12, -7); ctx.lineTo(-2, 0); ctx.lineTo(-8, 8); ctx.lineTo(12, 0);
  } else {
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawAimGuide(ctx: CanvasRenderingContext2D, state: GameState) {
  const { x, y, angle } = state.player;
  ctx.save();
  ctx.strokeStyle = '#fff7';
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(angle) * 32, y + Math.sin(angle) * 32);
  ctx.lineTo(x + Math.cos(angle) * 125, y + Math.sin(angle) * 125);
  ctx.stroke();
  ctx.restore();
}

function drawFighter(
  ctx: CanvasRenderingContext2D,
  animationId: string,
  x: number,
  y: number,
  angle: number,
  fighterId: Parameters<typeof getFighterSprite>[0],
  ring: string,
  hitFlash: number,
) {
  const pose = getWalkPose(animationId, x, y, performance.now());
  ctx.save();
  ctx.translate(x, y);
  drawElementAura(ctx, fighterId);
  ctx.fillStyle = '#26331e55';
  ctx.beginPath(); ctx.ellipse(0, 16, 29, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(0, 12, 29, 15, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(angle);
  ctx.rotate(pose.lean);
  ctx.translate(pose.bob, pose.sway);
  const sprite = getFighterSprite(fighterId);
  if (hitFlash > 0) {
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 22;
  }
  if (sprite) {
    const height = 88;
    const width = height * sprite.naturalWidth / sprite.naturalHeight;
    ctx.drawImage(sprite, -width / 2, -65, width, height);
  }
  else {
    ctx.fillStyle = getFighter(fighterId).color;
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 0); ctx.stroke();
  ctx.restore();
}

function drawElementAura(
  ctx: CanvasRenderingContext2D,
  fighterId: Parameters<typeof getFighterSprite>[0],
) {
  const fighter = getFighter(fighterId);
  const color = elements[fighter.elementId].color;
  const pulse = 32 + Math.sin(performance.now() / 180) * 4;
  ctx.save();
  ctx.strokeStyle = `${color}aa`;
  ctx.fillStyle = `${color}22`;
  ctx.lineWidth = fighter.elementId === 'earth' ? 8 : 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = fighter.elementId === 'shadow' ? 24 : 14;
  ctx.beginPath();
  if (fighter.elementId === 'lightning') {
    for (let index = 0; index < 8; index += 1) {
      const angle = index * Math.PI / 4;
      const radius = index % 2 ? pulse - 9 : pulse + 10;
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, 4, pulse, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
