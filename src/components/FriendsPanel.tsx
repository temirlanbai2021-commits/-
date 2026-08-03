import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  acceptFriendRequest, loadFriends, preparePlayerProfile,
  removeFriend, searchPlayers, sendFriendRequest,
} from '../lib/friends';
import type { FriendRow, PlayerRow } from '../lib/friends';

export function FriendsPanel() {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [results, setResults] = useState<PlayerRow[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Загрузка…');

  const refresh = async () => setFriends(await loadFriends());

  useEffect(() => {
    void preparePlayerProfile().then((signedIn) => {
      if (!signedIn) return setMessage('Войди через Google, чтобы добавлять настоящих друзей.');
      return refresh().then(() => setMessage(''));
    }).catch(() => setMessage('Не удалось загрузить друзей.'));
  }, []);

  const find = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return setMessage('Введи хотя бы 2 буквы имени.');
    try {
      const players = await searchPlayers(query.trim());
      setResults(players);
      setMessage(players.length ? '' : 'Игрок не найден.');
    } catch { setMessage('Поиск пока недоступен.'); }
  };

  const act = async (action: () => Promise<void>, success: string) => {
    try {
      await action(); await refresh(); setResults([]); setMessage(success);
    } catch { setMessage('Не получилось выполнить действие.'); }
  };

  return (
    <div className="real-friends">
      <form onSubmit={find}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя игрока" />
        <button type="submit">НАЙТИ</button>
      </form>
      {results.map((player) => (
        <article key={player.user_id}><span><b>{player.display_name}</b><small>Настоящий игрок</small></span>
          <button onClick={() => void act(() => sendFriendRequest(player.user_id), 'Заявка отправлена!')}>ДОБАВИТЬ</button></article>
      ))}
      <h3>МОИ ДРУЗЬЯ</h3>
      {friends.map((friend) => (
        <article key={friend.user_id}><span><b>{friend.display_name}</b><small>{friend.status === 'accepted' ? 'В друзьях' : friend.status === 'pending' ? 'Хочет дружить' : 'Заявка отправлена'}</small></span>
          {friend.status === 'pending' ?
            <button onClick={() => void act(() => acceptFriendRequest(friend.user_id), 'Теперь вы друзья!')}>ПРИНЯТЬ</button> :
            <button className="remove" onClick={() => void act(() => removeFriend(friend.user_id), 'Игрок удалён.')}>×</button>}
        </article>
      ))}
      {!friends.length && !message && <p>Здесь появятся принятые друзья и заявки.</p>}
      {message && <p>{message}</p>}
    </div>
  );
}
