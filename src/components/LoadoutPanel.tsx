import { elements, fighters, getFighter, Loadout, rarities } from '../game/catalog';
import type { LobbySection } from './LobbySectionPanel';
import type { ReactNode } from 'react';
import { fighterSources } from '../game/fighterSprites';
import { getUpgradeCost, MAX_UPGRADE_LEVEL } from '../game/upgrades';
import { Leaderboard } from './Leaderboard';

type UpgradeKey = 'healthLevel' | 'speedLevel' | 'damageLevel' | 'fireRateLevel';
type Props = {
  loadout: Loadout; rubies: number; coins: number; trophies: number; fighterTrophies: number; fighterXp: number;
  onChange: (loadout: Loadout) => void; onBuyUpgrade: (key: UpgradeKey) => void;
  onOpenPass: () => void; onOpenShop: () => void; onOpenMap: () => void;
  onOpenFriendly: () => void;
  onOpenAi: () => void;
  onOpenSection: (section: LobbySection) => void; onPlay: () => void;
  account: ReactNode; music: ReactNode;
};

const upgrades: { key: UpgradeKey; name: string; benefit: string; icon: string }[] = [
  { key: 'healthLevel', name: 'Здоровье', benefit: '+12 HP', icon: '♥' },
  { key: 'speedLevel', name: 'Скорость', benefit: '+13', icon: '⚡' },
  { key: 'damageLevel', name: 'Урон', benefit: '+12%', icon: '✦' },
  { key: 'fireRateLevel', name: 'Атака', benefit: 'быстрее', icon: '»' },
];
export function LoadoutPanel(props: Props) {
  const {
    loadout, rubies, coins, trophies, fighterTrophies, fighterXp, onChange, onBuyUpgrade, onOpenPass,
    onOpenShop, onOpenMap, onOpenFriendly, onOpenAi, onOpenSection, onPlay,
    account, music,
  } = props;
  const fighter = getFighter(loadout.fighterId);
  const element = elements[fighter.elementId];

  const cycleFighter = (direction: number) => {
    const index = fighters.findIndex((item) => item.id === loadout.fighterId);
    onChange({ ...loadout, fighterId: fighters[(index + direction + fighters.length) % fighters.length].id });
  };

  return (
    <section className="battle-lobby">
      <div className="lobby-topbar">
        <button type="button" className="player-card" onClick={() => onOpenSection('fighters')}>
          <i>Б</i><span><strong>BRST PLAYER</strong><small>🏆 {trophies}</small></span>
        </button>
        <div className="top-trophies"><span>ОБЩИЙ РЕЙТИНГ</span><b>🏆 {trophies}</b></div>
        {account}
        <div className="lobby-wallet"><span>🪙 <b>{coins}</b></span><span className="ruby-balance">♦ <b>{rubies}</b></span></div>
      </div>

      <nav className="lobby-rail" aria-label="Главное меню">
        <button type="button" onClick={onOpenShop}><i>🛒</i><span>МАГАЗИН</span></button>
        <button type="button" onClick={() => onOpenSection('fighters')}><i>⭐</i><span>БОЙЦЫ</span></button>
        <button type="button" onClick={onOpenPass}><i>🎫</i><span>ПРОПУСК</span></button>
      </nav>

      <div className="fighter-stage">
        <div className="fighter-stats">
          <div className="fighter-trophies"><small>КУБКИ БОЙЦА</small><b>🏆 {fighterTrophies}</b></div>
          <div className="fighter-rank">СИЛА {loadout.fighterLevel}<span>{fighterXp}/{loadout.fighterLevel * 100} XP</span></div>
        </div>
        <div className="fighter-picker">
          <button type="button" className="fighter-arrow fighter-arrow--left"
            aria-label="Предыдущий боец" onClick={() => cycleFighter(-1)}>‹</button>
          <img className={`fighter-render fighter-render--${fighter.elementId}`}
            src={fighterSources[fighter.id]} alt={fighter.name} />
          <button type="button" className="fighter-arrow fighter-arrow--right"
            aria-label="Следующий боец" onClick={() => cycleFighter(1)}>›</button>
        </div>
        <div className="fighter-name">
          <small>{fighter.role}</small><h1>{fighter.name}</h1>
          <b className="fighter-rarity" style={{ color: rarities[fighter.rarity].color }}>
            {rarities[fighter.rarity].name}
          </b>
          <span className="fighter-counter">СЛАБОСТЬ: {getFighter(fighter.counteredBy).name}</span>
        </div>
      </div>

      <aside className="lobby-social">
        {music}
        <button type="button" onClick={onOpenAi}><i>🤖</i><span>ИИ-ТРЕНЕР</span></button>
        <button type="button" className="friendly-menu-button" onClick={onOpenFriendly}><i>🤝</i><span>ДРУЖЕСКИЙ</span></button>
        <button type="button" onClick={onOpenMap}><i>🗺️</i><span>КАРТА</span></button>
        <button type="button" onClick={() => onOpenSection('friends')}><i>👥</i><span>ДРУЗЬЯ</span></button>
        <Leaderboard trophies={trophies} />
      </aside>

      <section className="upgrade-dock" aria-label="Улучшения бойца">
        <h2>УЛУЧШЕНИЯ</h2>
        {upgrades.map((upgrade) => (
          <button type="button" key={upgrade.key}
            disabled={rubies < getUpgradeCost(loadout[upgrade.key])
              || loadout[upgrade.key] >= MAX_UPGRADE_LEVEL}
            onClick={() => onBuyUpgrade(upgrade.key)}>
            <i>{upgrade.icon}</i>
            <span><b>{upgrade.name}</b><small>{upgrade.benefit}</small></span>
            <em>{loadout[upgrade.key] >= MAX_UPGRADE_LEVEL
              ? 'МАКС.' : `Ур. ${loadout[upgrade.key]} → ${loadout[upgrade.key] + 1} · ${getUpgradeCost(loadout[upgrade.key])} ♦`}</em>
          </button>
        ))}
      </section>

      <div className="trophy-road"><b>ПУТЬ СЛАВЫ</b><div><i style={{ width: `${Math.min(100, trophies / 2)}%` }} /></div>
        <span>🏆 {trophies}<small>Награда: 200</small></span></div>
      <div className="lobby-bottom">
        <div className="mode-card"><strong>{element.icon} Стихия: {element.name}</strong>
          <small>{fighter.ability}</small></div>
        <button type="button" className="battle-button" onClick={onPlay}>
          В БОЙ!
        </button>
      </div>
    </section>
  );
}
