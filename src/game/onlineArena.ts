import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { FighterId, WeaponId } from './catalog';

export type OnlinePlayer = {
  id: string;
  name: string;
  fighterId: FighterId;
  weaponId: WeaponId;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  updatedAt: number;
};

type ArenaConnection = {
  id: string;
  sendState: (player: Omit<OnlinePlayer, 'id' | 'updatedAt'>) => void;
  hit: (targetId: string, damage: number) => void;
  disconnect: () => Promise<string>;
};

export function connectArena(
  onPlayers: (players: OnlinePlayer[]) => void,
  onHit: (damage: number) => void,
): ArenaConnection {
  const id = crypto.randomUUID();
  const players = new Map<string, OnlinePlayer>();
  const channel: RealtimeChannel = supabase.channel('public-arena-v1', {
    config: { broadcast: { self: false }, presence: { key: id } },
  });

  const publish = () => {
    const now = Date.now();
    for (const [playerId, player] of players) {
      if (now - player.updatedAt > 4000) players.delete(playerId);
    }
    onPlayers([...players.values()]);
  };

  channel
    .on('broadcast', { event: 'state' }, ({ payload }) => {
      const player = payload as OnlinePlayer;
      if (player.id !== id) {
        players.set(player.id, { ...player, updatedAt: Date.now() });
        publish();
      }
    })
    .on('broadcast', { event: 'hit' }, ({ payload }) => {
      const hit = payload as { targetId: string; damage: number };
      if (hit.targetId === id) onHit(hit.damage);
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      players.delete(key);
      publish();
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ joinedAt: Date.now() });
    });

  return {
    id,
    sendState: (player) => {
      void channel.send({
        type: 'broadcast',
        event: 'state',
        payload: { ...player, id, updatedAt: Date.now() },
      });
    },
    hit: (targetId, damage) => {
      void channel.send({ type: 'broadcast', event: 'hit', payload: { targetId, damage } });
    },
    disconnect: () => supabase.removeChannel(channel),
  };
}
