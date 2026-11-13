"use client";

import { useState, type FormEvent } from "react";
import { Clock3, Timer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAutoRedirectSetting, updateAutoRedirectSetting } from "@/services/dashboard-api";

const DEFAULT_SECONDS = 3;

export function useAutoRedirectQuery() {
  return useQuery({
    queryKey: ["admin", "auto-redirect"],
    queryFn: async () => {
      const response = await getAutoRedirectSetting();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load auto-redirect setting");
      }
      return response.data;
    },
  });
}

function AutoRedirectForm({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const settingQuery = useAutoRedirectQuery();
  const [seconds, setSeconds] = useState(String(settingQuery.data?.seconds ?? DEFAULT_SECONDS));
  const [touched, setTouched] = useState(false);
  // Follow the loaded value until the admin starts typing.
  const shown = !touched && settingQuery.data ? String(settingQuery.data.seconds) : seconds;
  const saveMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await updateAutoRedirectSetting(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save auto-redirect setting");
      }
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "auto-redirect"] });
      onSaved("Auto-redirect setting saved.");
    },
  });

  const value = Number(shown);
  const isValid = Number.isInteger(value) && value >= 0 && value <= 60;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isValid) saveMutation.mutate(value);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <label className="admin-ad-field">
        <span>Delay (seconds)</span>
        <Input
          aria-describedby="youtube-auto-redirect-help"
          inputMode="numeric"
          max={60}
          min={0}
          onChange={(event) => { setTouched(true); setSeconds(event.target.value); }}
          required
          step={1}
          type="number"
          value={shown}
        />
      </label>
      <p className="text-xs text-muted" id="youtube-auto-redirect-help">
        Set 0 to disable automatic redirect. Use a value from 0 to 60 seconds.
      </p>
      {settingQuery.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{settingQuery.error.message}</p>}
      {saveMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{saveMutation.error.message}</p>}
      <Button className="w-full" disabled={!isValid || saveMutation.isPending || settingQuery.isPending} type="submit" variant="primary">
        <Clock3 aria-hidden="true" size={16} />
        {saveMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

export function AutoRedirectSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Choose how long users wait before YouTube opens automatically."
      icon={<Timer size={17} />}
      onClose={onClose}
      open={open}
      title="YouTube auto-redirect"
    >
      <AutoRedirectForm onSaved={onSaved} />
    </BottomSheet>
  );
}
