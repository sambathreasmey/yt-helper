import { TelegramOnlyGate } from "@/components/telegram-only-gate";
import { AppFeatureShell } from "@/components/app-feature-shell";

export default function Page() {
  return (
    <TelegramOnlyGate>
      <AppFeatureShell />
    </TelegramOnlyGate>
  );
}
