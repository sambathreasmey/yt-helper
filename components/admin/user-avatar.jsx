"use client";

import { useEffect, useState } from "react";
import { formatUserName } from "@/components/admin/ui";

/** Telegram profile photo with a letter fallback (no photo, or the image fails to load). */
export function UserAvatar({ user }) {
  const photo = user?.photo_url || null;
  const [failed, setFailed] = useState(false);

  // A new photo URL deserves a new attempt.
  useEffect(() => setFailed(false), [photo]);

  const initial = formatUserName(user).replace(/^@/, "").trim().slice(0, 1).toUpperCase() || "?";

  return (
    <span aria-hidden="true" className="gold-row-badge admin-user-avatar">
      {photo && !failed ? (
        <img
          alt=""
          className="admin-user-avatar-img"
          decoding="async"
          loading="lazy"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
          src={photo}
        />
      ) : (
        initial
      )}
    </span>
  );
}
