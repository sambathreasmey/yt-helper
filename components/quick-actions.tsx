import { Flame, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/language-provider";

interface QuickActionsProps {
  onOpen: (url: string) => void;
  onAddToHome: () => void;
  showAddToHome: boolean;
}

export function QuickActions({ onOpen, onAddToHome, showAddToHome }: QuickActionsProps) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 grid grid-cols-2 gap-2.5" data-layout-slot="quick">
      <Button onClick={() => onOpen("https://m.youtube.com/shorts")}>
        <Smartphone aria-hidden="true" className="text-muted" size={18} />
        {t("shorts")}
      </Button>
      <Button onClick={() => onOpen("https://m.youtube.com/feed/trending")}>
        <Flame aria-hidden="true" className="text-muted" size={18} />
        {t("trending")}
      </Button>
      {showAddToHome && (
        <Button className="col-span-2" onClick={onAddToHome}>
          <Plus aria-hidden="true" className="text-muted" size={18} />
          {t("homeScreen")}
        </Button>
      )}
    </div>
  );
}
