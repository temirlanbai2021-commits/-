import groundSource from '../assets/arena/sunny-ground.png';

let groundImage: HTMLImageElement | undefined;

export function getGroundTexture() {
  if (typeof Image === 'undefined') return undefined;
  if (!groundImage) {
    groundImage = new Image();
    groundImage.src = groundSource;
  }
  return groundImage.complete ? groundImage : undefined;
}
