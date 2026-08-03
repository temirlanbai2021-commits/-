import { supabase } from './supabase';

export type FriendStatus = 'sent' | 'pending' | 'accepted';
export type FriendRow = { user_id: string; display_name: string; status: FriendStatus };
export type PlayerRow = { user_id: string; display_name: string };

export async function preparePlayerProfile() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const metadata = data.user.user_metadata;
  const name = String(metadata.full_name ?? metadata.name ?? data.user.email?.split('@')[0] ?? 'Игрок');
  const { error } = await supabase.rpc('sync_player_profile', { player_name: name });
  if (error) throw error;
  return true;
}

export async function loadFriends() {
  const { data, error } = await supabase.rpc('list_friends');
  if (error) throw error;
  return (data ?? []) as FriendRow[];
}

export async function searchPlayers(query: string) {
  const { data, error } = await supabase.rpc('search_players', { query });
  if (error) throw error;
  return (data ?? []) as PlayerRow[];
}

export async function sendFriendRequest(userId: string) {
  const { error } = await supabase.rpc('send_friend_request', { target_id: userId });
  if (error) throw error;
}

export async function acceptFriendRequest(userId: string) {
  const { error } = await supabase.rpc('accept_friend_request', { target_id: userId });
  if (error) throw error;
}

export async function removeFriend(userId: string) {
  const { error } = await supabase.rpc('remove_friend', { target_id: userId });
  if (error) throw error;
}
