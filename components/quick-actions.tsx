import { memo } from "react";
import { ChevronRight, Flame, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeScreenGuide } from "@/components/home-screen-guide";
import { useLanguage } from "@/providers/language-provider";

interface QuickActionsProps {
  onOpen: (url: string) => void;
  onAddToHome: () => void;
  showAddToHome: boolean;
}

function QuickActionsImpl({ onOpen, onAddToHome, showAddToHome }: QuickActionsProps) {
  const { t } = useLanguage();
  return (
    <div className="youtube-quick-actions mb-6 grid grid-cols-2 gap-2.5" data-layout-slot="quick">
      <Button className="youtube-action-tile" data-action="shorts" onClick={() => onOpen("https://m.youtube.com/shorts")}>
        <span className="youtube-action-icon"><Smartphone aria-hidden="true" size={21} /></span>
        <span className="youtube-action-label">{t("shorts")}</span>
        <ChevronRight aria-hidden="true" className="youtube-action-chevron" size={19} />
      </Button>
      <Button className="youtube-action-tile" data-action="trending" onClick={() => onOpen("https://m.youtube.com/feed/trending")}>
        <span className="youtube-action-icon"><Flame aria-hidden="true" size={21} /></span>
        <span className="youtube-action-label">{t("trending")}</span>
        <ChevronRight aria-hidden="true" className="youtube-action-chevron" size={19} />
      </Button>
      {showAddToHome && (
        <Button className="youtube-action-tile youtube-home-action" data-action="home" onClick={onAddToHome}>
          <span className="youtube-action-icon"><Plus aria-hidden="true" size={21} /></span>
          <span className="youtube-action-label">{t("homeScreen")}</span>
          <ChevronRight aria-hidden="true" className="youtube-action-chevron" size={19} />
        </Button>
      )}
      <HomeScreenGuide />
    </div>
  );
}

export const QuickActions = memo(QuickActionsImpl);
