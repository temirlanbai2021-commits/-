import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type GameAccountProps = {
  onBeforeSignOut: () => Promise<void>;
};

export function GameAccount({ onBeforeSignOut }: GameAccountProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/game` },
    });
    if (error) setBusy(false);
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await onBeforeSignOut();
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <button className="account-login" type="button" onClick={signIn} disabled={busy}>
        <b>G</b>{busy ? 'Открываем…' : 'ВОЙТИ'}
      </button>
    );
  }

  const metadata = session.user.user_metadata;
  const name = String(metadata.full_name ?? metadata.name ?? session.user.email ?? 'Игрок');
  const avatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : '';

  return (
    <div className="account-profile">
      {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <b>{name[0]}</b>}
      <span><strong>{name}</strong><small>Google аккаунт</small></span>
      <button type="button" onClick={() => void signOut()} disabled={busy} title="Выйти">↪</button>
    </div>
  );
}
