type Props = {
  onClose: () => void;
};

const levels = [
  { level: 1, free: '25 рубинов', vip: 'Скин «Неон»' },
  { level: 2, free: '100 монет', vip: 'Оружейный кейс' },
  { level: 3, free: 'Спрей', vip: '75 рубинов' },
  { level: 4, free: '150 монет', vip: 'Скин «Командир»' },
];

export function BattlePassPanel({ onClose }: Props) {
  const [message, setMessage] = useState('');
  return (
    <div className="pass-overlay" role="dialog" aria-modal="true">
      <section className="pass-panel">
        <header>
          <div><small>СЕЗОН 1</small><h2>БОЕВОЙ ПРОПУСК</h2></div>
          <button onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="pass-progress"><i style={{ width: '18%' }} /><span>180 / 1000 XP</span></div>
        <div className="pass-labels"><b>БЕСПЛАТНО</b><b>VIP PASS</b></div>
        <div className="pass-track">
          {levels.map((item) => (
            <div className="pass-level" key={item.level}>
              <strong>{item.level}</strong><span>{item.free}</span><span className="vip-reward">{item.vip}</span>
            </div>
          ))}
        </div>
        <div className="pass-buy">
          <span><b>VIP PASS</b><small>Дополнительные награды сезона</small></span>
          <button onClick={() => setMessage('VIP-награды появятся в следующем обновлении.')}>ПОДРОБНЕЕ</button>
        </div>
        {message && <p className="section-message">{message}</p>}
        <p>Оплата пока отключена: кнопка не списывает реальные деньги.</p>
      </section>
    </div>
  );
}
import { useState } from 'react';
