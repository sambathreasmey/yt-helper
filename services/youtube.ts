const VIDEO_ID = /^[\w-]{11}$/;
const VIDEO_HOSTS = new Set<string>(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);

export function parseYouTubeVideoId(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input) return null;
  if (VIDEO_ID.test(input)) return input;

  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    const host = url.hostname.toLowerCase();
    if (!VIDEO_HOSTS.has(host)) return null;

    let id: string | null | undefined = null;
    if (host.endsWith("youtu.be")) {
      id = url.pathname.split("/").filter(Boolean)[0];
    } else if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, pathId] = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})(?:\/|$)/) || [];
      id = pathId;
    }

    return id && VIDEO_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://youtu.be/${videoId}`)}`,
    );
    if (!response.ok) return videoId;
    const result = (await response.json()) as { title?: unknown };
    return typeof result.title === "string" ? result.title : videoId;
  } catch {
    return videoId;
  }
}

export function getVideoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
