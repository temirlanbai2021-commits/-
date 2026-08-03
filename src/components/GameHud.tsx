import { getElement } from '../game/catalog';
import { getTrophyReward } from '../game/gameState';
import type { GameState } from '../game/types';
import { getHyperName, getSuperName } from '../game/abilities';
import { getTeamCrystalCount } from '../game/crystalMode';

type Props = {
  game: GameState;
  onRestart: () => void;
  onLobby: () => void;
  onlineCount: number;
};

const signed = (value: number) => value > 0 ? `+${value}` : String(value);

export function GameHud({ game, onRestart, onLobby, onlineCount }: Props) {
  const element = getElement(game.loadout.fighterId);
  const health = game.player.health / game.player.maxHealth * 100;
  const playerCrystals = getTeamCrystalCount(game, 'player');
  const enemyCrystals = getTeamCrystalCount(game, 'enemy');
  const status = game.battleMode === 'territory'
    ? `МЫ: ${Math.floor(game.territoryProgress)}% · ВРАГИ: ${Math.floor(game.enemyTerritoryProgress)}%`
    : game.battleMode === 'solo'
      ? `В ЖИВЫХ: ${game.enemies.length + (game.player.health > 0 ? 1 : 0)}`
      : game.battleMode === '3v3'
        ? `💎 МЫ: ${playerCrystals} · ВРАГИ: ${enemyCrystals}`
        : game.battleMode === 'football'
          ? `⚽ МЫ ${game.footballScore.player} : ${game.footballScore.enemy} ВРАГИ · ДО 2 ГОЛОВ`
        : game.battleMode === 'friendly'
          ? onlineCount > 1 ? 'ДРУЖЕСКИЙ БОЙ · 1 НА 1' : 'ОЖИДАНИЕ ДРУГА…'
        : `МОЯ КОМАНДА: ${game.allies.length + 1} · ВРАГИ: ${game.enemies.length} · ОНЛАЙН: ${onlineCount}`;

  return (
    <>
      <div className="hud">
        <div className="hud__health">
          <span>HP</span><div><i style={{ width: `${health}%` }} /></div>
          <b>{Math.ceil(game.player.health)}</b>
        </div>
        <div className="hud__score">
          {status}<b>{game.score}</b><small>{signed(game.rubiesEarned)} ♦</small>
        </div>
        <div className="hud__ammo">
          <b>{element.icon}</b><small>{element.name} · энергия бесконечна</small>
        </div>
      </div>
      <div className="mode-pill">
        {game.mode === 'topDown' ? 'Вид с арены' : 'От первого лица'} <span>V</span>
      </div>
      <div className={`super-meter ${game.superCharge >= 100 ? 'ready' : ''}`}>
        <span>★ {getSuperName(game)}</span><div><i style={{ width: `${game.superCharge}%` }} /></div><b>{Math.floor(game.superCharge)}%</b>
      </div>
      <div className={`hyper-meter ${game.hyperCharge >= 100 ? 'ready' : ''}`}>
        <span>H {performance.now() < game.hyperUntil ? `${getHyperName(game)} АКТИВЕН` : getHyperName(game)}</span>
        <div><i style={{ width: `${performance.now() < game.hyperUntil ? 100 : game.hyperCharge}%` }} /></div>
        <b>{performance.now() < game.hyperUntil
          ? `${Math.max(0, Math.ceil((game.hyperUntil - performance.now()) / 1000))}с`
          : `${Math.floor(game.hyperCharge)}%`}</b>
      </div>
      {game.battleMode === 'territory' && !game.gameOver && (
        <div className="territory-hint">
          <b>ЗАХВАТ ТЕРРИТОРИИ · 3 НА 3</b>
          <span>С тиммейтами захвати красную базу и защищай зелёную</span>
        </div>
      )}
      {game.battleMode === '3v3' && !game.gameOver && (
        <div className="crystal-counter">
          {game.crystalCountdownTeam ? (
            <>
              <b>{game.crystalCountdownTeam === 'player' ? 'МЫ УДЕРЖИВАЕМ' : 'ВРАГИ УДЕРЖИВАЮТ'}</b>
              <strong>{Math.max(1, Math.ceil((game.crystalCountdownEnd - performance.now()) / 1000))}</strong>
            </>
          ) : (
            <><b>СОБЕРИТЕ 10 КРИСТАЛЛОВ</b><span>Они появляются в центре арены</span></>
          )}
        </div>
      )}
      {game.battleMode === 'football' && !game.gameOver && (
        <div className="football-score">
          <b>ФУТБОЛ · ДО 2 ГОЛОВ</b>
          <strong>{game.footballScore.player} : {game.footballScore.enemy}</strong>
          <span>Подбери мяч, прицелься и нажми огонь, чтобы пнуть</span>
        </div>
      )}
      {game.player.health <= 0 && game.respawnAt > 0 && !game.gameOver && (
        <div className="respawn-overlay">
          <small>СОЮЗНИК ПРОДОЛЖАЕТ БОЙ</small>
          <strong>ВОЗРОЖДЕНИЕ ЧЕРЕЗ {Math.max(1, Math.ceil((game.respawnAt - performance.now()) / 1000))}</strong>
          <span>Ты появишься рядом с тиммейтом</span>
        </div>
      )}
      {game.gameOver && (
        <div className="game-over"><div>
          <small>{game.result === 'victory' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</small>
          <h2>{signed(getTrophyReward(game))} 🏆 · {signed(game.rubiesEarned)} ♦</h2>
          <div className="game-over__actions">
            <button onClick={onRestart}>Ещё бой</button>
            <button className="ghost-action" onClick={onLobby}>В лобби</button>
          </div>
        </div></div>
      )}
    </>
  );
}
