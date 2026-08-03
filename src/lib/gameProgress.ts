import type { FighterId, Loadout } from '../game/catalog';
import { defaultLoadout, fighters } from '../game/catalog';
import { supabase } from './supabase';

export type FighterProgressItem = {
  level: number;
  xp: number;
  healthLevel: number;
  speedLevel: number;
  damageLevel: number;
  fireRateLevel: number;
};
export type FighterProgress = Record<FighterId, FighterProgressItem>;
export type FighterTrophies = Record<FighterId, number>;

export type GameProgress = {
  loadout: Loadout;
  rubies: number;
  coins: number;
  trophies: number;
  fighterTrophies: FighterTrophies;
  fighters: FighterProgress;
  ownedOffers: string[];
};

const fighterValues = <T>(create: () => T) => Object.fromEntries(
  fighters.map(({ id }) => [id, create()]),
) as Record<FighterId, T>;

export const createInitialProgress = (): GameProgress => ({
  loadout: { ...defaultLoadout },
  rubies: 100,
  coins: 250,
  trophies: 0,
  fighterTrophies: fighterValues(() => 0),
  fighters: fighterValues(() => ({
    level: 1,
    xp: 0,
    healthLevel: 0,
    speedLevel: 0,
    damageLevel: 0,
    fireRateLevel: 0,
  })),
  ownedOffers: [],
});

export function normalizeGameProgress(saved: Partial<GameProgress>): GameProgress {
  const initial = createInitialProgress();
  const savedFighters: Partial<FighterProgress> = saved.fighters ?? {};
  const normalizedFighters = fighterValues(() => initial.fighters.spark);
  for (const fighter of fighters) {
    normalizedFighters[fighter.id] = {
      ...initial.fighters[fighter.id],
      ...savedFighters[fighter.id],
    };
  }
  return {
    ...initial,
    ...saved,
    loadout: { ...initial.loadout, ...saved.loadout },
    fighterTrophies: { ...initial.fighterTrophies, ...saved.fighterTrophies },
    fighters: normalizedFighters,
  };
}

export async function loadGameProgress(userId: string): Promise<GameProgress | null> {
  const { data, error } = await supabase
    .from('game_progress')
    .select('progress')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeGameProgress(data.progress as Partial<GameProgress>) : null;
}

export async function saveGameProgress(userId: string, progress: GameProgress) {
  const { error } = await supabase.from('game_progress').upsert({
    user_id: userId,
    progress,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
