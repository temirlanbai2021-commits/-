import type { FighterId } from './catalog';
import spark from '../assets/fighters/spark-v2.png';
import tank from '../assets/fighters/tank-v2.png';
import ghost from '../assets/fighters/ghost-v2.png';
import riot from '../assets/fighters/riot-v2.png';
import blaze from '../assets/fighters/blaze-v2.png';
import volta from '../assets/fighters/volta-v2.png';
import frost from '../assets/fighters/frost-v2.png';
import spirit from '../assets/fighters/spirit.png';
import nova from '../assets/fighters/nova.png';
import rift from '../assets/fighters/rift.png';

export const fighterSources: Record<FighterId, string> = {
  spark, tank, ghost, riot, blaze, volta, frost, spirit, nova, rift,
};

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
