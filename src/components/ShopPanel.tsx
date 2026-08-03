import { useEffect, useState } from 'react';
import { getDailyOffers, getShopCountdown } from '../game/dailyShop';

type Currency = 'coins' | 'rubies';
type Category = 'skins' | 'resources';
export type ShopOffer = {
  id: string; title: string; description: string; icon: string;
  price: number; currency: Currency; category: Category;
};
type Props = {
  coins: number; rubies: number; ownedOffers: string[];
  onBuy: (offer: ShopOffer) => void; onClose: () => void;
};

const offers: ShopOffer[] = [
  { id: 'neon-skin', title: 'Неон Искра', description: 'Редкий скин для Искры', icon: '🥷', price: 75, currency: 'rubies', category: 'skins' },
  { id: 'gold-skin', title: 'Золотой Гранит', description: 'Эпический скин для Гранита', icon: '👑', price: 140, currency: 'rubies', category: 'skins' },
  { id: 'ghost-skin', title: 'Кибер Фантом', description: 'Сверхредкий скин Фантома', icon: '🤖', price: 110, currency: 'rubies', category: 'skins' },
  { id: 'riot-skin', title: 'Рок Бунтарка', description: 'Яркий образ Бунтарки', icon: '🎸', price: 90, currency: 'rubies', category: 'skins' },
  { id: 'spark-space', title: 'Космо Искра', description: 'Космический скин Искры', icon: '🚀', price: 120, currency: 'rubies', category: 'skins' },
  { id: 'tank-ice', title: 'Ледяной Гранит', description: 'Морозный защитник', icon: '🥶', price: 95, currency: 'rubies', category: 'skins' },
  { id: 'ghost-shadow', title: 'Теневой Фантом', description: 'Легендарный образ Фантома', icon: '👤', price: 170, currency: 'rubies', category: 'skins' },
  { id: 'riot-punk', title: 'Панк Бунтарка', description: 'Эпический сценический образ', icon: '🤘', price: 135, currency: 'rubies', category: 'skins' },
  { id: 'spark-summer', title: 'Летняя Искра', description: 'Пляжный скин Искры', icon: '🌴', price: 70, currency: 'rubies', category: 'skins' },
  { id: 'tank-royal', title: 'Король Гранит', description: 'Королевская броня', icon: '🦁', price: 150, currency: 'rubies', category: 'skins' },
  { id: 'ghost-toxic', title: 'Токсик Фантом', description: 'Ядовитый редкий скин', icon: '☣️', price: 85, currency: 'rubies', category: 'skins' },
  { id: 'riot-fire', title: 'Огненная Бунтарка', description: 'Пылающий образ бойца', icon: '🔥', price: 125, currency: 'rubies', category: 'skins' },
  { id: 'power-pack', title: 'Набор силы', description: '+120 опыта бойца', icon: '⚡', price: 100, currency: 'coins', category: 'resources' },
  { id: 'weapon-case', title: 'Оружейный ящик', description: '+200 монет', icon: '🎁', price: 45, currency: 'rubies', category: 'resources' },
];

export function ShopPanel({ coins, rubies, ownedOffers, onBuy, onClose }: Props) {
  const [category, setCategory] = useState<Category>('skins');
  const [now, setNow] = useState(() => new Date());
  const dailyOffers = getDailyOffers(offers, now);
  const visibleOffers = dailyOffers.filter((offer) => offer.category === category);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="shop-page" role="dialog" aria-modal="true">
      <header className="shop-header">
        <button onClick={onClose}>←</button>
        <div><small>БРАТЕМИР · ОБНОВЛЕНИЕ {getShopCountdown(now)}</small><h1>МАГАЗИН</h1></div>
        <div className="shop-wallet"><span>🪙 {coins}</span><span>♦ {rubies}</span></div>
      </header>
      <section className="shop-banner">
        <div><small>ПРЕДЛОЖЕНИЕ ДНЯ</small><h2>ЛЕГЕНДАРНЫЙ НАБОР</h2><p>Скин, значок игрока и усиление бойца</p></div>
        <button onClick={() => setCategory('resources')}>РЕСУРСЫ</button>
      </section>
      <nav className="shop-tabs">
        <button className={category === 'skins' ? 'selected' : ''} onClick={() => setCategory('skins')}>СКИНЫ</button>
        <button className={category === 'resources' ? 'selected' : ''} onClick={() => setCategory('resources')}>РЕСУРСЫ</button>
      </nav>
      <section className="shop-grid">
        {visibleOffers.map((offer) => {
          const owned = ownedOffers.includes(offer.id);
          const canBuy = offer.currency === 'coins' ? coins >= offer.price : rubies >= offer.price;
          return (
            <article className={`shop-offer shop-offer--${offer.id}`} key={offer.id}>
              <span className="shop-offer__rarity">{offer.category === 'skins' ? 'СКИН БОЙЦА' : 'НАБОР'}</span>
              <span className="shop-offer__icon">{offer.icon}</span>
              <h3>{offer.title}</h3><p>{offer.description}</p>
              <button disabled={owned || !canBuy} onClick={() => onBuy(offer)}>
                {owned ? 'КУПЛЕНО' : `${offer.currency === 'coins' ? '🪙' : '♦'} ${offer.price}`}
              </button>
            </article>
          );
        })}
      </section>
      <p className="shop-note">Все предметы покупаются только за игровую валюту.</p>
    </div>
  );
}
