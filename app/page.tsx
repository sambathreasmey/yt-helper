import { TelegramOnlyGate } from "@/components/telegram-only-gate";
import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";

export default function Page() {
  return (
    <TelegramOnlyGate>
      <YouTubeHelper />
    </TelegramOnlyGate>
  );
}
