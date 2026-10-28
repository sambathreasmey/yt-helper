const STORAGE_KEYS = {
  favorites: "favs",
  history: "hist",
};

function parseVideoList(value) {
  try {
    const videos = JSON.parse(value || "[]");
    if (!Array.isArray(videos)) return [];
    return videos.filter((video) => video && typeof video.id === "string");
  } catch {
    return [];
  }
}

function readLocal(key) {
  try {
    return parseVideoList(window.localStorage.getItem(key));
  } catch {
    return [];
  }
}

function readCloud(telegram, key) {
  return new Promise((resolve) => {
    const cloudStorage = telegram?.CloudStorage;
    if (!cloudStorage?.getItem) {
      resolve(null);
      return;
    }

    try {
      cloudStorage.getItem(key, (error, value) => {
        resolve(error || !value ? null : parseVideoList(value));
      });
    } catch {
      resolve(null);
    }
  });
}

export async function loadLibraryList(telegram, listName) {
  const key = STORAGE_KEYS[listName];
  if (!key) throw new Error(`Unknown library list: ${listName}`);

  const cloudValue = await readCloud(telegram, key);
  return cloudValue ?? readLocal(key);
}

export function saveLibraryList(telegram, listName, videos) {
  const key = STORAGE_KEYS[listName];
  if (!key) throw new Error(`Unknown library list: ${listName}`);

  const value = JSON.stringify(videos);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Telegram cloud storage remains available when local storage is blocked.
  }
  try {
    telegram?.CloudStorage?.setItem?.(key, value);
  } catch {
    // Local storage is the fallback when Telegram cloud storage is unavailable.
  }
}
