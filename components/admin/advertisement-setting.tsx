"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Megaphone, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAdvertisementSetting,
  updateAdvertisementSetting,
  type AdvertisementSetting as AdvertisementSettingData,
} from "@/services/dashboard-api";

const QUERY_KEY = ["app-settings", "youtube-advertisement"];
const EMPTY_ADVERTISEMENT: AdvertisementSettingData = {
  enabled: false,
  title: "",
  message: "",
  image_url: "",
  link_url: "",
};

export function useAdvertisementQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await getAdvertisementSetting();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load advertisement settings");
      }
      return response.data;
    },
    retry: false,
  });
}

function AdvertisementForm({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const settingQuery = useAdvertisementQuery();
  const [setting, setSetting] = useState(settingQuery.data ?? EMPTY_ADVERTISEMENT);
  const saveMutation = useMutation({
    mutationFn: async (value: AdvertisementSettingData) => {
      const response = await updateAdvertisementSetting(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save advertisement settings");
      }
      return response.data;
    },
    onSuccess: async (savedSetting) => {
      queryClient.setQueryData(QUERY_KEY, savedSetting);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      onSaved("Advertisement settings saved.");
    },
  });

  useEffect(() => {
    if (settingQuery.data) setSetting(settingQuery.data);
  }, [settingQuery.data]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate({
      ...setting,
      title: setting.title.trim(),
      message: setting.message.trim(),
      image_url: setting.image_url.trim(),
      link_url: setting.link_url.trim(),
    });
  }

  const valid = !setting.enabled || Boolean(setting.title.trim() && setting.message.trim());
  const update = (patch: Partial<AdvertisementSettingData>) => setSetting((current) => ({ ...current, ...patch }));

  return (
    <form className="space-y-3" onSubmit={submit}>
      <label className="admin-global-toggle">
        <input checked={setting.enabled} onChange={(event) => update({ enabled: event.target.checked })} type="checkbox" />
        <span>Show advertisement to users</span>
      </label>
      <label className="admin-ad-field">
        <span>Title</span>
        <Input maxLength={100} onChange={(event) => update({ title: event.target.value })} required={setting.enabled} value={setting.title} />
      </label>
      <label className="admin-ad-field">
        <span>Message</span>
        <textarea
          className="admin-ad-message"
          maxLength={1000}
          onChange={(event) => update({ message: event.target.value })}
          required={setting.enabled}
          rows={3}
          value={setting.message}
        />
      </label>
      <label className="admin-ad-field">
        <span>Image URL <small>(optional)</small></span>
        <Input maxLength={2048} onChange={(event) => update({ image_url: event.target.value })} placeholder="https://example.com/banner.jpg" type="url" value={setting.image_url} />
      </label>
      <label className="admin-ad-field">
        <span>Destination URL <small>(optional)</small></span>
        <Input maxLength={2048} onChange={(event) => update({ link_url: event.target.value })} placeholder="https://example.com" type="url" value={setting.link_url} />
      </label>
      <p className="text-xs text-muted">Shown only on YouTube home. Links must use HTTP or HTTPS.</p>
      {settingQuery.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{settingQuery.error.message}</p>}
      {saveMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{saveMutation.error.message}</p>}
      <Button className="w-full" disabled={!valid || saveMutation.isPending || settingQuery.isPending || settingQuery.isError} type="submit" variant="primary">
        <Save aria-hidden="true" size={16} />
        {saveMutation.isPending ? "Saving…" : "Save advertisement"}
      </Button>
    </form>
  );
}

export function AdvertisementSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Publish a shared banner on the YouTube home screen."
      icon={<Megaphone size={17} />}
      onClose={onClose}
      open={open}
      title="YouTube home advertisement"
    >
      <AdvertisementForm onSaved={onSaved} />
    </BottomSheet>
  );
}
