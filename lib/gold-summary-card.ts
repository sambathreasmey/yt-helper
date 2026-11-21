/**
 * Draws the shareable portfolio summary card (Canvas 2D, no dependencies).
 * Dark navy glass design: the glow, big number and chips follow the result (green profit, rose loss),
 * with the gold-bars tile and Helper branding to match the price card.
 */
import {
  SHARE_CARD_HEIGHT,
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

export type { Trend };

export interface GoldSummaryCardData {
  brand: string;
  subtitle: string;
  date: string;
  footer: string;
  heroLabel: string;
  heroValue: string;
  heroTrend: Trend;
  /** Return on the money put in, for example "+4.20%". Null hides the chip. */
  heroPercent: string | null;
  /** Exactly three small tiles: gold held, cost, current value. */
  tiles: { label: string; value: string; masked?: boolean }[];
  /** Exactly two P/L tiles: realized, unrealized. */
  results: { label: string; value: string; trend: Trend; icon: "realized" | "unrealized"; masked?: boolean }[];
}

/** Small stroked icons on a 24-unit grid. */
function drawIcon(ctx: Ctx, kind: "realized" | "unrealized", x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "realized") {
    ctx.moveTo(18, 9);
    ctx.lineTo(12, 3);
    ctx.lineTo(6, 9);
    ctx.moveTo(12, 3);
    ctx.lineTo(12, 17);
    ctx.moveTo(5, 21);
    ctx.lineTo(19, 21);
  } else {
    [[4, 18], [8, 14], [12, 16], [16, 13], [20, 10]].forEach(([bx, top]) => {
      ctx.moveTo(bx, top);
      ctx.lineTo(bx, 21);
    });
    ctx.moveTo(2, 14);
    ctx.lineTo(9, 7.5);
    ctx.lineTo(13.5, 11);
    ctx.lineTo(22, 3);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * A soft, blurred frosted placeholder that stands in for a hidden value. It has a fixed size and is not
 * made from the real text, so nothing about the value (digits, length, sign) can be recovered from it.
 * Uses shadows for the blur because canvas `filter` is not available in every WebView.
 */
function drawMaskedBlob(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  tile: { x: number; y: number; w: number; h: number; r: number },
) {
  const radius = h * 0.4;
  const far = 2400; // shape is drawn off-canvas; only its blurred shadow lands on the card

  const softLayer = (blur: number, shadow: string, fill: string) => {
    ctx.save();
    ctx.shadowColor = shadow;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = far;
    ctx.fillStyle = fill;
    roundRectPath(ctx, x - far, y, w, h, radius);
    ctx.fill();
    ctx.restore();
  };
  // Everything stays inside the tile, so the blur never spills over its edge or its label.
  ctx.save();
  roundRectPath(ctx, tile.x + 2, tile.y + 2, tile.w - 4, tile.h - 4, tile.r);
  ctx.clip();
  softLayer(30, "rgba(255, 255, 255, 0.20)", "rgba(255, 255, 255, 0.20)"); // soft glow
  softLayer(12, "rgba(226, 232, 240, 0.62)", "rgba(226, 232, 240, 0.62)"); // blurred body

  // Brighter centre, like light shining through frosted glass (a soft oval, so it has no straight edges).
  const radius2 = w * 0.55;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(1, (h * 0.95) / radius2);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius2);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.30)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-radius2 - 2, -radius2 - 2, radius2 * 2 + 4, radius2 * 2 + 4);
  ctx.restore();
  ctx.restore(); // end of clip
}

/** Pure drawing routine, so it also runs outside a browser page. */
export function drawGoldSummaryCard(ctx: Ctx, data: GoldSummaryCardData, logo: CanvasImageSource | null, family: string) {
  const w = SHARE_CARD_WIDTH;
  const tone = TREND[data.heroTrend];
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawDarkBackground(ctx, data.heroTrend);

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

  // Vertical layout.
  const hasChip = data.heroPercent !== null;
  const pad = 50;
  const heroH = pad + 138 + 140 + (hasChip ? 86 : 0) + pad;
  const tilesH = 150;
  const resultsH = 170;
  const gap = 20;
  const totalH = heroH + 36 + tilesH + gap + resultsH;
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
  fitFont(ctx, data.heroLabel, 600, 34, 20, innerW - 140, family);
  ctx.fillText(data.heroLabel, innerX + 140, top + 68);

  ctx.save();
  ctx.fillStyle = tone.text;
  ctx.shadowColor = `rgba(${tone.glow}, 0.55)`;
  ctx.shadowBlur = 40;
  fitFont(ctx, data.heroValue, 800, 150, 60, innerW, family);
  ctx.fillText(data.heroValue, innerX, top + 138 + 118);
  ctx.restore();

  if (data.heroPercent !== null) {
    const arrow = data.heroTrend === "up" ? "\u25B2 " : data.heroTrend === "down" ? "\u25BC " : "";
    const text = `${arrow}${data.heroPercent}`;
    fitFont(ctx, text, 800, 40, 24, innerW - 64, family);
    const chipW = ctx.measureText(text).width + 64;
    const chipY = top + 138 + 140 + 10;
    roundRectPath(ctx, innerX, chipY, chipW, 76, 38);
    ctx.fillStyle = tone.chip;
    ctx.fill();
    ctx.fillStyle = tone.text;
    ctx.fillText(text, innerX + 32, chipY + 52);
  }
  y += heroH + 36;

  // Three small tiles.
  const tileW = (heroW - gap * 2) / 3;
  data.tiles.slice(0, 3).forEach((tile, index) => {
    const tx = heroX + index * (tileW + gap);
    glassTile(ctx, tx, y, tileW, tilesH, 36);
    ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
    fitFont(ctx, tile.label, 500, 26, 16, tileW - 48, family);
    ctx.fillText(tile.label, tx + 24, y + 54);
    if (tile.masked) {
      drawMaskedBlob(ctx, tx + 24, y + 78, Math.min(150, tileW - 48), 46, { x: tx, y, w: tileW, h: tilesH, r: 36 });
    } else {
      ctx.fillStyle = "#fff";
      fitFont(ctx, tile.value, 800, 46, 20, tileW - 48, family);
      ctx.fillText(tile.value, tx + 24, y + 112);
    }
  });
  y += tilesH + gap;

  // Realized / unrealized.
  const resultW = (heroW - gap) / 2;
  data.results.slice(0, 2).forEach((result, index) => {
    const rx = heroX + index * (resultW + gap);
    const color = TREND[result.trend].text;
    glassTile(ctx, rx, y, resultW, resultsH, 40);
    drawIcon(ctx, result.icon, rx + 28, y + 30, 36, "rgba(255, 255, 255, 0.78)");
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    fitFont(ctx, result.label, 500, 26, 16, resultW - 120, family);
    ctx.fillText(result.label, rx + 28 + 50, y + 58);
    if (result.masked) {
      drawMaskedBlob(ctx, rx + 28, y + 88, Math.min(230, resultW - 56), 58, { x: rx, y, w: resultW, h: resultsH, r: 40 });
    } else {
      ctx.fillStyle = color;
      fitFont(ctx, result.value, 800, 62, 28, resultW - 56, family);
      ctx.fillText(result.value, rx + 28, y + 136);
    }
  });

  // Footer.
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

export function renderGoldSummaryCard(data: GoldSummaryCardData): Promise<Blob> {
  return renderCardBlob((ctx, logo, family) => drawGoldSummaryCard(ctx, data, logo, family));
}

export { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH };
