"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Megaphone, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function AdvertisementSetting() {
  const queryClient = useQueryClient();
  const [setting, setSetting] = useState(EMPTY_ADVERTISEMENT);
  const settingQuery = useQuery({
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
  const saveMutation = useMutation({
    mutationFn: async (value: AdvertisementSettingData) => {
      const response = await updateAdvertisementSetting(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save advertisement settings");
      }
      return response.data;
    },
    onSuccess: async (savedSetting) => {
      setSetting(savedSetting);
      queryClient.setQueryData(QUERY_KEY, savedSetting);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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

  return (
    <Card className="admin-ad-card">
      <CardHeader>
        <div className="admin-section-heading">
          <span className="admin-heading-icon admin-heading-violet" aria-hidden="true">
            <Megaphone size={18} />
          </span>
          <div>
            <CardTitle>YouTube home advertisement</CardTitle>
            <CardDescription>Publish a shared banner on the YouTube home screen.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="admin-ad-form" onSubmit={submit}>
          <label className="admin-ad-toggle">
            <input
              checked={setting.enabled}
              onChange={(event) => setSetting((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
            <span>Show advertisement to users</span>
          </label>

          <label className="admin-ad-field">
            <span>Title</span>
            <Input
              maxLength={100}
              onChange={(event) => setSetting((current) => ({ ...current, title: event.target.value }))}
              required={setting.enabled}
              value={setting.title}
            />
          </label>

          <label className="admin-ad-field">
            <span>Message</span>
            <textarea
              className="admin-ad-message"
              maxLength={1000}
              onChange={(event) => setSetting((current) => ({ ...current, message: event.target.value }))}
              required={setting.enabled}
              rows={3}
              value={setting.message}
            />
          </label>

          <label className="admin-ad-field">
            <span>Image URL <small>(optional)</small></span>
            <Input
              maxLength={2048}
              onChange={(event) => setSetting((current) => ({ ...current, image_url: event.target.value }))}
              placeholder="https://example.com/banner.jpg"
              type="url"
              value={setting.image_url}
            />
          </label>

          <label className="admin-ad-field">
            <span>Destination URL <small>(optional)</small></span>
            <Input
              maxLength={2048}
              onChange={(event) => setSetting((current) => ({ ...current, link_url: event.target.value }))}
              placeholder="https://example.com"
              type="url"
              value={setting.link_url}
            />
          </label>

          <div className="admin-ad-footer">
            <p className="text-xs text-muted">Shown only on YouTube home. Links must use HTTP or HTTPS.</p>
            <Button
              disabled={!valid || saveMutation.isPending || settingQuery.isPending || settingQuery.isError}
              type="submit"
              variant="primary"
            >
              <Save aria-hidden="true" size={16} />
              {saveMutation.isPending ? "Saving…" : "Save advertisement"}
            </Button>
          </div>
        </form>

        {settingQuery.error && <p className="admin-ad-error" role="alert">{settingQuery.error.message}</p>}
        {saveMutation.error && <p className="admin-ad-error" role="alert">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p className="admin-ad-success" role="status">Advertisement settings saved.</p>}
      </CardContent>
    </Card>
  );
}
