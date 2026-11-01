"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

/**
 * Runs one dashboard action and tracks busy/message state.
 * `onSuccess` runs after a successful action (for example, to reload data).
 */
export function useAdminAction(onSuccess) {
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async ({ action, successText }) => {
      const response = await action();
      if (!response.ok) throw new Error(response.message);
      return successText;
    },
    onSuccess: async (successText) => {
      setMessage(successText);
      await onSuccess?.();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Action failed");
    },
  });

  function run(action, successText) {
    setMessage("");
    mutation.mutate({ action, successText });
  }

  return { busy: mutation.isPending, message, run, setMessage };
}
