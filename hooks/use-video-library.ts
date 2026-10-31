"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLibraryList, saveLibraryList, type LibraryVideo } from "@/services/library-storage";
import type { TelegramWebApp } from "@/types/telegram";

export function useVideoLibrary(telegram: TelegramWebApp | null | undefined) {
  const [favorites, setFavorites] = useState<LibraryVideo[]>([]);
  const [history, setHistory] = useState<LibraryVideo[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (telegram === undefined) return () => { active = false; };

    Promise.all([
      loadLibraryList(telegram, "favorites"),
      loadLibraryList(telegram, "history"),
    ]).then(([loadedFavorites, loadedHistory]) => {
      if (!active) return;
      setFavorites(loadedFavorites);
      setHistory(loadedHistory);
      setReady(true);
    });

    return () => { active = false; };
  }, [telegram]);

  useEffect(() => {
    if (!ready) return;
    saveLibraryList(telegram, "favorites", favorites);
    saveLibraryList(telegram, "history", history);
  }, [favorites, history, ready, telegram]);

  const toggleFavorite = useCallback((video: LibraryVideo) => {
    setFavorites((current) => {
      return current.some((item) => item.id === video.id)
        ? current.filter((item) => item.id !== video.id)
        : [{ ...video, t: (video.t || video.id).slice(0, 50) }, ...current].slice(0, 20);
    });
  }, []);

  const addToHistory = useCallback((video: LibraryVideo) => {
    setHistory((current) => {
      return [{ ...video, t: (video.t || video.id).slice(0, 50) },
        ...current.filter((item) => item.id !== video.id)].slice(0, 20);
    });
  }, []);

  const updateLibraryTitle = useCallback((video: LibraryVideo) => {
    const title = video.t.slice(0, 50);
    setHistory((current) => {
      return current.map((item) => item.id === video.id ? { ...item, t: title } : item);
    });
    setFavorites((current) => {
      if (!current.some((item) => item.id === video.id)) return current;
      return current.map((item) => item.id === video.id ? { ...item, t: title } : item);
    });
  }, []);

  return { favorites, history, ready, toggleFavorite, addToHistory, updateLibraryTitle };
}
