/**
 * Draws the shareable "current gold price" card with the Canvas 2D API (no extra dependencies).
 * The layout follows the Gold Trading screen: blue/violet gradient, gold coin tile, big price, trend chip,
 * recent price line, plus the Helper logo and name.
 */

export interface GoldShareCardData {
  brand: string;
  subtitle: string;
  label: string;
  amount: string;
  unit: string;
  updated: string;
  footer: string;
  history: number[];
  yesterday: {
    label: string;
    value: string;
    change: string;
    percent: string;
    trend: "up" | "down" | "flat";
  } | null;
}

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

function drawBackground(ctx: Ctx) {
  const w = SHARE_CARD_WIDTH;
  const h = SHARE_CARD_HEIGHT;

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, "#087ff5");
  base.addColorStop(0.5, "#2854f3");
  base.addColorStop(1, "#7426ed");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const glowWarm = ctx.createRadialGradient(40, h + 80, 0, 40, h + 80, 760);
  glowWarm.addColorStop(0, "rgba(255, 196, 70, 0.42)");
  glowWarm.addColorStop(1, "rgba(255, 196, 70, 0)");
  ctx.fillStyle = glowWarm;
  ctx.fillRect(0, 0, w, h);

  const glowLight = ctx.createRadialGradient(w - 60, 60, 0, w - 60, 60, 640);
  glowLight.addColorStop(0, "rgba(255, 255, 255, 0.30)");
  glowLight.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glowLight;
  ctx.fillRect(0, 0, w, h);

  // Soft decorative rings.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 3;
  [260, 360, 460].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(w - 40, h - 120, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
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

function drawSparkline(ctx: Ctx, values: number[], x: number, y: number, w: number, h: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const points = values.map((value, index) => ({
    x: x + (values.length === 1 ? 0 : (index / (values.length - 1)) * w),
    y: range === 0 ? y + h / 2 : y + h - ((value - min) / range) * (h - 16) - 8,
  }));

  const area = ctx.createLinearGradient(0, y, 0, y + h);
  area.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  area.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.beginPath();
  ctx.moveTo(points[0].x, y + h);
  points.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, y + h);
  ctx.closePath();
  ctx.fillStyle = area;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd45b";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

/** Pure drawing routine: everything it needs is passed in, so it also runs outside a browser page. */
export function drawGoldShareCard(ctx: Ctx, data: GoldShareCardData, logo: CanvasImageSource | null, family: string) {
  const w = SHARE_CARD_WIDTH;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawBackground(ctx);

  // Header: logo + brand.
  drawLogo(ctx, logo, 80, 80, 108);
  ctx.fillStyle = "#fff";
  fitFont(ctx, data.brand, 800, 56, 36, 560, family);
  ctx.fillText(data.brand, 216, 138);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  fitFont(ctx, data.subtitle, 500, 32, 22, 640, family);
  ctx.fillText(data.subtitle, 216, 184);

  // Panel sizing from its content.
  const hasChange = data.yesterday !== null;
  const hasLine = data.history.length >= 2;
  const pad = 48;
  const panelH = pad + 128 + 240 + (hasChange ? 170 : 0) + (hasLine ? 170 : 0) + 56 + pad;
  const areaTop = 250;
  const areaH = 860;
  const panelY = areaTop + Math.max(0, (areaH - panelH) / 2);
  const panelX = 60;
  const panelW = w - 120;

  roundRectPath(ctx, panelX, panelY, panelW, panelH, 56);
  ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
  ctx.stroke();

  const innerX = panelX + pad;
  const innerW = panelW - pad * 2;
  let y = panelY + pad;

  // Coin tile + label.
  drawCoinTile(ctx, innerX, y, 128);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  fitFont(ctx, data.label, 600, 38, 24, innerW - 160, family);
  ctx.fillText(data.label, innerX + 160, y + 80);
  y += 128;

  // Price.
  ctx.fillStyle = "#fff";
  fitFont(ctx, data.amount, 800, 132, 60, innerW, family);
  ctx.fillText(data.amount, innerX, y + 150);
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  fitFont(ctx, data.unit, 600, 44, 26, innerW, family);
  ctx.fillText(data.unit, innerX, y + 218);
  y += 240;

  // Change versus yesterday.
  if (data.yesterday) {
    const { trend, change, percent, label, value } = data.yesterday;
    const arrow = trend === "up" ? "\u25B2 " : trend === "down" ? "\u25BC " : "";
    const text = trend === "flat" ? percent : `${arrow}${change} (${percent})`;
    const fill = trend === "up" ? "rgba(34, 197, 94, 0.30)" : trend === "down" ? "rgba(244, 63, 94, 0.32)" : "rgba(255, 255, 255, 0.18)";
    const color = trend === "up" ? "#bbf7d0" : trend === "down" ? "#fecdd3" : "#fff";

    fitFont(ctx, text, 800, 44, 26, innerW - 64, family);
    const pillW = Math.min(innerW, ctx.measureText(text).width + 64);
    roundRectPath(ctx, innerX, y + 6, pillW, 84, 42);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, innerX + 32, y + 6 + 56);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    const line = `${label} ${value}`;
    fitFont(ctx, line, 500, 34, 22, innerW, family);
    ctx.fillText(line, innerX, y + 146);
    y += 170;
  }

  // Recent price line.
  if (hasLine) {
    drawSparkline(ctx, data.history, innerX, y + 6, innerW, 140);
    y += 170;
  }

  // Updated time.
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  fitFont(ctx, data.updated, 500, 30, 20, innerW, family);
  ctx.fillText(data.updated, innerX, y + 36);

  // Footer: logo + brand + site.
  const footerY = 1180;
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(80, footerY, w - 160, 2);
  drawLogo(ctx, logo, 80, footerY + 40, 84);
  ctx.fillStyle = "#fff";
  fitFont(ctx, data.brand, 800, 44, 28, 360, family);
  ctx.fillText(data.brand, 188, footerY + 98);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  fitFont(ctx, data.footer, 500, 30, 20, 420, family);
  ctx.textAlign = "right";
  ctx.fillText(data.footer, w - 80, footerY + 94);
  ctx.textAlign = "left";
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

/** Renders the price card to a PNG blob in the browser. */
export function renderGoldShareCard(data: GoldShareCardData): Promise<Blob> {
  return renderCardBlob((ctx, logo, family) => drawGoldShareCard(ctx, data, logo, family));
}
