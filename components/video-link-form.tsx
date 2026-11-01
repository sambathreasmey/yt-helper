"use client";

import { useState, type FormEvent } from "react";
import { Link2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseYouTubeVideoId } from "@/services/youtube";
import { useLanguage } from "@/providers/language-provider";

interface VideoLinkFormProps {
  onPlay: (videoId: string) => void;
}

export function VideoLinkForm({ onPlay }: VideoLinkFormProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const videoId = parseYouTubeVideoId(value);
    if (!videoId) {
      setError(t("enterValidYouTube"));
      return;
    }
    setError("");
    setValue("");
    onPlay(videoId);
  }

  return (
    <Card className="youtube-link-card mb-3" data-layout-slot="form">
      <CardHeader className="youtube-link-heading pb-3">
        <span className="youtube-link-icon"><Link2 aria-hidden="true" size={18} /></span>
        <span className="min-w-0">
          <CardTitle>{t("playVideo")}</CardTitle>
        <CardDescription className="mt-1">
          {t("pasteYouTube")}
        </CardDescription>
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <form className="youtube-link-form flex gap-2" onSubmit={submit} noValidate>
          <Input
            aria-label={t("pasteYouTube")}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "video-link-error" : undefined}
            autoComplete="url"
            enterKeyHint="go"
            inputMode="url"
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError("");
            }}
            placeholder={t("pasteYouTubePlaceholder")}
            value={value}
          />
          <Button aria-label={t("play")} className="youtube-link-submit min-w-[82px]" type="submit" variant="primary">
            <Play aria-hidden="true" className="fill-current" size={16} />
            {t("play")}
          </Button>
        </form>
        {error && <p className="mt-2 px-1 text-xs text-muted" id="video-link-error" role="alert">{error}</p>}
      </CardContent>
    </Card>
  );
}
