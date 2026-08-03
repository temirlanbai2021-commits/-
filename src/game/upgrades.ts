export const MAX_UPGRADE_LEVEL = 5;

export function getUpgradeCost(currentLevel: number) {
  return 25 * (currentLevel + 1);
}
