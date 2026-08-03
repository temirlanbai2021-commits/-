import { useState } from 'react';

type Props = {
  onClose: () => void;
  onStart: (roomCode: string, side: 'host' | 'guest') => void;
};

const makeRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export function FriendlyBattlePanel({ onClose, onStart }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const joinRoom = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length >= 4) onStart(code, 'guest');
  };

  return (
    <div className="friendly-overlay" role="dialog" aria-modal="true">
      <section className="friendly-panel">
        <header><div><small>ОНЛАЙН 1 НА 1</small><h2>ДРУЖЕСКИЙ БОЙ</h2></div>
          <button type="button" onClick={onClose}>×</button></header>
        <p>Создай комнату и отправь код другу или введи его код.</p>
        {createdCode ? (
          <div className="friendly-code">
            <span>КОД КОМНАТЫ</span><strong>{createdCode}</strong>
            <button type="button" onClick={() => onStart(createdCode, 'host')}>ВОЙТИ И ЖДАТЬ ДРУГА</button>
          </div>
        ) : (
          <button type="button" className="friendly-create"
            onClick={() => setCreatedCode(makeRoomCode())}>СОЗДАТЬ КОМНАТУ</button>
        )}
        <div className="friendly-divider">ИЛИ</div>
        <div className="friendly-join">
          <input value={roomCode} maxLength={6} placeholder="КОД ДРУГА"
            onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, ''))} />
          <button type="button" onClick={joinRoom}>ВОЙТИ</button>
        </div>
      </section>
    </div>
  );
}
