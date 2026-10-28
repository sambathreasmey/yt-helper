import { Flame, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions({ onOpen, onAddToHome, showAddToHome }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2.5">
      <Button onClick={() => onOpen("https://m.youtube.com/shorts")}>
        <Smartphone aria-hidden="true" className="text-muted" size={18} />
        Shorts
      </Button>
      <Button onClick={() => onOpen("https://m.youtube.com/feed/trending")}>
        <Flame aria-hidden="true" className="text-muted" size={18} />
        Trending
      </Button>
      {showAddToHome && (
        <Button className="col-span-2" onClick={onAddToHome}>
          <Plus aria-hidden="true" className="text-muted" size={18} />
          Home Screen
        </Button>
      )}
    </div>
  );
}
