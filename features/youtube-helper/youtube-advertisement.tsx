"use client";

import { ExternalLink, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers/language-provider";
import { getAdvertisementSetting } from "@/services/dashboard-api";

const QUERY_KEY = ["app-settings", "youtube-advertisement"];

export function YouTubeAdvertisement() {
  const { t } = useLanguage();
  const settingQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await getAdvertisementSetting();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load advertisement");
      }
      return response.data;
    },
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const advertisement = settingQuery.data;

  if (settingQuery.isPending) {
    return (
      <div aria-busy="true" className="mb-3 space-y-2 rounded-3xl border border-border bg-surface p-4" data-layout-slot="advertisement">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-4 w-3/5 rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
      </div>
    );
  }
  if (settingQuery.error) {
    return <p className="youtube-ad-error" role="status">{t("advertisementUnavailable")}</p>;
  }
  if (!advertisement?.enabled) return null;

  return (
    <aside aria-label={t("advertisement")} className="youtube-ad-banner" data-layout-slot="advertisement">
      <div className="youtube-ad-content">
        <span className="youtube-ad-label"><Megaphone aria-hidden="true" size={14} />{t("advertisement")}</span>
        <h2>{advertisement.title}</h2>
        <p>{advertisement.message}</p>
        {advertisement.link_url && (
          <a className="youtube-ad-link" href={advertisement.link_url} rel="noreferrer" target="_blank">
            {t("learnMore")} <ExternalLink aria-hidden="true" size={14} />
          </a>
        )}
      </div>
      {advertisement.image_url && (
        <img
          alt=""
          className="youtube-ad-image"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={advertisement.image_url}
        />
      )}
    </aside>
  );
}
