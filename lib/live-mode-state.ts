/**
 * Tiny shared flag: true while the full-screen Live mode needs the page to poll the server faster,
 * that is, when Live mode is open but the direct market feed is not connected.
 */
let active = false;
const listeners = new Set<() => void>();

export function setLiveModeActive(next: boolean) {
  if (active === next) return;
  active = next;
  listeners.forEach((listener) => listener());
}

export function getLiveModeActive() {
  return active;
}

export function subscribeLiveMode(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** How often the price is refreshed while Live mode is open, in milliseconds. */
export const LIVE_MODE_REFRESH_MS = 5_000;
