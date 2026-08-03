import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  createInitialProgress,
  loadGameProgress,
  normalizeGameProgress,
  saveGameProgress,
  type GameProgress,
} from '../lib/gameProgress';
import { supabase } from '../lib/supabase';

const LOCAL_PROGRESS_KEY = 'brastend-game-progress';
const LOCAL_TROPHIES_KEY = 'brastend-trophies';

function loadLocalTrophies() {
  const value = Number(localStorage.getItem(LOCAL_TROPHIES_KEY));
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function loadLocalProgress(): GameProgress {
  const initial = createInitialProgress();
  try {
    const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
    const progress = saved
      ? normalizeGameProgress(JSON.parse(saved) as Partial<GameProgress>)
      : initial;
    return { ...progress, trophies: Math.max(progress.trophies, loadLocalTrophies()) };
  } catch {
    return { ...initial, trophies: loadLocalTrophies() };
  }
}

export function useSavedGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(loadLocalProgress);
  const [user, setUser] = useState<User | null>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoaded(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    if (user === undefined) return () => { active = false; };
    if (!user) {
      setLoadedUserId(null);
      setIsLoaded(true);
      return () => { active = false; };
    }

    void loadGameProgress(user.id)
      .then((saved) => {
        if (active && saved) {
          setProgress((current) => ({
            ...saved,
            trophies: Math.max(saved.trophies, current.trophies, loadLocalTrophies()),
          }));
        }
      })
      .finally(() => {
        if (active) {
          setLoadedUserId(user.id);
          setIsLoaded(true);
        }
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LOCAL_TROPHIES_KEY, String(progress.trophies));
  }, [progress.trophies]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
    if (!user || loadedUserId !== user.id) return;
    void saveGameProgress(user.id, progress);
  }, [isLoaded, loadedUserId, progress, user]);

  const saveNow = useCallback(async () => {
    if (!user || !isLoaded || loadedUserId !== user.id) return;
    await saveGameProgress(user.id, progress);
  }, [isLoaded, loadedUserId, progress, user]);

  return { progress, setProgress, isLoaded, saveNow };
}
