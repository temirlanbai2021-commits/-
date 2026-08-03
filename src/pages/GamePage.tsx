import { useCallback, useState } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { GameHud } from '../components/GameHud';
import { LoadoutPanel } from '../components/LoadoutPanel';
import { BattlePassPanel } from '../components/BattlePassPanel';
import { ShopOffer, ShopPanel } from '../components/ShopPanel';
import { LobbySection, LobbySectionPanel } from '../components/LobbySectionPanel';
import type { Loadout } from '../game/catalog';
import { createGame, getTrophyReward } from '../game/gameState';
import type { BattleMode } from '../game/battleMode';
import { MapPreview } from '../components/MapPreview';
import { GameAccount } from '../components/GameAccount';
import { MusicToggle } from '../components/MusicToggle';
import { FriendlyBattlePanel } from '../components/FriendlyBattlePanel';
import { useSavedGameProgress } from '../hooks/useSavedGameProgress';
import { AiCoachPanel } from '../components/AiCoachPanel';
import { getUpgradeCost, MAX_UPGRADE_LEVEL } from '../game/upgrades';

type UpgradeKey = 'healthLevel' | 'speedLevel' | 'damageLevel' | 'fireRateLevel';

export function GamePage() {
  const { progress: saved, setProgress: setSaved, saveNow } = useSavedGameProgress();
  const { loadout, rubies, coins, trophies, fighterTrophies, fighters: progress, ownedOffers } = saved;
  const setSavedValue = <K extends keyof typeof saved>(key: K, value: typeof saved[K] | ((old: typeof saved[K]) => typeof saved[K])) => {
    setSaved((current) => ({
      ...current,
      [key]: typeof value === 'function'
        ? (value as (old: typeof saved[K]) => typeof saved[K])(current[key])
        : value,
    }));
  };
  const setLoadout = (value: Loadout | ((old: Loadout) => Loadout)) => setSavedValue('loadout', value);
  const setRubies = (value: number | ((old: number) => number)) => setSavedValue('rubies', value);
  const setCoins = (value: number | ((old: number) => number)) => setSavedValue('coins', value);
  const setTrophies = (value: number | ((old: number) => number)) => setSavedValue('trophies', value);
  const setFighterTrophies = (value: typeof fighterTrophies | ((old: typeof fighterTrophies) => typeof fighterTrophies)) => setSavedValue('fighterTrophies', value);
  const setProgress = (value: typeof progress | ((old: typeof progress) => typeof progress)) => setSavedValue('fighters', value);
  const setOwnedOffers = (value: string[] | ((old: string[]) => string[])) => setSavedValue('ownedOffers', value);
  const [ammoStock] = useState(90);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isFriendlyOpen, setIsFriendlyOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [friendlyRoom, setFriendlyRoom] = useState('');
  const [friendlySide, setFriendlySide] = useState<'host' | 'guest'>('host');
  const [openSection, setOpenSection] = useState<LobbySection | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleMode>('territory');
  const [onlineCount, setOnlineCount] = useState(0);
  const [game, setGame] = useState(() => createGame(loadout));
  const [resetSignal, setResetSignal] = useState(0);
  const update = useCallback((next: ReturnType<typeof createGame>) => setGame(next), []);

  const startBattle = () => {
    setIsPlaying(true);
    setResetSignal((value) => value + 1);
  };

  const startFriendlyBattle = (roomCode: string, side: 'host' | 'guest') => {
    setFriendlyRoom(roomCode);
    setFriendlySide(side);
    setBattleMode('friendly');
    setIsFriendlyOpen(false);
    setIsPlaying(true);
    setResetSignal((value) => value + 1);
  };

  const collectBattleRewards = () => {
    const trophyReward = getTrophyReward(game);
    setRubies((value) => Math.max(0, value + game.rubiesEarned));
    setTrophies((value) => Math.max(0, value + trophyReward));
    setFighterTrophies((current) => ({
      ...current,
      [loadout.fighterId]: Math.max(0, current[loadout.fighterId] + trophyReward),
    }));
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
    setProgress((current) => ({
      ...current,
      [fighterId]: { ...current[fighterId], level, xp },
    }));
    setLoadout((value) => ({ ...value, fighterLevel: level }));
  };

  const returnToLobby = () => {
    collectBattleRewards();
    setIsPlaying(false);
  };

  const restartBattle = () => {
    collectBattleRewards();
    startBattle();
  };

  const buyUpgrade = (key: UpgradeKey) => {
    const cost = getUpgradeCost(loadout[key]);
    if (rubies < cost || loadout[key] >= MAX_UPGRADE_LEVEL) return;
    setRubies((value) => value - cost);
    setLoadout((value) => ({ ...value, [key]: value[key] + 1 }));
    setProgress((current) => ({
      ...current,
      [loadout.fighterId]: {
        ...current[loadout.fighterId],
        [key]: current[loadout.fighterId][key] + 1,
      },
    }));
  };

  const changeLoadout = (next: Loadout) => {
    const fighterProgress = progress[next.fighterId];
    setLoadout({
      ...next,
      fighterLevel: fighterProgress.level,
      healthLevel: fighterProgress.healthLevel,
      speedLevel: fighterProgress.speedLevel,
      damageLevel: fighterProgress.damageLevel,
      fireRateLevel: fighterProgress.fireRateLevel,
    });
  };

  const buyOffer = (offer: ShopOffer) => {
    if (offer.currency === 'coins') setCoins((value) => value - offer.price);
    else setRubies((value) => value - offer.price);
    if (offer.id === 'power-pack') addFighterXp(120);
    if (offer.id === 'weapon-case') setCoins((value) => value + 200);
    setOwnedOffers((value) => [...value, offer.id]);
  };

  return (
    <main className={`game-page ${isPlaying ? 'game-page--playing' : ''}`}>
      {isPlaying ? (
        <section className="game-stage">
          <GameCanvas loadout={loadout} battleMode={battleMode} ammoStock={ammoStock}
            fighterTrophies={fighterTrophies[loadout.fighterId]}
            roomCode={friendlyRoom} friendlySide={friendlySide}
            onUpdate={update} resetSignal={resetSignal} onOnlineCount={setOnlineCount} />
          <GameHud game={game} onlineCount={onlineCount} onRestart={restartBattle} onLobby={returnToLobby} />
        </section>
      ) : (
        <LoadoutPanel loadout={loadout} rubies={rubies} coins={coins} trophies={trophies}
          fighterTrophies={fighterTrophies[loadout.fighterId]}
          fighterXp={progress[loadout.fighterId].xp} onChange={changeLoadout}
          onBuyUpgrade={buyUpgrade} onOpenPass={() => setIsPassOpen(true)}
          onOpenShop={() => setIsShopOpen(true)} onOpenSection={setOpenSection}
          onPlay={startBattle}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenFriendly={() => setIsFriendlyOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          account={<GameAccount onBeforeSignOut={saveNow} />}
          music={<MusicToggle />} />
      )}
      {isPassOpen && <BattlePassPanel onClose={() => setIsPassOpen(false)} />}
      {isShopOpen && <ShopPanel coins={coins} rubies={rubies} ownedOffers={ownedOffers}
        onBuy={buyOffer} onClose={() => setIsShopOpen(false)} />}
      {isMapOpen && <MapPreview battleMode={battleMode} onClose={() => setIsMapOpen(false)} />}
      {isFriendlyOpen && (
        <FriendlyBattlePanel onClose={() => setIsFriendlyOpen(false)} onStart={startFriendlyBattle} />
      )}
      {isAiOpen && <AiCoachPanel fighterId={loadout.fighterId} onClose={() => setIsAiOpen(false)} />}
      {openSection && (
        <LobbySectionPanel section={openSection} fighterId={loadout.fighterId}
          onSelectFighter={(fighterId) => changeLoadout({ ...loadout, fighterId })}
          onClose={() => setOpenSection(null)} />
      )}
    </main>
  );
}
