"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getGlobalAppSettings,
  GLOBAL_APP_SETTINGS_QUERY_KEY,
} from "@/services/dashboard-api";

export function useGlobalAppSettings() {
  return useQuery({
    queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await getGlobalAppSettings();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load global app settings");
      }
      return response.data;
    },
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
