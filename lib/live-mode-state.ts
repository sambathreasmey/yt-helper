/** Tiny shared flag: true while the full-screen Live mode is open (the price is then polled faster). */
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
