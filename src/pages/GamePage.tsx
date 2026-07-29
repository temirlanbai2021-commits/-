import { useCallback, useState } from 'react';
import { Link } from 'wouter';
import { GameCanvas } from '../components/GameCanvas';
import { GameHud } from '../components/GameHud';
import { LoadoutPanel } from '../components/LoadoutPanel';
import { BattlePassPanel } from '../components/BattlePassPanel';
import { ShopOffer, ShopPanel } from '../components/ShopPanel';
import { LobbySection, LobbySectionPanel } from '../components/LobbySectionPanel';
import { defaultLoadout, FighterId, Loadout } from '../game/catalog';
import { createGame, getTrophyReward } from '../game/gameState';
import type { BattleMode } from '../game/battleMode';

type UpgradeKey = 'healthLevel' | 'speedLevel' | 'damageLevel' | 'fireRateLevel';
type FighterProgress = Record<FighterId, { level: number; xp: number }>;

const initialProgress: FighterProgress = {
  spark: { level: 1, xp: 0 },
  tank: { level: 1, xp: 0 },
  ghost: { level: 1, xp: 0 },
  riot: { level: 1, xp: 0 },
};

export function GamePage() {
  const [loadout, setLoadout] = useState<Loadout>(defaultLoadout);
  const [rubies, setRubies] = useState(100);
  const [coins, setCoins] = useState(250);
  const [ammoStock, setAmmoStock] = useState(90);
  const [trophies, setTrophies] = useState(0);
  const [progress, setProgress] = useState<FighterProgress>(initialProgress);
  const [ownedOffers, setOwnedOffers] = useState<string[]>([]);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [openSection, setOpenSection] = useState<LobbySection | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleMode>('solo');
  const [onlineCount, setOnlineCount] = useState(0);
  const [game, setGame] = useState(() => createGame(loadout));
  const [resetSignal, setResetSignal] = useState(0);
  const update = useCallback((next: ReturnType<typeof createGame>) => setGame(next), []);

  const startBattle = () => {
    setIsPlaying(true);
    setResetSignal((value) => value + 1);
  };

  const collectBattleRewards = () => {
    setRubies((value) => Math.max(0, value + game.rubiesEarned));
    setTrophies((value) => Math.max(0, value + getTrophyReward(game)));
    addFighterXp(game.score * 20 + (game.result === 'victory' ? 100 : 20));
  };

  const addFighterXp = (amount: number) => {
    const fighterId = loadout.fighterId;
    let { level, xp } = progress[fighterId];
    xp += amount;
    while (level < 12 && xp >= level * 100) {
      xp -= level * 100;
      level += 1;
    }
    if (level === 12) xp = 0;
    setProgress((current) => ({ ...current, [fighterId]: { level, xp } }));
    setLoadout((value) => ({ ...value, fighterLevel: level }));
  };

  const returnToLobby = () => {
    collectBattleRewards();
    setAmmoStock(game.ammo + game.reserveAmmo);
    setIsPlaying(false);
  };

  const restartBattle = () => {
    collectBattleRewards();
    setAmmoStock(game.ammo + game.reserveAmmo);
    startBattle();
  };

  const buyAmmo = () => {
    if (coins < 40) return;
    setCoins((value) => value - 40);
    setAmmoStock((value) => value + 30);
  };

  const buyUpgrade = (key: UpgradeKey) => {
    if (rubies < 25 || loadout[key] >= 5) return;
    setRubies((value) => value - 25);
    setLoadout((value) => ({ ...value, [key]: value[key] + 1 }));
  };

  const changeLoadout = (next: Loadout) => {
    const fighterProgress = progress[next.fighterId];
    setLoadout({ ...next, fighterLevel: fighterProgress.level });
  };

  const buyOffer = (offer: ShopOffer) => {
    if (offer.currency === 'coins') setCoins((value) => value - offer.price);
    else setRubies((value) => value - offer.price);
    if (offer.id === 'power-pack') addFighterXp(120);
    if (offer.id === 'weapon-case') setCoins((value) => value + 200);
    setOwnedOffers((value) => [...value, offer.id]);
  };

  return (
    <main className="game-page">
      <header className="game-header">
        <Link href="/" className="game-logo">БРАС<span>ТЭНД</span></Link>
        <div className="desktop-controls">WASD — движение · мышь — огонь · V — камера · R — перезарядка</div>
      </header>
      {isPlaying ? (
        <section className="game-stage">
          <GameCanvas loadout={loadout} battleMode={battleMode} ammoStock={ammoStock}
            onUpdate={update} resetSignal={resetSignal} onOnlineCount={setOnlineCount} />
          <GameHud game={game} onlineCount={onlineCount} onRestart={restartBattle} onLobby={returnToLobby} />
        </section>
      ) : (
        <LoadoutPanel loadout={loadout} rubies={rubies} coins={coins} trophies={trophies}
          fighterXp={progress[loadout.fighterId].xp} onChange={changeLoadout}
          onBuyUpgrade={buyUpgrade} onOpenPass={() => setIsPassOpen(true)}
          onOpenShop={() => setIsShopOpen(true)} onOpenSection={setOpenSection} onPlay={startBattle}
          battleMode={battleMode} onBattleModeChange={setBattleMode}
          ammo={ammoStock} onBuyAmmo={buyAmmo} />
      )}
      {isPassOpen && <BattlePassPanel onClose={() => setIsPassOpen(false)} />}
      {isShopOpen && <ShopPanel coins={coins} rubies={rubies} ownedOffers={ownedOffers}
        onBuy={buyOffer} onClose={() => setIsShopOpen(false)} />}
      {openSection && (
        <LobbySectionPanel section={openSection} weaponId={loadout.weaponId}
          fighterId={loadout.fighterId}
          onSelectWeapon={(weaponId) => setLoadout((value) => ({ ...value, weaponId }))}
          onSelectFighter={(fighterId) => changeLoadout({ ...loadout, fighterId })}
          onClose={() => setOpenSection(null)} />
      )}
    </main>
  );
}
