import type { FighterId } from './catalog';
import spark from '../assets/fighters/spark.png';
import tank from '../assets/fighters/tank.png';
import ghost from '../assets/fighters/ghost.png';
import riot from '../assets/fighters/riot.png';

export const fighterSources: Record<FighterId, string> = { spark, tank, ghost, riot };

const sprites = new Map<FighterId, HTMLImageElement>();

export function getFighterSprite(id: FighterId) {
  if (typeof Image === 'undefined') return undefined;
  let sprite = sprites.get(id);
  if (!sprite) {
    sprite = new Image();
    sprite.src = fighterSources[id];
    sprites.set(id, sprite);
  }
  return sprite.complete ? sprite : undefined;
}
