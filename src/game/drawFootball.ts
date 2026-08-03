import type { GameState } from './types';

export function drawFootballField(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.strokeStyle = '#f7f4d7cc';
  ctx.lineWidth = 12;
  ctx.setLineDash([]);
  ctx.strokeRect(18, 18, 1564, 1564);
  ctx.beginPath();
  ctx.moveTo(800, 18); ctx.lineTo(800, 1582);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(800, 800, 170, 0, Math.PI * 2); ctx.stroke();
  drawPenaltyArea(ctx, 0, '#58aaff');
  drawPenaltyArea(ctx, 1600, '#ff6262');
  drawGoal(ctx, 'left', '#58aaff');
  drawGoal(ctx, 'right', '#ff6262');
  const ball = state.footballBall;
  ctx.shadowColor = '#0008';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#17212c';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#17212c';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPenaltyArea(ctx: CanvasRenderingContext2D, x: number, color: string) {
  ctx.save();
  ctx.strokeStyle = `${color}bb`;
  ctx.lineWidth = 9;
  const left = x === 0 ? 18 : 1322;
  ctx.strokeRect(left, 500, 260, 600);
  ctx.restore();
}

function drawGoal(ctx: CanvasRenderingContext2D, side: 'left' | 'right', color: string) {
  const left = side === 'left' ? 18 : 1472;
  const width = 110;
  const top = 610;
  const height = 380;
  ctx.save();
  ctx.fillStyle = `${color}22`;
  ctx.fillRect(left, top, width, height);
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 4;
  for (let y = top + 38; y < top + height; y += 38) {
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + width, y); ctx.stroke();
  }
  for (let x = left + 22; x < left + width; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + height); ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  ctx.strokeRect(left, top, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = '900 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(side === 'left' ? 'НАШИ ВОРОТА' : 'ВОРОТА ВРАГА', left + width / 2, top - 24);
  ctx.restore();
}
