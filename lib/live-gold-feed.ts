/**
 * Direct live gold price feed from the livepriceofgold.com Socket.IO WebSocket.
 * It speaks the same minimal Engine.IO v4 / Socket.IO protocol as the GitHub Action script:
 *   server "0{...}" (open)  ->  client "40" (join)  ->  server "2" (ping)  ->  client "3" (pong)
 *   server '42["update",{"XAUUSD": ...}]' = a price tick (USD per troy ounce)
 * and converts each tick to USD per damlung (ounce price x 1.2, like the backend does).
 */

export const LIVE_FEED_URL = "wss://www.livepriceofgold.com/sio/p7012/socket.io/?EIO=4&transport=websocket";
export const TROY_OUNCE_TO_DAMLUNG = 1.2;

export type FeedStatus = "connecting" | "live" | "failed";

export interface FeedState {
  status: FeedStatus;
  /** USD per damlung from the latest tick, or null before the first tick. */
  price: number | null;
  /** Time (ms since epoch) of the latest tick. */
  updatedAt: number | null;
}

export type FeedPacket = { kind: "open" } | { kind: "ping" } | { kind: "price"; damlung: number } | { kind: "other" };

export function ouncePriceToDamlung(ounce: unknown): number | null {
  const value = typeof ounce === "number" ? ounce : typeof ounce === "string" ? Number(ounce) : Number.NaN;
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * TROY_OUNCE_TO_DAMLUNG * 1e6) / 1e6;
}

/** Reads one text frame from the socket. Anything that is not a usable price update is "other". */
export function parseFeedPacket(raw: string): FeedPacket {
  if (raw === "2") return { kind: "ping" };
  if (raw.startsWith("0")) return { kind: "open" };
  if (!raw.startsWith("42")) return { kind: "other" };

  let packet: unknown;
  try {
    packet = JSON.parse(raw.slice(2));
  } catch {
    return { kind: "other" };
  }
  if (!Array.isArray(packet) || packet.length < 2 || packet[0] !== "update") return { kind: "other" };

  let payload: unknown = packet[1];
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return { kind: "other" };
    }
  }
  if (!payload || typeof payload !== "object") return { kind: "other" };

  const damlung = ouncePriceToDamlung((payload as Record<string, unknown>).XAUUSD);
  return damlung === null ? { kind: "other" } : { kind: "price", damlung };
}

export interface LiveGoldFeedOptions {
  url?: string;
  /** Most often the state is reported to the UI while ticks arrive quickly. */
  throttleMs?: number;
  /** First reconnect delay; it doubles after each failure up to `maxBackoffMs`. */
  backoffBaseMs?: number;
  maxBackoffMs?: number;
  /** Give up on a connection that has not produced a price within this time. */
  connectTimeoutMs?: number;
  /** Reconnect if nothing at all (not even a ping) arrives for this long. */
  staleMs?: number;
  createSocket?: (url: string) => WebSocket;
}

export class LiveGoldFeed {
  private state: FeedState = { status: "connecting", price: null, updatedAt: null };
  private socket: WebSocket | null = null;
  private running = false;
  private attempt = 0;
  private lastPacketAt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private connectTimer: ReturnType<typeof setTimeout> | undefined;
  private emitTimer: ReturnType<typeof setTimeout> | undefined;
  private watchdog: ReturnType<typeof setInterval> | undefined;

  private readonly url: string;
  private readonly throttleMs: number;
  private readonly backoffBaseMs: number;
  private readonly maxBackoffMs: number;
  private readonly connectTimeoutMs: number;
  private readonly staleMs: number;
  private readonly createSocket: (url: string) => WebSocket;

  constructor(
    private readonly onChange: (state: FeedState) => void,
    options: LiveGoldFeedOptions = {},
  ) {
    this.url = options.url ?? LIVE_FEED_URL;
    this.throttleMs = options.throttleMs ?? 250;
    this.backoffBaseMs = options.backoffBaseMs ?? 1_000;
    this.maxBackoffMs = options.maxBackoffMs ?? 30_000;
    this.connectTimeoutMs = options.connectTimeoutMs ?? 12_000;
    this.staleMs = options.staleMs ?? 60_000;
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.watchdog = setInterval(() => {
      if (this.socket && Date.now() - this.lastPacketAt > this.staleMs) this.socket.close();
    }, Math.min(10_000, this.staleMs));
    this.connect();
  }

  stop() {
    this.running = false;
    clearTimeout(this.retryTimer);
    clearTimeout(this.connectTimer);
    clearTimeout(this.emitTimer);
    clearInterval(this.watchdog);
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      try {
        socket.close();
      } catch {
        // Already closed.
      }
    }
  }

  private emit(immediate = false) {
    if (immediate) {
      clearTimeout(this.emitTimer);
      this.emitTimer = undefined;
      this.onChange({ ...this.state });
      return;
    }
    if (this.emitTimer) return; // a trailing emit is already scheduled and will carry the newest values
    this.emitTimer = setTimeout(() => {
      this.emitTimer = undefined;
      this.onChange({ ...this.state });
    }, this.throttleMs);
  }

  private connect() {
    if (!this.running) return;
    this.lastPacketAt = Date.now();
    let socket: WebSocket;
    try {
      socket = this.createSocket(this.url);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.socket = socket;

    // A connection that never delivers a price is treated as failed and retried.
    this.connectTimer = setTimeout(() => {
      if (this.state.status !== "live") socket.close();
    }, this.connectTimeoutMs);

    socket.onmessage = (event: MessageEvent) => {
      this.lastPacketAt = Date.now();
      const raw = typeof event.data === "string" ? event.data : event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : "";
      const packet = parseFeedPacket(raw);
      if (packet.kind === "open") {
        socket.send("40");
      } else if (packet.kind === "ping") {
        socket.send("3");
      } else if (packet.kind === "price") {
        clearTimeout(this.connectTimer);
        this.attempt = 0;
        const firstTick = this.state.status !== "live";
        this.state = { status: "live", price: packet.damlung, updatedAt: Date.now() };
        this.emit(firstTick);
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      clearTimeout(this.connectTimer);
      if (this.socket === socket) this.socket = null;
      if (!this.running) return;
      this.state = { ...this.state, status: this.state.status === "live" ? "connecting" : "failed" };
      this.emit(true);
      this.scheduleRetry();
    };
  }

  private scheduleRetry() {
    if (!this.running) return;
    const delay = Math.min(this.backoffBaseMs * 2 ** this.attempt, this.maxBackoffMs);
    this.attempt += 1;
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }
}
