import { ARENA_SIZE, getArena, type ArenaBlock } from './arenaMap';
import { getGroundTexture } from './arenaTexture';
import type { BattleMode } from './battleMode';

export function drawArenaGround(ctx: CanvasRenderingContext2D, mode: BattleMode) {
  const arena = getArena(mode);
  const texture = getGroundTexture();
  if (texture && mode === 'territory') ctx.drawImage(texture, 0, 0, ARENA_SIZE, ARENA_SIZE);
  else {
    ctx.fillStyle = arena.ground;
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);
  }

  const shade = ctx.createRadialGradient(450, 430, 180, 450, 450, 620);
  shade.addColorStop(0, '#fff0');
  shade.addColorStop(1, '#48361352');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

  ctx.strokeStyle = '#ffe89d';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, ARENA_SIZE - 16, ARENA_SIZE - 16);
  for (const block of arena.blocks.filter(({ kind }) => kind === 'wall')) drawWall(ctx, block);
}

export function drawBushes(ctx: CanvasRenderingContext2D, mode: BattleMode) {
  for (const block of getArena(mode).blocks.filter(({ kind }) => kind === 'bush')) {
    ctx.save();
    ctx.shadowColor = '#2b572d66';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#459b52d9';
    ctx.strokeStyle = '#327e42';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(block.x, block.y, block.width, block.height, 24);
    ctx.fill();
    ctx.stroke();
    for (let x = block.x + 16; x < block.x + block.width; x += 25) {
      for (let y = block.y + 16; y < block.y + block.height; y += 28) {
        ctx.fillStyle = (x + y) % 3 ? '#67b95a' : '#82cb62';
        ctx.beginPath();
        ctx.ellipse(x, y, 13, 8, -0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawWall(ctx: CanvasRenderingContext2D, block: ArenaBlock) {
  ctx.save();
  ctx.shadowColor = '#5a371e66';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = '#b96840';
  ctx.strokeStyle = '#6f3b2b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(block.x, block.y, block.width, block.height, 18);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e59a58';
  ctx.beginPath();
  ctx.roundRect(block.x + 7, block.y + 6, block.width - 14, 18, 8);
  ctx.fill();
  ctx.restore();
}
