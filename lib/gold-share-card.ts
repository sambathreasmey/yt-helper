/**
 * Draws the shareable "current gold price" card (Canvas 2D, no dependencies).
 * Same dark glass look as the portfolio card: a glow that follows the day's move, a hero panel with the
 * big gold-coloured price and a change chip, tiles for the other units, a recent-price line,
 * and the Helper logo and name.
 */
import {
  SHARE_CARD_WIDTH,
  TREND,
  drawCoinTile,
  drawDarkBackground,
  drawLogo,
  fitFont,
  glassTile,
  renderCardBlob,
  roundRectPath,
  type Ctx,
  type Trend,
} from "@/lib/share-card-kit";

export interface GoldShareCardData {
  brand: string;
  subtitle: string;
  /** Short date for the pill in the header. */
  date: string;
  label: string;
  amount: string;
  /** For example "/ damlung". Drawn beside the price when it fits, otherwise the price shrinks. */
  unit: string;
  /** Change against yesterday. Null hides the chip and keeps the glow neutral. */
  change: { trend: Trend; amount: string; percent: string; caption: string } | null;
  /** Up to three small tiles, for example the price of 1 chi, 1 hun and yesterday's price. */
  units: { label: string; value: string }[];
  chartLabel: string;
  history: number[];
  updated: string;
  footer: string;
}

function drawLine(ctx: Ctx, values: number[], x: number, y: number, w: number, h: number, accent: string) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const points = values.map((value, index) => ({
    x: x + (index / (values.length - 1)) * w,
    y: y + h - 8 - ((value - min) / range) * (h - 16),
  }));

  const area = ctx.createLinearGradient(0, y, 0, y + h);
  area.addColorStop(0, "rgba(255, 255, 255, 0.24)");
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
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = accent;
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd45b";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

/** Pure drawing routine: everything it needs is passed in, so it also runs outside a browser page. */
export function drawGoldShareCard(ctx: Ctx, data: GoldShareCardData, logo: CanvasImageSource | null, family: string) {
  const w = SHARE_CARD_WIDTH;
  const trend: Trend = data.change?.trend ?? "flat";
  const tone = TREND[trend];
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawDarkBackground(ctx, trend);

  // Header: logo, brand, subtitle and date pill.
  drawLogo(ctx, logo, 80, 80, 108);
  ctx.fillStyle = "#fff";
  fitFont(ctx, data.brand, 800, 56, 36, 420, family);
  ctx.fillText(data.brand, 216, 138);
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  fitFont(ctx, data.subtitle, 500, 32, 22, 420, family);
  ctx.fillText(data.subtitle, 216, 184);

  fitFont(ctx, data.date, 600, 28, 20, 300, family);
  const dateW = ctx.measureText(data.date).width + 56;
  roundRectPath(ctx, w - 80 - dateW, 112, dateW, 62, 31);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText(data.date, w - 80 - dateW + 28, 152);

  // Vertical layout: hero panel, unit tiles, price line. Centered in the free area.
  const hasChip = data.change !== null;
  const tiles = data.units.slice(0, 3);
  const hasLine = data.history.length >= 3 && Math.max(...data.history) > Math.min(...data.history);
  const pad = 50;
  const heroH = pad + 138 + 130 + (hasChip ? 86 : 0) + pad;
  const tilesH = 140;
  const lineH = 180;
  const gap = 20;
  const totalH = heroH + (tiles.length ? 36 + tilesH : 0) + (hasLine ? (tiles.length ? gap : 36) + lineH : 0);
  const areaTop = 240;
  const areaH = 840;
  let y = areaTop + Math.max(0, (areaH - totalH) / 2);

  // Hero panel.
  const heroX = 60;
  const heroW = w - 120;
  roundRectPath(ctx, heroX, y, heroW, heroH, 56);
  const heroFill = ctx.createLinearGradient(heroX, y, heroX, y + heroH);
  heroFill.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  heroFill.addColorStop(1, "rgba(255, 255, 255, 0.06)");
  ctx.fillStyle = heroFill;
  ctx.fill();
  const heroStroke = ctx.createLinearGradient(heroX, y, heroX + heroW, y + heroH);
  heroStroke.addColorStop(0, `rgba(${tone.glow}, 0.85)`);
  heroStroke.addColorStop(0.5, "rgba(255, 255, 255, 0.20)");
  heroStroke.addColorStop(1, `rgba(${tone.glow}, 0.35)`);
  ctx.lineWidth = 3;
  ctx.strokeStyle = heroStroke;
  ctx.stroke();

  const innerX = heroX + pad;
  const innerW = heroW - pad * 2;
  const top = y + pad;
  drawCoinTile(ctx, innerX, top, 112);
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  fitFont(ctx, data.label, 600, 34, 20, innerW - 140, family);
  ctx.fillText(data.label, innerX + 140, top + 68);

  // Price in gold, with the unit beside it.
  ctx.font = `700 42px ${family}`;
  fitFont(ctx, data.unit, 700, 42, 22, innerW * 0.4, family);
  const unitW = ctx.measureText(data.unit).width;
  fitFont(ctx, data.amount, 800, 128, 56, innerW - unitW - 20, family);
  const priceW = ctx.measureText(data.amount).width;
  const baseline = top + 138 + 104;
  const gold = ctx.createLinearGradient(innerX, baseline - 100, innerX + priceW, baseline);
  gold.addColorStop(0, "#fff4cf");
  gold.addColorStop(0.5, "#ffd45b");
  gold.addColorStop(1, "#f5a623");
  ctx.save();
  ctx.fillStyle = gold;
  ctx.shadowColor = "rgba(255, 196, 70, 0.45)";
  ctx.shadowBlur = 36;
  ctx.fillText(data.amount, innerX, baseline);
  ctx.restore();
  ctx.fillStyle = "rgba(255, 255, 255, 0.80)";
  fitFont(ctx, data.unit, 700, 42, 22, innerW * 0.4, family);
  ctx.fillText(data.unit, innerX + priceW + 20, baseline);

  // Change chip.
  if (data.change) {
    const { trend: t, amount, percent, caption } = data.change;
    const arrow = t === "up" ? "\u25B2 " : t === "down" ? "\u25BC " : "";
    const text = t === "flat" ? percent : `${arrow}${amount} (${percent})`;
    fitFont(ctx, text, 800, 40, 24, innerW - 64, family);
    const chipW = ctx.measureText(text).width + 64;
    const chipY = top + 138 + 130 + 10;
    roundRectPath(ctx, innerX, chipY, chipW, 76, 38);
    ctx.fillStyle = tone.chip;
    ctx.fill();
    ctx.fillStyle = tone.text;
    ctx.fillText(text, innerX + 32, chipY + 52);
    const room = innerW - chipW - 24;
    if (caption && room > 120) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      fitFont(ctx, caption, 500, 30, 18, room, family);
      ctx.fillText(caption, innerX + chipW + 24, chipY + 50);
    }
  }
  y += heroH;

  // Unit tiles (price of 1 chi, 1 hun, yesterday...).
  if (tiles.length) {
    y += 36;
    const tileW = (heroW - gap * (tiles.length - 1)) / tiles.length;
    tiles.forEach((tile, index) => {
      const tx = heroX + index * (tileW + gap);
      glassTile(ctx, tx, y, tileW, tilesH, 36);
      ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
      fitFont(ctx, tile.label, 500, 26, 16, tileW - 48, family);
      ctx.fillText(tile.label, tx + 24, y + 52);
      ctx.fillStyle = "#fff";
      fitFont(ctx, tile.value, 800, 46, 20, tileW - 48, family);
      ctx.fillText(tile.value, tx + 24, y + 108);
    });
    y += tilesH;
  }

  // Recent price line (only when there is something to show).
  if (hasLine) {
    y += tiles.length ? gap : 36;
    glassTile(ctx, heroX, y, heroW, lineH, 40);
    ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
    fitFont(ctx, data.chartLabel, 500, 26, 16, heroW - 64, family);
    ctx.fillText(data.chartLabel, heroX + 32, y + 50);
    drawLine(ctx, data.history, heroX + 32, y + 72, heroW - 64, lineH - 72 - 28, "rgba(255, 255, 255, 0.95)");
  }

  // Updated time, then footer.
  if (data.updated) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
    fitFont(ctx, data.updated, 500, 26, 16, w - 160, family);
    ctx.fillText(data.updated, 80, 1140);
  }
  const footerY = 1180;
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fillRect(80, footerY, w - 160, 2);
  drawLogo(ctx, logo, 80, footerY + 40, 84);
  ctx.fillStyle = "#fff";
  fitFont(ctx, data.brand, 800, 44, 28, 360, family);
  ctx.fillText(data.brand, 188, footerY + 98);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  fitFont(ctx, data.footer, 500, 30, 20, 420, family);
  ctx.textAlign = "right";
  ctx.fillText(data.footer, w - 80, footerY + 94);
  ctx.textAlign = "left";
}

/** Renders the price card to a PNG blob in the browser. */
export function renderGoldShareCard(data: GoldShareCardData): Promise<Blob> {
  return renderCardBlob((ctx, logo, family) => drawGoldShareCard(ctx, data, logo, family));
}
