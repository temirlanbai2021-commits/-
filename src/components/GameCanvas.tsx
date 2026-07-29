import { useEffect, useRef, useState } from 'react';
import type { Loadout } from '../game/catalog';
import { createGame, reload, shoot, updateGame } from '../game/gameState';
import { drawTopDown } from '../game/drawTopDown';
import { drawFirstPerson } from '../game/drawFirstPerson';
import type { Controls, GameState } from '../game/types';
import type { BattleMode } from '../game/battleMode';
import { connectArena, OnlinePlayer } from '../game/onlineArena';
import { getWeapon } from '../game/catalog';

type Props = {
  onUpdate: (state: GameState) => void;
  resetSignal: number;
  loadout: Loadout;
  battleMode: BattleMode;
  ammoStock: number;
  onOnlineCount: (count: number) => void;
};

export function GameCanvas({
  onUpdate, resetSignal, loadout, battleMode, ammoStock, onOnlineCount,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(createGame(loadout, battleMode, ammoStock));
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

  const startFiring = () => {
    setStarted(true);
    isFiringRef.current = true;
    fire();
  };

  const fire = () => {
    const ammoBefore = gameRef.current.ammo;
    shoot(gameRef.current);
    if (gameRef.current.ammo < ammoBefore) hitOnlinePlayer();
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
    connectionRef.current?.hit(target.id, getWeapon(loadout.weaponId).damage);
  };

  useEffect(() => {
    const connection = connectArena(
      (players) => {
        onlinePlayersRef.current = players;
        onOnlineCount(players.length + 1);
      },
      (damage) => {
        const game = gameRef.current;
        if (game.gameOver) return;
        game.player.health = Math.max(0, game.player.health - damage);
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
  }, [onOnlineCount]);

  useEffect(() => {
    gameRef.current = createGame(loadout, battleMode, ammoStock);
    isFiringRef.current = false;
    setStarted(false);
    onUpdate(gameRef.current);
  }, [resetSignal, loadout, battleMode, ammoStock, onUpdate]);

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
    };
    const up = (event: KeyboardEvent) => {
      const key = movementKeys[event.code] ?? event.key.toLowerCase();
      controlsRef.current.keys.delete(key);
    };
    const clearMovement = () => controlsRef.current.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearMovement);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearMovement);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aim = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const game = gameRef.current;
      if (game.mode === 'topDown') {
        const size = Math.min(box.width, box.height);
        const x = (event.clientX - box.left - (box.width - size) / 2) / size * 900;
        const y = (event.clientY - box.top - (box.height - size) / 2) / size * 900;
        game.player.angle = Math.atan2(y - game.player.y, x - game.player.x);
      } else if (event.movementX) game.player.angle += event.movementX * 0.003;
    };
    const fireFromCanvas = () => {
      setStarted(true);
      if (gameRef.current.mode === 'firstPerson') canvas.requestPointerLock();
      isFiringRef.current = true;
      shoot(gameRef.current);
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
          weaponId: current.loadout.weaponId,
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
      <div className="mobile-controls">
        <div className="move-pad">
          <button className="move-up" onPointerDown={() => setMoveKey('w', true)}
            onPointerUp={() => setMoveKey('w', false)} onPointerCancel={() => setMoveKey('w', false)}>▲</button>
          <button onPointerDown={() => setMoveKey('a', true)}
            onPointerUp={() => setMoveKey('a', false)} onPointerCancel={() => setMoveKey('a', false)}>◀</button>
          <button onPointerDown={() => setMoveKey('s', true)}
            onPointerUp={() => setMoveKey('s', false)} onPointerCancel={() => setMoveKey('s', false)}>▼</button>
          <button onPointerDown={() => setMoveKey('d', true)}
            onPointerUp={() => setMoveKey('d', false)} onPointerCancel={() => setMoveKey('d', false)}>▶</button>
        </div>
        <div className="action-pad">
          <button onClick={toggleCamera}>V</button>
          <button onClick={() => reload(gameRef.current)}>R</button>
          <button className="fire-button" onPointerDown={startFiring}
            onPointerUp={stopFiring} onPointerCancel={stopFiring}>ОГОНЬ</button>
        </div>
      </div>
    </div>
  );
}
