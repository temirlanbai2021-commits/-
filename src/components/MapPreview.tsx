import { getArena, territoryZones } from '../game/arenaMap';
import type { BattleMode } from '../game/battleMode';

type Props = { onClose: () => void; battleMode: BattleMode };

export function MapPreview({ onClose, battleMode }: Props) {
  const arena = getArena(battleMode);
  return (
    <div className="map-overlay" role="dialog" aria-modal="true" aria-label="Карта арены">
      <section className="map-panel">
        <header>
          <div><small>КАРТА РЕЖИМА</small><h2>{arena.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="map-preview" style={{ background: arena.ground }}>
          {arena.blocks.map((block, index) => (
            <i key={index} className={`map-block map-block--${block.kind}`} style={{
              left: `${block.x / 16}%`, top: `${block.y / 16}%`,
              width: `${block.width / 16}%`, height: `${block.height / 16}%`,
            }} />
          ))}
          {battleMode === 'territory' && <>
            <span className="map-zone map-zone--ally" style={{
              left: `${territoryZones.player.x / 16}%`, top: `${territoryZones.player.y / 16}%`,
            }}>БАЗА</span>
            <span className="map-zone map-zone--enemy" style={{
              left: `${territoryZones.enemy.x / 16}%`, top: `${territoryZones.enemy.y / 16}%`,
            }}>ЗАХВАТ</span>
          </>}
          {battleMode === 'football' && <>
            <span className="map-goal map-goal--ally">НАШИ</span>
            <span className="map-goal map-goal--enemy">ВРАГИ</span>
            <span className="map-ball">⚽</span>
          </>}
        </div>
        <p>{battleMode === 'territory'
          ? 'Доберись до красной зоны и удерживай её до полной победы.'
          : battleMode === 'football'
            ? 'Забей два гола раньше соперников: подбери мяч, прицелься и пни его во вражеские ворота.'
            : 'Используй стены как укрытия, а кусты — для неожиданных атак.'}</p>
      </section>
    </div>
  );
}
