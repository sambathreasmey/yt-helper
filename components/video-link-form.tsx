"use client";

import { useState, type FormEvent } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseYouTubeVideoId } from "@/services/youtube";

interface VideoLinkFormProps {
  onPlay: (videoId: string) => void;
  language?: string;
}

export function VideoLinkForm({ onPlay, language = "en" }: VideoLinkFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const isKhmer = language === "km";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const videoId = parseYouTubeVideoId(value);
    if (!videoId) {
      setError(isKhmer ? "សូមបញ្ចូលតំណ YouTube ត្រឹមត្រូវ។" : "Enter a valid YouTube link or video ID.");
      return;
    }
    setError("");
    setValue("");
    onPlay(videoId);
  }

  return (
    <Card className="mb-3" data-layout-slot="form">
      <CardHeader className="pb-3">
        <CardTitle>{isKhmer ? "ចាក់វីដេអូ" : "Play a video"}</CardTitle>
        <CardDescription className="mt-1">
          {isKhmer ? "បិទភ្ជាប់តំណ YouTube" : "Paste a YouTube link or video ID"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form className="flex gap-2" onSubmit={submit} noValidate>
          <Input
            aria-label="YouTube video link"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "video-link-error" : undefined}
            autoComplete="url"
            enterKeyHint="go"
            inputMode="url"
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError("");
            }}
            placeholder={isKhmer ? "បិទភ្ជាប់តំណ YouTube" : "Paste a YouTube link"}
            value={value}
          />
          <Button aria-label={isKhmer ? "ចាក់" : "Play video"} className="min-w-[82px]" type="submit" variant="primary">
            <Play aria-hidden="true" className="fill-current" size={16} />
            {isKhmer ? "លេង" : "Play"}
          </Button>
        </form>
        {error && <p className="mt-2 px-1 text-xs text-muted" id="video-link-error" role="alert">{error}</p>}
      </CardContent>
    </Card>
  );
}
