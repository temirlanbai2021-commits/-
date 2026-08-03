import type { Enemy, Fighter, GameState } from './types';

const CENTER = 800;
const GOAL_HALF_HEIGHT = 190;
const BALL_RADIUS = 30;
const LEFT_GOAL_LINE = 128;
const RIGHT_GOAL_LINE = 1472;
const looseBall = () => ({
  x: CENTER, y: CENTER, vx: 0, vy: 0,
  ownerTeam: null, ownerId: null,
  blockedOwnerId: null, pickupBlockedUntil: 0, lastKickTeam: null,
} as const);

export function kickFootball(state: GameState) {
  const ball = state.footballBall;
  const playerHasBall = ball.ownerTeam === 'player' && ball.ownerId === 'player';
  if (!playerHasBall) return false;
  ball.ownerTeam = null;
  ball.ownerId = null;
  ball.blockedOwnerId = 'player';
  ball.pickupBlockedUntil = performance.now() + 280;
  ball.lastKickTeam = 'player';
  ball.x = state.player.x + Math.cos(state.player.angle) * 55;
  ball.y = state.player.y + Math.sin(state.player.angle) * 55;
  ball.vx = Math.cos(state.player.angle) * 760;
  ball.vy = Math.sin(state.player.angle) * 760;
  return true;
}

type Candidate = { fighter: Fighter; team: 'player' | 'enemy'; id: number | 'player' };

function findCarrier(state: GameState): Candidate | null {
  const ball = state.footballBall;
  const candidates: Candidate[] = [
    ...(state.player.health > 0 ? [{ fighter: state.player, team: 'player' as const, id: 'player' as const }] : []),
    ...state.allies.filter((fighter) => fighter.health > 0)
      .map((fighter) => ({ fighter, team: 'player' as const, id: fighter.id })),
    ...state.enemies.filter((fighter) => fighter.health > 0)
      .map((fighter) => ({ fighter, team: 'enemy' as const, id: fighter.id })),
  ];
  return candidates.filter(({ id }) => (
    performance.now() >= ball.pickupBlockedUntil || id !== ball.blockedOwnerId
  )).sort((a, b) => (
    Math.hypot(a.fighter.x - ball.x, a.fighter.y - ball.y)
    - Math.hypot(b.fighter.x - ball.x, b.fighter.y - ball.y)
  ))[0] ?? null;
}

function currentCarrier(state: GameState): Candidate | null {
  const ball = state.footballBall;
  if (ball.ownerId === 'player') return state.player.health > 0
    ? { fighter: state.player, team: 'player', id: 'player' } : null;
  const roster: Enemy[] = ball.ownerTeam === 'player' ? state.allies : state.enemies;
  const fighter = roster.find(({ id }) => id === ball.ownerId && id !== null);
  if (!fighter || fighter.health <= 0) return null;
  return { fighter, team: ball.ownerTeam ?? 'player', id: fighter.id };
}

function carryOrPickUp(state: GameState) {
  const ball = state.footballBall;
  let carrier = currentCarrier(state);
  if (!carrier) {
    const nearest = findCarrier(state);
    if (nearest && Math.hypot(nearest.fighter.x - ball.x, nearest.fighter.y - ball.y) < 70) {
      carrier = nearest;
      ball.ownerTeam = nearest.team;
      ball.ownerId = nearest.id;
    }
  }
  if (!carrier) return false;
  ball.x = carrier.fighter.x + Math.cos(carrier.fighter.angle) * 42;
  ball.y = carrier.fighter.y + Math.sin(carrier.fighter.angle) * 42;
  ball.vx = 0;
  ball.vy = 0;
  const botNearGoal = carrier.id !== 'player'
    && (carrier.team === 'player' ? ball.x > 1250 : ball.x < 350);
  if (botNearGoal) {
    const goalX = carrier.team === 'player' ? 1600 : 0;
    const angle = Math.atan2(CENTER - ball.y, goalX - ball.x);
    ball.ownerTeam = null;
    ball.ownerId = null;
    ball.blockedOwnerId = carrier.id;
    ball.pickupBlockedUntil = performance.now() + 280;
    ball.lastKickTeam = carrier.team;
    ball.vx = Math.cos(angle) * 700;
    ball.vy = Math.sin(angle) * 700;
  }
  return true;
}

function resetAfterGoal(state: GameState) {
  state.footballBall = looseBall();
  state.player.x = 220; state.player.y = CENTER;
  state.allies.forEach((ally, index) => { ally.x = 220; ally.y = 600 + index * 400; });
  state.enemies.forEach((enemy, index) => { enemy.x = 1380; enemy.y = 600 + index * 200; });
}

export function updateFootball(state: GameState, dt: number) {
  if (state.battleMode !== 'football') return;
  const ball = state.footballBall;
  if (!carryOrPickUp(state)) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vx *= Math.pow(0.985, dt * 60);
    ball.vy *= Math.pow(0.985, dt * 60);
    carryOrPickUp(state);
  }
  if (ball.y < 35 || ball.y > 1565) {
    ball.y = Math.max(35, Math.min(1565, ball.y)); ball.vy *= -0.7;
  }
  const betweenPosts = Math.abs(ball.y - CENTER) <= GOAL_HALF_HEIGHT - BALL_RADIUS;
  const crossedEnemyLine = ball.x - BALL_RADIUS >= RIGHT_GOAL_LINE;
  const crossedOurLine = ball.x + BALL_RADIUS <= LEFT_GOAL_LINE;
  if (betweenPosts && crossedEnemyLine && ball.lastKickTeam === 'player') {
    state.footballScore.player += 1;
  } else if (betweenPosts && crossedOurLine && ball.lastKickTeam === 'enemy') {
    state.footballScore.enemy += 1;
  }
  else {
    if (ball.x < 35 || ball.x > 1565) {
      ball.x = Math.max(35, Math.min(1565, ball.x)); ball.vx *= -0.7;
    }
    return;
  }
  state.score = state.footballScore.player;
  if (state.footballScore.player >= 2 || state.footballScore.enemy >= 2) {
    state.gameOver = true;
    state.result = state.footballScore.player >= 2 ? 'victory' : 'defeat';
    state.rubiesEarned = state.result === 'victory' ? 12 : -3;
  } else resetAfterGoal(state);
}
