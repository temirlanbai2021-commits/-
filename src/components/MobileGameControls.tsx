import { useRef, useState, type PointerEvent } from 'react';

type Props = {
  superReady: boolean;
  hyperReady: boolean;
  isFootball: boolean;
  onMove: (keys: Set<string>) => void;
  onFireStart: () => void;
  onFireStop: () => void;
  onSuper: () => void;
  onHyper: () => void;
  onCamera: () => void;
};

const JOYSTICK_LIMIT = 34;
const DEAD_ZONE = 10;

export function MobileGameControls({
  superReady, hyperReady, isFootball, onMove, onFireStart, onFireStop,
  onSuper, onHyper, onCamera,
}: Props) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const moveJoystick = (event: PointerEvent<HTMLDivElement>) => {
    const box = joystickRef.current?.getBoundingClientRect();
    if (!box) return;
    const rawX = event.clientX - (box.left + box.width / 2);
    const rawY = event.clientY - (box.top + box.height / 2);
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > JOYSTICK_LIMIT ? JOYSTICK_LIMIT / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    setStick({ x, y });

    const keys = new Set<string>();
    if (x < -DEAD_ZONE) keys.add('a');
    if (x > DEAD_ZONE) keys.add('d');
    if (y < -DEAD_ZONE) keys.add('w');
    if (y > DEAD_ZONE) keys.add('s');
    onMove(keys);
  };

  const startJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    moveJoystick(event);
  };

  const stopJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setStick({ x: 0, y: 0 });
    onMove(new Set());
  };

  return (
    <div className="mobile-controls">
      <div ref={joystickRef} className="move-joystick" aria-label="Джойстик движения"
        onPointerDown={startJoystick} onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) moveJoystick(event);
        }} onPointerUp={stopJoystick} onPointerCancel={stopJoystick}>
        <span style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
      </div>
      <div className="action-pad">
        <button type="button" className="camera-button" onClick={onCamera}>V</button>
        <button type="button" disabled={!superReady}
          className={`super-button ${superReady ? 'ready' : ''}`} onClick={onSuper}>★</button>
        <button type="button" disabled={!hyperReady}
          className={`hyper-button ${hyperReady ? 'ready' : ''}`} onClick={onHyper}>ГИПЕР</button>
        <button type="button" className="fire-button" onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          onFireStart();
        }} onPointerUp={onFireStop} onPointerCancel={onFireStop}>
          {isFootball ? 'УДАР' : 'ОГОНЬ'}
        </button>
      </div>
    </div>
  );
}
