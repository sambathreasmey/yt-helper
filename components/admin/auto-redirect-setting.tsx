"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Clock3, Timer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAutoRedirectSetting, updateAutoRedirectSetting } from "@/services/dashboard-api";

const DEFAULT_SECONDS = 3;

export function AutoRedirectSetting() {
  const queryClient = useQueryClient();
  const [seconds, setSeconds] = useState(String(DEFAULT_SECONDS));
  const settingQuery = useQuery({
    queryKey: ["admin", "auto-redirect"],
    queryFn: async () => {
      const response = await getAutoRedirectSetting();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load auto-redirect setting");
      }
      return response.data;
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await updateAutoRedirectSetting(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save auto-redirect setting");
      }
      return response.data;
    },
    onSuccess: async (setting) => {
      setSeconds(String(setting.seconds));
      await queryClient.invalidateQueries({ queryKey: ["admin", "auto-redirect"] });
    },
  });

  useEffect(() => {
    if (settingQuery.data) setSeconds(String(settingQuery.data.seconds));
  }, [settingQuery.data]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(seconds);
    if (!Number.isInteger(value) || value < 0 || value > 60) return;
    saveMutation.mutate(value);
  }

  const secondsValue = Number(seconds);
  const isValid = Number.isInteger(secondsValue) && secondsValue >= 0 && secondsValue <= 60;

  return (
    <Card className="admin-redirect-card">
      <CardHeader>
        <div className="admin-section-heading">
          <span className="admin-heading-icon admin-heading-cyan" aria-hidden="true"><Timer size={18} /></span>
          <div>
            <CardTitle>YouTube auto-redirect</CardTitle>
            <CardDescription>Choose how long users wait before YouTube opens automatically.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="admin-redirect-form flex flex-wrap items-center gap-2" onSubmit={submit}>
          <label className="admin-redirect-label" htmlFor="youtube-auto-redirect-seconds">
            Delay
          </label>
          <span className="admin-redirect-input-wrap">
            <Input
              id="youtube-auto-redirect-seconds"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              step={1}
              required
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
              aria-describedby="youtube-auto-redirect-help"
            />
          </span>
          <span className="admin-redirect-unit">seconds</span>
          <Button
            className="admin-redirect-submit"
            disabled={!isValid || saveMutation.isPending || settingQuery.isPending}
            type="submit"
            variant="primary"
          >
            <Clock3 aria-hidden="true" size={16} />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
        <p className="text-xs text-muted" id="youtube-auto-redirect-help">
          Set 0 to disable automatic redirect. Use a value from 0 to 60 seconds.
        </p>
        {settingQuery.error && <p className="text-sm text-rose-400" role="alert">{settingQuery.error.message}</p>}
        {saveMutation.error && <p className="text-sm text-rose-400" role="alert">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p className="text-sm text-emerald-400" role="status">Auto-redirect setting saved.</p>}
      </CardContent>
    </Card>
  );
}
