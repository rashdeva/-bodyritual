export const XP_START_BONUS = 10;
export const XP_PER_SECOND = 1;
export const SESSION_DURATION_GRACE_SECONDS = 30;
export const DEFAULT_RITUAL_DURATION_SECONDS = 7 * 60;

export function calculateLevel(xpTotal: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xpTotal) / 25)) + 1);
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}
