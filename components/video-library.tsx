import { Clock3, Play, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getVideoThumbnail } from "@/services/youtube";
import type { LibraryVideo } from "@/services/library-storage";

interface VideoSectionProps {
  icon: typeof Star;
  title: string;
  videos: LibraryVideo[];
  onPlay: (videoId: string) => void;
}

function VideoSection({ icon: Icon, title, videos, onPlay }: VideoSectionProps) {
  if (!videos.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 flex min-h-8 items-center gap-2.5 text-sm font-semibold">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted">
          <Icon aria-hidden="true" size={16} />
        </span>
        <span className="leading-none">{title}</span>
        <span
          aria-label={`${videos.length} ${title.toLowerCase()}`}
          className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-soft text-xs font-bold tabular-nums text-accent"
        >
          {videos.length}
        </span>
      </h2>
      <div className="grid gap-2" data-layout-items>
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <button
              aria-label={`Play ${video.t || video.id}`}
              className="group flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted"
              onClick={() => onPlay(video.id)}
              type="button"
            >
              <span className="relative block w-28 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                <img
                  alt=""
                  className="aspect-video size-full object-cover"
                  loading="lazy"
                  src={getVideoThumbnail(video.id)}
                />
                <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                  <Play aria-hidden="true" className="fill-current" size={20} />
                </span>
              </span>
              <span className="line-clamp-3 min-w-0 flex-1 text-[13px] font-medium leading-5">
                {video.t || video.id}
              </span>
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}

interface VideoLibraryProps {
  favorites: LibraryVideo[];
  history: LibraryVideo[];
  onPlay: (videoId: string) => void;
  language?: string;
}

export function VideoLibrary({ favorites, history, onPlay, language = "en" }: VideoLibraryProps) {
  const isKhmer = language === "km";
  return (
    <div data-layout-slot="library">
      <VideoSection icon={Star} title={isKhmer ? "ចូលចិត្ត" : "Favorites"} videos={favorites} onPlay={onPlay} />
      <VideoSection icon={Clock3} title={isKhmer ? "ថ្មីៗ" : "Recent"} videos={history} onPlay={onPlay} />
    </div>
  );
}
