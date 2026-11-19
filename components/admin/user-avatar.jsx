"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatUserName } from "@/components/admin/ui";

/** Full-screen view of a profile photo. Tap anywhere, press Esc, or use the Close button to dismiss. */
function PhotoViewer({ src, name, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div aria-label={name} aria-modal="true" className="admin-photo-viewer" onClick={onClose} role="dialog">
      <img
        alt={name}
        className="admin-photo-viewer-img"
        decoding="async"
        onClick={(event) => event.stopPropagation()}
        referrerPolicy="no-referrer"
        src={src}
      />
      <p className="admin-photo-viewer-name">{name}</p>
      <button
        aria-label="Close"
        className="admin-photo-viewer-close"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        type="button"
      >
        <X aria-hidden="true" size={22} />
      </button>
    </div>,
    document.body,
  );
}

/**
 * Telegram profile photo with a letter fallback (no photo, or the image fails to load).
 * With `zoomable`, tapping the photo opens it full screen. Do not use `zoomable` inside another button.
 */
export function UserAvatar({ user, zoomable = false }) {
  const photo = user?.photo_url || null;
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  // A new photo URL deserves a new attempt.
  useEffect(() => {
    setFailed(false);
    setOpen(false);
  }, [photo]);

  const name = formatUserName(user);
  const initial = name.replace(/^@/, "").trim().slice(0, 1).toUpperCase() || "?";
  const hasPhoto = Boolean(photo) && !failed;

  const avatar = (
    <span aria-hidden="true" className="gold-row-badge admin-user-avatar">
      {hasPhoto ? (
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

  if (!zoomable || !hasPhoto) return avatar;

  return (
    <>
      <button
        aria-label={`View ${name} profile photo`}
        className="admin-user-avatar-button"
        onClick={() => setOpen(true)}
        type="button"
      >
        {avatar}
      </button>
      {open && <PhotoViewer name={name} onClose={() => setOpen(false)} src={photo} />}
    </>
  );
}
