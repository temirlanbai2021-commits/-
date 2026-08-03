type TrackedPosition = {
  x: number;
  y: number;
  movingUntil: number;
  phase: number;
  intensity: number;
};

export type WalkPose = {
  bob: number;
  sway: number;
  lean: number;
};

const positions = new Map<string, TrackedPosition>();

export function getWalkPose(id: string, x: number, y: number, now: number): WalkPose {
  const previous = positions.get(id);
  const distance = previous ? Math.hypot(x - previous.x, y - previous.y) : 0;
  const moved = distance > 0.08;
  const movingUntil = moved ? now + 110 : previous?.movingUntil ?? 0;
  const targetIntensity = now < movingUntil ? 1 : 0;
  const intensity = previous
    ? previous.intensity + (targetIntensity - previous.intensity) * 0.22
    : 0;
  const phase = (previous?.phase ?? 0) + Math.min(distance, 8) * 0.17;

  positions.set(id, { x, y, movingUntil, phase, intensity });
  if (intensity < 0.01) return { bob: 0, sway: 0, lean: 0 };

  return {
    bob: -Math.abs(Math.sin(phase)) * 2.6 * intensity,
    sway: Math.sin(phase) * 1.7 * intensity,
    lean: Math.sin(phase) * 0.026 * intensity,
  };
}
