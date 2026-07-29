import { getWeapon } from '../game/catalog';
import { getTrophyReward } from '../game/gameState';
import type { GameState } from '../game/types';

type Props = {
  game: GameState;
  onRestart: () => void;
  onLobby: () => void;
  onlineCount: number;
};

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function GameHud({ game, onRestart, onLobby, onlineCount }: Props) {
  const weapon = getWeapon(game.loadout.weaponId);
  const health = game.player.health / game.player.maxHealth * 100;
  const trophyReward = getTrophyReward(game);

  return (
    <>
      <div className="hud">
        <div className="hud__health">
          <span>HP</span><div><i style={{ width: `${health}%` }} /></div>
          <b>{Math.ceil(game.player.health)}</b>
        </div>
        <div className="hud__score">
          ОНЛАЙН: {onlineCount} <b>{game.score}</b><small>{signed(game.rubiesEarned)} ♦</small>
        </div>
        <div className="hud__ammo">
          <b>{game.ammo}</b> / {game.reserveAmmo}
          <small>{game.isReloading ? 'ПЕРЕЗАРЯДКА…' : `${weapon.name} · в запасе ${game.reserveAmmo}`}</small>
        </div>
      </div>
      <div className="mode-pill">
        {game.mode === 'topDown' ? 'Вид с арены' : 'От первого лица'} <span>V</span>
      </div>
      {game.gameOver && (
        <div className="game-over">
          <div>
            <small>{game.result === 'victory' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</small>
            <h2>{signed(trophyReward)} 🏆 · {signed(game.rubiesEarned)} ♦</h2>
            <div className="game-over__actions">
              <button onClick={onRestart}>Ещё бой</button>
              <button className="ghost-action" onClick={onLobby}>В лобби</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
