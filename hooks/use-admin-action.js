"use client";

import { useCallback, useState } from "react";

/**
 * Runs one dashboard action and tracks busy/message state.
 * `onSuccess` runs after a successful action (for example, to reload data).
 */
export function useAdminAction(onSuccess) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const run = useCallback(async (action, successText) => {
    setBusy(true);
    setMessage("");
    const response = await action();
    setBusy(false);
    setMessage(response.ok ? successText : response.message);
    if (response.ok) await onSuccess?.();
    return response;
  }, [onSuccess]);

  return { busy, message, run, setMessage };
}
