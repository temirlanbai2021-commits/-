type Currency = 'coins' | 'rubies';

export type ShopOffer = {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: number;
  currency: Currency;
};

type Props = {
  coins: number;
  rubies: number;
  ownedOffers: string[];
  onBuy: (offer: ShopOffer) => void;
  onClose: () => void;
};

const offers: ShopOffer[] = [
  { id: 'power-pack', title: 'Набор силы', description: '+120 опыта бойца', icon: '⚡', price: 100, currency: 'coins' },
  { id: 'neon-skin', title: 'Скин «Неон»', description: 'Редкий образ для Искры', icon: '🥷', price: 75, currency: 'rubies' },
  { id: 'weapon-case', title: 'Оружейный ящик', description: '+200 монет', icon: '🎁', price: 45, currency: 'rubies' },
  { id: 'gold-skin', title: 'Скин «Золото»', description: 'Эпический образ бойца', icon: '👑', price: 140, currency: 'rubies' },
];

export function ShopPanel({ coins, rubies, ownedOffers, onBuy, onClose }: Props) {
  return (
    <div className="shop-page" role="dialog" aria-modal="true">
      <header className="shop-header">
        <button onClick={onClose}>←</button>
        <div><small>БРАСТЭНД</small><h1>МАГАЗИН</h1></div>
        <div className="shop-wallet"><span>🪙 {coins}</span><span>♦ {rubies}</span></div>
      </header>
      <section className="shop-banner">
        <div><small>ПРЕДЛОЖЕНИЕ ДНЯ</small><h2>СТАРТОВЫЙ НАБОР</h2><p>Монеты, рубины и усиление бойца</p></div>
        <button disabled>СКОРО</button>
      </section>
      <h2 className="shop-section-title">ЕЖЕДНЕВНЫЕ ПРЕДЛОЖЕНИЯ</h2>
      <section className="shop-grid">
        {offers.map((offer) => {
          const owned = ownedOffers.includes(offer.id);
          const canBuy = offer.currency === 'coins' ? coins >= offer.price : rubies >= offer.price;
          return (
            <article className={`shop-offer shop-offer--${offer.id}`} key={offer.id}>
              <span className="shop-offer__icon">{offer.icon}</span>
              <h3>{offer.title}</h3><p>{offer.description}</p>
              <button disabled={owned || !canBuy} onClick={() => onBuy(offer)}>
                {owned ? 'КУПЛЕНО' : `${offer.currency === 'coins' ? '🪙' : '♦'} ${offer.price}`}
              </button>
            </article>
          );
        })}
      </section>
      <p className="shop-note">Все покупки здесь только за игровую валюту.</p>
    </div>
  );
}
