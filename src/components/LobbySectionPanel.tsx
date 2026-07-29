import { useState } from 'react';
import type { FighterId, WeaponId } from '../game/catalog';
import { fighters, weapons } from '../game/catalog';
import { fighterSources } from '../game/fighterSprites';

export type LobbySection = 'fighters' | 'weapons' | 'friends' | 'clan' | 'news';

type Props = {
  section: LobbySection;
  weaponId: WeaponId;
  fighterId: FighterId;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onSelectFighter: (fighterId: FighterId) => void;
  onClose: () => void;
};

const titles: Record<LobbySection, string> = {
  fighters: 'БОЙЦЫ', weapons: 'АРСЕНАЛ', friends: 'ДРУЗЬЯ', clan: 'КЛАН', news: 'НОВОСТИ',
};

export function LobbySectionPanel({
  section, weaponId, fighterId, onSelectWeapon, onSelectFighter, onClose,
}: Props) {
  const [message, setMessage] = useState('');
  const [clanName, setClanName] = useState('');

  const createClan = () => {
    const name = clanName.trim();
    setMessage(name ? `Клан «${name}» создан!` : 'Сначала введи название клана.');
  };

  return (
    <div className="section-overlay" role="dialog" aria-modal="true">
      <section className="section-panel">
        <header><h2>{titles[section]}</h2><button onClick={onClose}>×</button></header>
        {section === 'fighters' && (
          <div className="fighter-panel-grid">
            {fighters.map((fighter) => (
              <button className={fighter.id === fighterId ? 'selected' : ''} key={fighter.id}
                onClick={() => { onSelectFighter(fighter.id); setMessage(`${fighter.name} выбран`); }}>
                <img src={fighterSources[fighter.id]} alt={fighter.name} />
                <strong>{fighter.name}</strong><small>{fighter.role}</small>
              </button>
            ))}
          </div>
        )}
        {section === 'weapons' && (
          <div className="arsenal-grid">
            {weapons.map((weapon) => (
              <button className={weapon.id === weaponId ? 'selected' : ''} key={weapon.id}
                onClick={() => { onSelectWeapon(weapon.id); setMessage(`${weapon.name} выбрано`); }}>
                <i>🔫</i><strong>{weapon.name}</strong><span>{weapon.kind}</span>
                <small>Урон {weapon.damage} · Магазин {weapon.ammo}</small>
              </button>
            ))}
          </div>
        )}
        {section === 'friends' && (
          <div className="friends-list">
            {['Rex_07', 'ALMA', 'GhostKZ'].map((friend, index) => (
              <article key={friend}><i>{friend[0]}</i><span><b>{friend}</b><small>{index === 1 ? 'В бою' : 'В сети'}</small></span>
                <button onClick={() => setMessage(`Приглашение для ${friend} отправлено`)}>+</button></article>
            ))}
          </div>
        )}
        {section === 'clan' && (
          <div className="clan-create">
            <span>🛡️</span><h3>СОЗДАЙ СВОЙ КЛАН</h3><p>Играй вместе с друзьями и поднимайся по рейтингу.</p>
            <input value={clanName} onChange={(event) => setClanName(event.target.value)}
              placeholder="Название клана" maxLength={20} />
            <button onClick={createClan}>СОЗДАТЬ</button>
          </div>
        )}
        {section === 'news' && (
          <div className="news-list">
            <article><small>СЕГОДНЯ</small><h3>Брастэнд открыт!</h3><p>Испытай гибридную арену и получи первые кубки.</p></article>
            <article><small>ОБНОВЛЕНИЕ</small><h3>12 уровней силы</h3><p>Прокачивай каждого бойца и усиливай характеристики.</p></article>
          </div>
        )}
        {message && <p className="section-message">{message}</p>}
      </section>
    </div>
  );
}
