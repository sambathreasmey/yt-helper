"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers/language-provider";

/** One image to preview and share. Create it when the user taps a share button; clear it to close the sheet. */
export interface ShareImageJob {
  fileName: string;
  shareTitle: string;
  shareText: string;
  alt: string;
  render: () => Promise<Blob>;
}

function ShareImagePanel({ job }: { job: ShareImageJob }) {
  const { t } = useLanguage();
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Draw the card once when the sheet opens; free the image URL when it closes.
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    job
      .render()
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
  }, [job]);

  const share = async () => {
    if (!image) return;
    const file = new File([image.blob], job.fileName, { type: "image/png" });
    try {
      if (typeof navigator.canShare !== "function" || !navigator.canShare({ files: [file] })) {
        setNotice(t("shareFailed"));
        return;
      }
      await navigator.share({ files: [file], title: job.shareTitle, text: job.shareText });
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
    link.download = job.fileName;
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
        <img alt={job.alt} className="gold-share-preview" src={image.url} />
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

/** Bottom sheet with an image preview and Share / Copy image / Download actions. */
export function ShareImageSheet({ job, title, onClose }: { job: ShareImageJob | null; title: string; onClose: () => void }) {
  return (
    <BottomSheet onClose={onClose} open={job !== null} title={title}>
      {job && <ShareImagePanel job={job} />}
    </BottomSheet>
  );
}
