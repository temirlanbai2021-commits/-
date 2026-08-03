import { useEffect, useState } from 'react';
import { startMusic, stopMusic } from '../game/music';

export function MusicToggle() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    void stopMusic();
  }, []);

  const toggle = async () => {
    if (playing) await stopMusic();
    else await startMusic();
    setPlaying(!playing);
  };

  return (
    <button className="music-toggle" type="button" onClick={() => void toggle()}
      aria-label={playing ? 'Выключить музыку' : 'Включить музыку'}>
      {playing ? '🔊 МУЗЫКА' : '🔇 МУЗЫКА'}
    </button>
  );
}
