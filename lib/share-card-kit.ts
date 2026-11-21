/**
 * Shared building blocks for the shareable cards (Canvas 2D, no dependencies):
 * sizes, text fitting, the Helper logo, the gold tile, the dark glass background and glass tiles.
 */

export type Trend = "up" | "down" | "flat";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

export type Ctx = CanvasRenderingContext2D;

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Picks the largest font size (down to `min`) at which `text` fits in `maxWidth`, and applies it. */
export function fitFont(ctx: Ctx, text: string, weight: number, max: number, min: number, maxWidth: number, family: string) {
  let size = max;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function drawLogo(ctx: Ctx, logo: CanvasImageSource | null, x: number, y: number, size: number) {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, size * 0.27);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fill();
  ctx.clip();
  if (logo) {
    ctx.drawImage(logo, x, y, size, size);
  } else {
    ctx.fillStyle = "#2854f3";
    ctx.font = `800 ${size * 0.6}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("H", x + size / 2, y + size / 2 + 2);
  }
  ctx.restore();
}

/** The Helper gold-bars symbol (same shapes as components/icons/gold-icon.tsx) stroked on a canvas. */
export function drawGoldBars(ctx: Ctx, x: number, y: number, size: number, color: string, lineWidth = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const bar = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([px, py], index) => (index === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.stroke();
  };
  bar([[7.5, 9.5], [9.2, 3], [14.8, 3], [16.5, 9.5]]);
  bar([[1.5, 21], [3.2, 12.5], [8.8, 12.5], [10.5, 21]]);
  bar([[13.5, 21], [15.2, 12.5], [20.8, 12.5], [22.5, 21]]);
  ctx.restore();
}

export function drawCoinTile(ctx: Ctx, x: number, y: number, size: number) {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, size * 0.33);
  const tile = ctx.createLinearGradient(x, y, x + size, y + size);
  tile.addColorStop(0, "#ffd45b");
  tile.addColorStop(1, "#f39817");
  ctx.shadowColor = "rgba(170, 93, 4, 0.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = tile;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.stroke();

  drawGoldBars(ctx, x + size * 0.19, y + size * 0.19, size * 0.62, "#ffffff", 2.2);
  ctx.restore();
}


export const TREND = {
  up: { text: "#6ee7a8", glow: "16, 185, 129", chip: "rgba(52, 211, 153, 0.20)" },
  down: { text: "#fb7185", glow: "244, 63, 94", chip: "rgba(251, 113, 133, 0.20)" },
  flat: { text: "#e2e8f0", glow: "148, 163, 184", chip: "rgba(255, 255, 255, 0.14)" },
} as const;

export function drawDarkBackground(ctx: Ctx, trend: Trend) {
  const w = SHARE_CARD_WIDTH;
  const h = SHARE_CARD_HEIGHT;
  const glow = TREND[trend].glow;

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, "#0a1128");
  base.addColorStop(0.55, "#0f1b3d");
  base.addColorStop(1, "#0b1430");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const glows: [number, number, number, string][] = [
    [w - 60, 140, 760, `rgba(${glow}, 0.40)`],
    [0, 0, 700, "rgba(40, 84, 243, 0.30)"],
    [60, h + 60, 800, "rgba(255, 196, 70, 0.26)"],
  ];
  glows.forEach(([cx, cy, radius, color]) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  // Fine dot grid for texture.
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let gx = 27; gx < w; gx += 54) {
    for (let gy = 27; gy < h; gy += 54) ctx.fillRect(gx, gy, 3, 3);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 3;
  [260, 360, 460].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(w - 40, h - 120, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

export function glassTile(ctx: Ctx, x: number, y: number, w: number, h: number, radius: number) {
  roundRectPath(ctx, x, y, w, h, radius);
  const fill = ctx.createLinearGradient(x, y, x, y + h);
  fill.addColorStop(0, "rgba(255, 255, 255, 0.10)");
  fill.addColorStop(1, "rgba(255, 255, 255, 0.05)");
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.stroke();
}


export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Runs a draw function on a fresh 1080x1350 canvas and returns it as a PNG blob. */
export async function renderCardBlob(
  draw: (ctx: Ctx, logo: CanvasImageSource | null, family: string) => void,
): Promise<Blob> {
  const [logo] = await Promise.all([loadImage("/logo.png"), document.fonts?.ready ?? Promise.resolve()]);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  draw(ctx, logo, family);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))), "image/png");
  });
}

