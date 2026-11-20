"use client";

import { Copy, Download, Eye, EyeOff, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers/language-provider";

/** An on/off switch shown under the preview. Its state is passed to `render`, and the image redraws. */
export interface ShareImageOption {
  id: string;
  label: string;
}

/** One image to preview and share. Create it when the user taps a share button; clear it to close the sheet. */
export interface ShareImageJob {
  fileName: string;
  shareTitle: string;
  shareText: string;
  alt: string;
  /** Optional switches (for example "hide this value"). All start off unless a saved choice exists. */
  options?: ShareImageOption[];
  optionsTitle?: string;
  /** localStorage key used to remember the switches between visits. */
  storageKey?: string;
  render: (values: Record<string, boolean>) => Promise<Blob>;
}

function loadOptionValues(job: ShareImageJob): Record<string, boolean> {
  const values: Record<string, boolean> = {};
  job.options?.forEach((option) => {
    values[option.id] = false;
  });
  if (job.storageKey) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(job.storageKey) ?? "{}") as Record<string, unknown>;
      job.options?.forEach((option) => {
        if (saved[option.id] === true) values[option.id] = true;
      });
    } catch {
      // Ignore unreadable or unavailable storage.
    }
  }
  return values;
}

function ShareImagePanel({ job }: { job: ShareImageJob }) {
  const { t } = useLanguage();
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, boolean>>(() => loadOptionValues(job));
  const urlRef = useRef("");

  // Draw the card when the sheet opens and again whenever a switch changes.
  // The previous image stays visible until the new one is ready, so the preview does not flicker.
  useEffect(() => {
    let cancelled = false;
    job
      .render(values)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setImage({ blob, url });
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [job, values]);

  // Free the last image URL when the sheet closes.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    },
    [],
  );

  const toggleOption = (id: string) => {
    setNotice(null);
    setValues((current) => {
      const next = { ...current, [id]: !current[id] };
      if (job.storageKey) {
        try {
          window.localStorage.setItem(job.storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage errors: the choice just is not remembered.
        }
      }
      return next;
    });
  };

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

      {job.options && job.options.length > 0 && (
        <div className="share-options">
          {job.optionsTitle && <p className="share-options-title">{job.optionsTitle}</p>}
          <div className="share-options-list">
            {job.options.map((option) => (
              <button
                aria-checked={Boolean(values[option.id])}
                className="share-option"
                data-on={values[option.id] ? "true" : "false"}
                key={option.id}
                onClick={() => toggleOption(option.id)}
                role="switch"
                type="button"
              >
                {values[option.id] ? <EyeOff aria-hidden="true" size={15} /> : <Eye aria-hidden="true" size={15} />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
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
