import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Loadout } from '../game/catalog';
import { createGame, reload, shoot, updateGame } from '../game/gameState';
import { useHypercharge, useSuper } from '../game/abilities';
import { drawTopDown } from '../game/drawTopDown';
import { drawFirstPerson } from '../game/drawFirstPerson';
import type { Controls, GameState } from '../game/types';
import type { BattleMode } from '../game/battleMode';
import { connectArena, OnlinePlayer } from '../game/onlineArena';
import { getElement } from '../game/catalog';
import { ARENA_SIZE } from '../game/arenaMap';
import { ATTACK_POWER } from '../game/combatBalance';

type Props = {
  onUpdate: (state: GameState) => void;
  resetSignal: number;
  loadout: Loadout;
  battleMode: BattleMode;
  ammoStock: number;
  fighterTrophies: number;
  roomCode?: string;
  friendlySide?: 'host' | 'guest';
  onOnlineCount: (count: number) => void;
};

export function GameCanvas({
  onUpdate, resetSignal, loadout, battleMode, ammoStock, fighterTrophies,
  roomCode, friendlySide = 'host', onOnlineCount,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(createGame(loadout, battleMode, ammoStock, fighterTrophies));
  const controlsRef = useRef<Controls>({ keys: new Set(), mouseX: 0, mouseY: 0 });
  const isFiringRef = useRef(false);
  const onlinePlayersRef = useRef<OnlinePlayer[]>([]);
  const connectionRef = useRef<ReturnType<typeof connectArena>>();
  const [started, setStarted] = useState(false);

  const setMoveKey = (key: string, pressed: boolean) => {
    if (pressed) controlsRef.current.keys.add(key);
    else controlsRef.current.keys.delete(key);
    setStarted(true);
  };

  const pressMove = (key: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setMoveKey(key, true);
  };

  const releaseMove = (key: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setMoveKey(key, false);
  };

  const startFiring = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setStarted(true);
    isFiringRef.current = true;
    fire();
  };

  const fire = () => {
    const bulletsBefore = gameRef.current.bullets.length;
    shoot(gameRef.current);
    if (gameRef.current.bullets.length > bulletsBefore) hitOnlinePlayer();
  };

  const stopFiring = () => {
    isFiringRef.current = false;
  };

  const toggleCamera = () => {
    const game = gameRef.current;
    game.mode = game.mode === 'topDown' ? 'firstPerson' : 'topDown';
  };

  const hitOnlinePlayer = () => {
    const game = gameRef.current;
    const target = onlinePlayersRef.current.map((player) => {
      const angle = Math.atan2(player.y - game.player.y, player.x - game.player.x);
      const difference = Math.abs(Math.atan2(
        Math.sin(angle - game.player.angle),
        Math.cos(angle - game.player.angle),
      ));
      return { player, difference, distance: Math.hypot(player.x - game.player.x, player.y - game.player.y) };
    }).filter(({ difference }) => difference < .14).sort((a, b) => a.distance - b.distance)[0]?.player;
    if (!target) return;
    connectionRef.current?.hit(target.id, getElement(loadout.fighterId).damage * ATTACK_POWER);
  };

  useEffect(() => {
    if (battleMode !== 'friendly' || !roomCode) {
      onlinePlayersRef.current = [];
      onOnlineCount(0);
      return;
    }
    const connection = connectArena(
      roomCode,
      (players) => {
        onlinePlayersRef.current = players;
        onOnlineCount(players.length + 1);
        if (players.some((player) => player.health <= 0) && !gameRef.current.gameOver) {
          gameRef.current.gameOver = true;
          gameRef.current.result = 'victory';
          gameRef.current.rubiesEarned = 5;
        }
      },
      (damage) => {
        const game = gameRef.current;
        if (game.gameOver) return;
        game.player.health = Math.max(0, game.player.health - damage);
        game.lastDamage = performance.now();
        if (game.player.health === 0) {
          game.gameOver = true;
          game.result = 'defeat';
        }
      },
    );
    connectionRef.current = connection;
    onOnlineCount(1);
    return () => {
      void connection.disconnect();
      connectionRef.current = undefined;
      onOnlineCount(0);
    };
  }, [battleMode, onOnlineCount, roomCode]);

  useEffect(() => {
    gameRef.current = createGame(loadout, battleMode, ammoStock, fighterTrophies);
    if (battleMode === 'friendly' && friendlySide === 'guest') {
      gameRef.current.player.x = 1380;
      gameRef.current.player.y = 800;
      gameRef.current.player.angle = Math.PI;
    }
    isFiringRef.current = false;
    setStarted(false);
    onUpdate(gameRef.current);
  }, [resetSignal, loadout, battleMode, ammoStock, fighterTrophies, friendlySide, onUpdate]);

  useEffect(() => {
    const movementKeys: Record<string, string> = {
      KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
    };
    const down = (event: KeyboardEvent) => {
      const key = movementKeys[event.code] ?? event.key.toLowerCase();
      if (movementKeys[event.code]) event.preventDefault();
      controlsRef.current.keys.add(key);
      if (key === 'v' && !event.repeat) {
        const game = gameRef.current;
        game.mode = game.mode === 'topDown' ? 'firstPerson' : 'topDown';
      }
      if (key === 'r') reload(gameRef.current);
      if (key === ' ' && !event.repeat) {
        event.preventDefault();
        useSuper(gameRef.current);
      }
      if (key === 'q' && !event.repeat) useHypercharge(gameRef.current);
    };
    const up = (event: KeyboardEvent) => {
      const key = movementKeys[event.code] ?? event.key.toLowerCase();
      controlsRef.current.keys.delete(key);
    };
    const clearControls = () => {
      controlsRef.current.keys.clear();
      isFiringRef.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearControls);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearControls);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aim = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const game = gameRef.current;
      if (game.mode === 'topDown') {
        const scale = Math.max(box.width / 1000, box.height / 850);
        const offsetX = Math.min(0, Math.max(box.width - ARENA_SIZE * scale, box.width / 2 - game.player.x * scale));
        const offsetY = Math.min(0, Math.max(box.height - ARENA_SIZE * scale, box.height / 2 - game.player.y * scale));
        const x = event.clientX - box.left - (offsetX + game.player.x * scale);
        const y = event.clientY - box.top - (offsetY + game.player.y * scale);
        game.player.angle = Math.atan2(y, x);
      } else if (event.movementX) game.player.angle += event.movementX * 0.003;
    };
    const fireFromCanvas = () => {
      setStarted(true);
      if (gameRef.current.mode === 'firstPerson') canvas.requestPointerLock();
      isFiringRef.current = true;
      fire();
    };
    canvas.addEventListener('pointermove', aim);
    canvas.addEventListener('pointerdown', fireFromCanvas);
    window.addEventListener('pointerup', stopFiring);
    window.addEventListener('pointercancel', stopFiring);
    return () => {
      canvas.removeEventListener('pointermove', aim);
      canvas.removeEventListener('pointerdown', fireFromCanvas);
      window.removeEventListener('pointerup', stopFiring);
      window.removeEventListener('pointercancel', stopFiring);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let previous = performance.now();
    let lastBroadcast = 0;
    const loop = (now: number) => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      if (isFiringRef.current) fire();
      updateGame(gameRef.current, controlsRef.current, Math.min((now - previous) / 1000, 0.03));
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (gameRef.current.mode === 'topDown') {
        drawTopDown(ctx, gameRef.current, width, height, onlinePlayersRef.current);
      } else drawFirstPerson(ctx, gameRef.current, width, height, onlinePlayersRef.current);
      if (now - lastBroadcast >= 100) {
        lastBroadcast = now;
        const current = gameRef.current;
        connectionRef.current?.sendState({
          name: 'Игрок',
          fighterId: current.loadout.fighterId,
          x: current.player.x,
          y: current.player.y,
          angle: current.player.angle,
          health: current.player.health,
          maxHealth: current.player.maxHealth,
        });
      }
      previous = now;
      onUpdate({ ...gameRef.current });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [onUpdate]);

  return (
    <div className="game-canvas-wrap">
      <canvas ref={canvasRef} className="game-canvas" />
      {!started && <div className="game-tip">Нажми на арену, чтобы начать</div>}
      <div className="desktop-ability-controls">
        <button type="button" disabled={gameRef.current.superCharge < 100}
          onClick={() => useSuper(gameRef.current)}>★ УЛЬТА <kbd>ПРОБЕЛ</kbd></button>
        <button type="button" disabled={gameRef.current.hyperCharge < 100}
          onClick={() => useHypercharge(gameRef.current)}>ГИПЕР <kbd>Q</kbd></button>
      </div>
      <div className="mobile-controls">
        <div className="move-pad">
          <button className="move-up" type="button" aria-label="Вперёд" onPointerDown={pressMove('w')}
            onPointerUp={releaseMove('w')} onPointerCancel={releaseMove('w')}>▲</button>
          <button className="move-left" type="button" aria-label="Влево" onPointerDown={pressMove('a')}
            onPointerUp={releaseMove('a')} onPointerCancel={releaseMove('a')}>◀</button>
          <button className="move-down" type="button" aria-label="Вниз" onPointerDown={pressMove('s')}
            onPointerUp={releaseMove('s')} onPointerCancel={releaseMove('s')}>▼</button>
          <button className="move-right" type="button" aria-label="Вправо" onPointerDown={pressMove('d')}
            onPointerUp={releaseMove('d')} onPointerCancel={releaseMove('d')}>▶</button>
        </div>
        <div className="action-pad">
          <button type="button" onClick={toggleCamera}>V</button>
          <button disabled={gameRef.current.superCharge < 100}
            className={`super-button ${gameRef.current.superCharge >= 100 ? 'ready' : ''}`}
            onClick={() => useSuper(gameRef.current)}>★</button>
          <button disabled={gameRef.current.hyperCharge < 100}
            className={`hyper-button ${gameRef.current.hyperCharge >= 100 ? 'ready' : ''}`}
            onClick={() => useHypercharge(gameRef.current)}>ГИПЕР</button>
          <button type="button" className="fire-button" onPointerDown={startFiring}
            onPointerUp={stopFiring} onPointerCancel={stopFiring}>
            {battleMode === 'football' ? 'УДАР' : 'ОГОНЬ'}
          </button>
        </div>
      </div>
    </div>
  );
}
