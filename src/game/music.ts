const melody = [220, 277, 330, 440, 330, 277, 247, 330];
let context: AudioContext | undefined;
let timer: number | undefined;
let step = 0;

function playNote(frequency: number, start: number, duration: number, volume: number) {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function tick() {
  if (!context) return;
  const now = context.currentTime;
  playNote(melody[step % melody.length], now, 0.16, 0.025);
  if (step % 2 === 0) playNote(110, now, 0.1, 0.035);
  if (step % 4 === 0) playNote(55, now, 0.08, 0.045);
  step += 1;
}

export async function startMusic() {
  context ??= new AudioContext();
  await context.resume();
  if (timer !== undefined) return;
  tick();
  timer = window.setInterval(tick, 210);
}

export async function stopMusic() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  await context?.suspend();
}
