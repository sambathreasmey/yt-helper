"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { formatUtcTimestamp } from "@/lib/date-format";
import { renderGoldShareCard, type GoldShareCardData } from "@/lib/gold-share-card";
import { useLanguage } from "@/providers/language-provider";

const FILE_NAME = "helper-gold-price.png";

interface GoldShareButtonProps {
  price: number;
  yesterdayPrice: number | null;
  history: number[];
  updatedOn?: string;
}

function GoldSharePanel({ data }: { data: GoldShareCardData }) {
  const { t } = useLanguage();
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Draw the card once when the sheet opens; free the image URL when it closes.
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    renderGoldShareCard(data)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ blob, url: objectUrl });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data]);

  const share = async () => {
    if (!image) return;
    const file = new File([image.blob], FILE_NAME, { type: "image/png" });
    try {
      if (typeof navigator.canShare !== "function" || !navigator.canShare({ files: [file] })) {
        setNotice(t("shareFailed"));
        return;
      }
      await navigator.share({ files: [file], title: data.brand, text: `${data.label}: ${data.amount} ${data.unit}` });
      setNotice(null);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setNotice(t("shareFailed"));
    }
  };

  const copy = async () => {
    if (!image) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("unsupported");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image.blob })]);
      setNotice(t("shareCopied"));
    } catch {
      setNotice(t("shareFailed"));
    }
  };

  const download = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.url;
    link.download = FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setNotice(t("shareSaveHint"));
  };

  return (
    <div className="gold-share-panel">
      {failed ? (
        <p className="gold-share-notice">{t("shareFailed")}</p>
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={data.label} className="gold-share-preview" src={image.url} />
      ) : (
        <Skeleton className="gold-share-preview" />
      )}

      <div className="gold-share-actions">
        <Button disabled={!image} onClick={share} type="button" variant="primary">
          <Share2 aria-hidden="true" size={17} /> {t("shareImage")}
        </Button>
        <Button disabled={!image} onClick={copy} type="button" variant="secondary">
          <Copy aria-hidden="true" size={17} /> {t("copyImage")}
        </Button>
        <Button disabled={!image} onClick={download} type="button" variant="secondary">
          <Download aria-hidden="true" size={17} /> {t("downloadImage")}
        </Button>
      </div>

      {notice && <p className="gold-share-notice" role="status">{notice}</p>}
    </div>
  );
}

/** Round share button for the price card. Opens a sheet with the generated image and share / copy / download actions. */
export function GoldShareButton({ price, yesterdayPrice, history, updatedOn }: GoldShareButtonProps) {
  const { t, locale } = useLanguage();
  const [snapshot, setSnapshot] = useState<GoldShareCardData | null>(null);

  const open = useCallback(() => {
    let yesterday: GoldShareCardData["yesterday"] = null;
    if (yesterdayPrice !== null && Number.isFinite(yesterdayPrice) && yesterdayPrice > 0) {
      const diff = Math.round((price - yesterdayPrice) * 100) / 100;
      const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
      const sign = diff > 0 ? "+" : diff < 0 ? "\u2212" : "";
      yesterday = {
        label: t("yesterdayPrice"),
        value: formatUsd(String(yesterdayPrice), locale),
        change: formatUsd(String(Math.abs(diff)), locale),
        percent: `${sign}${Math.abs((diff / yesterdayPrice) * 100).toFixed(2)}%`,
        trend,
      };
    }

    setSnapshot({
      brand: "Helper",
      subtitle: t("goldTrading"),
      label: t("goldPrice"),
      amount: formatUsd(String(price), locale),
      unit: `/ ${t("damlungUnit")}`,
      updated: updatedOn ? t("updated", { date: formatUtcTimestamp(updatedOn, locale) }) : "",
      footer: window.location.host,
      history: history.slice(-24),
      yesterday,
    });
  }, [history, locale, price, t, updatedOn, yesterdayPrice]);

  return (
    <>
      <button aria-label={t("shareCardTitle")} className="gold-share-button" onClick={open} type="button">
        <Share2 aria-hidden="true" size={18} />
      </button>
      <BottomSheet onClose={() => setSnapshot(null)} open={snapshot !== null} title={t("shareCardTitle")}>
        {snapshot && <GoldSharePanel data={snapshot} />}
      </BottomSheet>
    </>
  );
}
