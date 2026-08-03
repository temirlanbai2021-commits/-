import { useState } from 'react';
import type { FighterId } from '../game/catalog';
import { elements, fighters, getFighter, rarities } from '../game/catalog';
import { fighterSources } from '../game/fighterSprites';
import { FriendsPanel } from './FriendsPanel';

export type LobbySection = 'fighters' | 'elements' | 'friends' | 'clan' | 'news';

type Props = {
  section: LobbySection;
  fighterId: FighterId;
  onSelectFighter: (fighterId: FighterId) => void;
  onClose: () => void;
};

const titles: Record<LobbySection, string> = {
  fighters: 'БОЙЦЫ', elements: 'СТИХИИ', friends: 'ДРУЗЬЯ', clan: 'КЛАН', news: 'НОВОСТИ',
};

export function LobbySectionPanel({
  section, fighterId, onSelectFighter, onClose,
}: Props) {
  const [message, setMessage] = useState('');
  const [clanName, setClanName] = useState('');

  const createClan = () => {
    const name = clanName.trim();
    setMessage(name ? `Клан «${name}» создан!` : 'Сначала введи название клана.');
  };

  return (
    <div className="section-overlay" role="dialog" aria-modal="true">
      <section className={`section-panel section-panel--${section}`}>
        <header><h2>{titles[section]}</h2><button onClick={onClose}>×</button></header>
        {section === 'fighters' && (
          <div className="fighter-panel-grid">
            {fighters.map((fighter) => (
              <button className={fighter.id === fighterId ? 'selected' : ''} key={fighter.id}
                onClick={() => { onSelectFighter(fighter.id); onClose(); }}>
                <img src={fighterSources[fighter.id]} alt={fighter.name} />
                <strong>{fighter.name}</strong>
                <small className="rarity-label" style={{ color: rarities[fighter.rarity].color }}>
                  {rarities[fighter.rarity].name}
                </small>
                <small>Слабость: {getFighter(fighter.counteredBy).name}</small>
                <small>{elements[fighter.elementId].icon} {elements[fighter.elementId].name}</small>
              </button>
            ))}
          </div>
        )}
        {section === 'elements' && (
          <div className="arsenal-grid">
            {fighters.map((fighter) => (
              <button className={fighter.id === fighterId ? 'selected' : ''} key={fighter.id}
                onClick={() => { onSelectFighter(fighter.id); setMessage(`${elements[fighter.elementId].name}: ${fighter.name}`); }}>
                <i>{elements[fighter.elementId].icon}</i><strong>{elements[fighter.elementId].name}</strong>
                <span>{fighter.name}</span><small>{fighter.ability}</small>
              </button>
            ))}
          </div>
        )}
        {section === 'friends' && (
          <FriendsPanel />
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
            <article className="news-list__hero news-list__football">
              <small>НОВЫЙ РЕЖИМ</small>
              <h3>⚽ Футбол уже в игре!</h3>
              <p>Сражайся командой 3 на 3, подбери мяч и занеси его в ворота. Побеждает команда с двумя голами.</p>
            </article>
            <article className="news-list__hero">
              <small>НОВОЕ ОБНОВЛЕНИЕ</small>
              <h3>Редкости бойцов и два новых героя!</h3>
              <p>У каждого бойца появилась своя редкость: редкая, сверхредкая, эпическая,
                мифическая или легендарная. Встречай мифического Рифта и легендарную Нову!</p>
            </article>
            <article className="news-list__hero">
              <small>БОЛЬШОЕ БОЕВОЕ ОБНОВЛЕНИЕ</small>
              <h3>Умные бойцы и усиленный Титан!</h3>
              <p>Противники и тиммейты теперь используют свои атаки, ульты и гиперы. Союзники сражаются на том же уровне, что и враги, а Титан выпускает мощный тройной каменный залп.</p>
            </article>
            <article>
              <small>БАЛАНС БОЙЦОВ</small>
              <h3>Инферно и все бойцы стали сильнее!</h3>
              <p>Инферно поджигает врагов обычными атаками. Флора лучше лечится, Титан наносит больше урона, Шейд пробивает цели, Аэро усилил залп, Импульс улучшил цепную молнию, Крио сильнее замедляет, а Призрак восстанавливает здоровье попаданиями.</p>
            </article>
            <article>
              <small>ИЗМЕНЕНИЕ БАЛАНСА</small>
              <h3>Больше здоровья и честнее противники</h3>
              <p>Все бойцы получили на 25% больше здоровья. Компьютерные команды стали слабее, а Аэро теперь стреляет реже и наносит заметно меньше урона.</p>
            </article>
            <article className="news-list__hero">
              <small>НОВОЕ ОБНОВЛЕНИЕ</small><h3>Новый боец — Призрак!</h3>
              <p>Призрак может проходить прямо сквозь стены. Используй бесплотную форму, чтобы неожиданно появляться за спиной противников.</p>
            </article>
            <article><small>СЕГОДНЯ</small><h3>Братемир открыт!</h3><p>Испытай гибридную арену и получи первые кубки.</p></article>
            <article><small>ОБНОВЛЕНИЕ</small><h3>12 уровней силы</h3><p>Прокачивай каждого бойца и усиливай характеристики.</p></article>
          </div>
        )}
        {message && <p className="section-message">{message}</p>}
      </section>
    </div>
  );
}
