"use client";

import { ExternalLink, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
