type DailyOffer = {
  id: string;
  category: 'skins' | 'resources';
};

const DAY_MS = 24 * 60 * 60 * 1000;

const hash = (text: string) => {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
};

export function getDailyOffers<T extends DailyOffer>(offers: T[], now = new Date()) {
  const day = Math.floor(new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
  ).getTime() / DAY_MS);
  const choose = (category: DailyOffer['category'], count: number) => offers
    .filter((offer) => offer.category === category)
    .sort((left, right) => hash(`${left.id}-${day}`) - hash(`${right.id}-${day}`))
    .slice(0, count);

  return [...choose('skins', 4), ...choose('resources', 2)];
}

export function getShopCountdown(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const seconds = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
