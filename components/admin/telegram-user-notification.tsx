"use client";

import { useState, type FormEvent } from "react";
import { Send, UserRound } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUsers, sendUserTelegramNotification } from "@/services/dashboard-api";
import { formatUserName, selectClass } from "@/components/admin/ui";

function MessageUserForm({ onSaved }: { onSaved: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const usersQuery = useQuery({
    queryKey: ["admin", "notification-recipients", search],
    queryFn: async () => {
      const response = await listUsers({ search, status: "ACTIVE", page: 1, page_size: 100 });
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to search active users");
      }
      return response.data;
    },
    retry: false,
  });
  const sendMutation = useMutation({
    mutationFn: async ({ recipient, text }: { recipient: string; text: string }) => {
      const response = await sendUserTelegramNotification(recipient, text);
      if (!response.ok || !response.data?.sent) {
        throw new Error(response.message || "Unable to send Telegram message");
      }
      return response.data;
    },
    onSuccess: () => onSaved("Telegram message sent successfully."),
  });
  const users = usersQuery.data?.items ?? [];
  const selectedUser = users.find((user) => String(user.chat_id) === chatId);
  const valid = Boolean(selectedUser && message.trim() && message.trim().length <= 4096);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || !message.trim()) return;
    const name = formatUserName(selectedUser);
    if (window.confirm(`Send this Telegram message to ${name} (${selectedUser.chat_id})?`)) {
      sendMutation.mutate({ recipient: String(selectedUser.chat_id), text: message.trim() });
    }
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <label className="admin-ad-field">
        <span>Filter users <small>(optional)</small></span>
        <Input
          autoComplete="off"
          onChange={(event) => { setSearch(event.target.value); setChatId(""); }}
          placeholder="Search name, username, or chat ID"
          value={search}
        />
      </label>
      <label className="admin-ad-field">
        <span>Recipient</span>
        <select
          className={selectClass}
          disabled={usersQuery.isPending || users.length === 0}
          onChange={(event) => setChatId(event.target.value)}
          required
          value={chatId}
        >
          <option value="">Select an active user</option>
          {users.map((user) => (
            <option key={user.id} value={String(user.chat_id)}>
              {formatUserName(user)} · {user.username ? `@${user.username}` : user.chat_id}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-ad-field">
        <span>Message <small>(up to 4096 characters)</small></span>
        <textarea className="admin-ad-message" maxLength={4096} onChange={(event) => setMessage(event.target.value)} required rows={4} value={message} />
      </label>
      {usersQuery.isPending && <p className="text-xs text-muted">Searching active users…</p>}
      {usersQuery.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{usersQuery.error.message}</p>}
      {usersQuery.data && users.length > 0 && (
        <p className="text-xs text-muted">
          {users.length === 100 && usersQuery.data.total > 100
            ? `Showing 100 of ${usersQuery.data.total} active users. Filter to find others.`
            : `${usersQuery.data.total} active users available.`}
        </p>
      )}
      {usersQuery.data && users.length === 0 && <p className="text-xs text-muted">No active users found.</p>}
      <p className="text-xs text-muted">The recipient must have started the Telegram bot and remain active.</p>
      {sendMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{sendMutation.error.message}</p>}
      <Button className="w-full" disabled={!valid || sendMutation.isPending} type="submit" variant="primary">
        <Send aria-hidden="true" size={15} />
        {sendMutation.isPending ? "Sending…" : "Send private message"}
      </Button>
    </form>
  );
}

export function MessageUserSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Search active Helper Management users and send a private message."
      icon={<UserRound size={17} />}
      onClose={onClose}
      open={open}
      title="Message one Telegram user"
    >
      <MessageUserForm onSaved={onSaved} />
    </BottomSheet>
  );
}
