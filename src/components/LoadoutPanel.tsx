import { fighters, FighterId, getFighter, getWeapon, Loadout, weapons } from '../game/catalog';
import type { LobbySection } from './LobbySectionPanel';
import type { BattleMode } from '../game/battleMode';
import { BattleModePicker } from './BattleModePicker';
import { AmmoStore } from './AmmoStore';
import sparkImage from '../assets/fighters/spark.png';
import tankImage from '../assets/fighters/tank.png';
import ghostImage from '../assets/fighters/ghost.png';
import riotImage from '../assets/fighters/riot.png';

type UpgradeKey = 'healthLevel' | 'speedLevel' | 'damageLevel' | 'fireRateLevel';

type Props = {
  loadout: Loadout;
  rubies: number;
  coins: number;
  trophies: number;
  fighterXp: number;
  onChange: (loadout: Loadout) => void;
  onBuyUpgrade: (key: UpgradeKey) => void;
  onOpenPass: () => void;
  onOpenShop: () => void;
  onOpenSection: (section: LobbySection) => void;
  onPlay: () => void;
  battleMode: BattleMode;
  onBattleModeChange: (mode: BattleMode) => void;
  ammo: number;
  onBuyAmmo: () => void;
};

const upgrades: { key: UpgradeKey; name: string; icon: string }[] = [
  { key: 'healthLevel', name: 'HP', icon: '♥' },
  { key: 'speedLevel', name: 'Скорость', icon: '⚡' },
  { key: 'damageLevel', name: 'Урон', icon: '✦' },
  { key: 'fireRateLevel', name: 'Темп', icon: '»' },
];

const fighterImages: Record<FighterId, string> = {
  spark: sparkImage,
  tank: tankImage,
  ghost: ghostImage,
  riot: riotImage,
};

export function LoadoutPanel({
  loadout, rubies, coins, trophies, fighterXp, onChange, onBuyUpgrade, onOpenPass, onOpenShop, onPlay,
  onOpenSection, battleMode, onBattleModeChange, ammo, onBuyAmmo,
}: Props) {
  const fighter = getFighter(loadout.fighterId);
  const weapon = getWeapon(loadout.weaponId);

  const cycleFighter = (direction: number) => {
    const index = fighters.findIndex((item) => item.id === loadout.fighterId);
    const next = fighters[(index + direction + fighters.length) % fighters.length];
    onChange({ ...loadout, fighterId: next.id });
  };

  const cycleWeapon = (direction: number) => {
    const index = weapons.findIndex((item) => item.id === loadout.weaponId);
    const next = weapons[(index + direction + weapons.length) % weapons.length];
    onChange({ ...loadout, weaponId: next.id });
  };

  return (
    <section className="battle-lobby">
      <div className="lobby-topbar">
        <div className="player-card"><i>Б</i><span><strong>BRST PLAYER</strong><small>🏆 {trophies}</small></span></div>
        <div className="lobby-wallet">
          <span>🪙 <b>{coins}</b></span><span className="ruby-balance">♦ <b>{rubies}</b></span>
          <button aria-label="Купить валюту">+</button>
        </div>
      </div>

      <nav className="lobby-rail" aria-label="Разделы игры">
        <button type="button" onClick={onOpenShop}><i>🛒</i><span>МАГАЗИН</span></button>
        <button type="button" onClick={() => onOpenSection('fighters')}><i>⭐</i><span>БОЙЦЫ</span></button>
        <button type="button" onClick={() => onOpenSection('weapons')}><i>🔫</i><span>ОРУЖИЕ</span></button>
        <button type="button" onClick={onOpenPass}><i>🎫</i><span>БП / VIP</span></button>
      </nav>

      <div className="fighter-stage">
        <div className="fighter-rank">
          СИЛА {loadout.fighterLevel}/12
          <span>{loadout.fighterLevel === 12 ? 'МАКС.' : `${fighterXp} / ${loadout.fighterLevel * 100} XP`}</span>
        </div>
        <div className="fighter-picker">
          <button onClick={() => cycleFighter(-1)}>‹</button>
          <img className="fighter-render" src={fighterImages[fighter.id]} alt={fighter.name} />
          <button onClick={() => cycleFighter(1)}>›</button>
        </div>
        <div className="fighter-name"><small>{fighter.role}</small><h1>{fighter.name}</h1></div>
        <div className="fighter-roster" aria-label="Выбрать бойца">
          {fighters.map((item) => (
            <button type="button" className={item.id === fighter.id ? 'selected' : ''}
              key={item.id} onClick={() => onChange({ ...loadout, fighterId: item.id })}>
              <img src={fighterImages[item.id]} alt="" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="lobby-social">
        <button type="button" onClick={() => onOpenSection('news')}><i>📰</i><span>НОВОСТИ</span></button>
        <button type="button" onClick={() => onOpenSection('friends')}><i>👥</i><span>ДРУЗЬЯ</span></button>
        <button type="button" onClick={() => onOpenSection('clan')}><i>🛡️</i><span>КЛАН</span></button>
      </aside>

      <div className="upgrade-dock">
        {upgrades.map((upgrade) => (
          <button key={upgrade.key} disabled={rubies < 25 || loadout[upgrade.key] >= 5}
            onClick={() => onBuyUpgrade(upgrade.key)}>
            <i>{upgrade.icon}</i><span>{upgrade.name}<small>УР. {loadout[upgrade.key]} · 25 ♦</small></span>
          </button>
        ))}
      </div>

      <div className="trophy-road">
        <b>ПУТЬ СЛАВЫ</b>
        <div><i style={{ width: `${Math.min(100, trophies / 2)}%` }} /></div>
        <span>🏆 {trophies} <small>Следующая награда: 200</small></span>
      </div>

      <AmmoStore ammo={ammo} coins={coins} onBuy={onBuyAmmo} />

      <div className="lobby-bottom">
        <button className="weapon-arrow" onClick={() => cycleWeapon(-1)}>‹</button>
        <div className="mode-card">
          <BattleModePicker value={battleMode} onChange={onBattleModeChange} />
          <strong>ГИБРИДНАЯ АРЕНА</strong>
          <small>🔫 {weapon.name} · {weapon.kind} · нажми, чтобы сменить</small>
        </div>
        <button className="weapon-arrow" onClick={() => cycleWeapon(1)}>›</button>
        <button type="button" className="battle-button" onClick={onPlay}>В БОЙ!</button>
      </div>
    </section>
  );
}
