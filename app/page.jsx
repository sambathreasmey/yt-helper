import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";
import { TelegramOnlyGate } from "@/components/telegram-only-gate";

export default function Page() {
  return (
    <TelegramOnlyGate>
      <YouTubeHelper />
    </TelegramOnlyGate>
  );
}
