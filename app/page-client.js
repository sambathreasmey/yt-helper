export function initializePage() {
  const tg = window.Telegram?.WebApp || createTelegramFallback();
  const $ = (id) => document.getElementById(id);
  const km = tg.initDataUnsafe?.user?.language_code === "km";
  const T = km
    ? { l: "បិទភ្ជាប់តំណ YouTube", p: "លេង", f: "ចូលចិត្ត", h: "ថ្មីៗ", sh: "ចែករំលែក", b: "ត្រឡប់ក្រោយ", yt: "បើក YouTube", auto: "បើកក្នុង {n} វិនាទី · ចុចកន្លែងផ្សេងដើម្បីបោះបង់", cancel: "បានបោះបង់ការបើកស្វ័យប្រវត្តិ", e: "វីដេអូនេះមិនអាចលេងនៅទីនេះបានទេ សូមបើកក្នុង YouTube", invalid: "សូមបញ្ចូលតំណ YouTube ត្រឹមត្រូវ។" }
    : { l: "Paste a YouTube link", p: "Play", f: "Favorites", h: "Recent", sh: "Share", b: "Back", yt: "Open YouTube", auto: "Opening in {n}s · tap anywhere else to cancel", cancel: "Auto-open cancelled", e: "This video can't be played here. Use the open button to watch it on YouTube.", invalid: "Enter a valid YouTube link or video ID." };

  function applyTheme() {
    const theme = tg.colorScheme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    const color = theme === "light" ? "#ffffff" : "#0f0f0f";
    ["setHeaderColor", "setBackgroundColor", "setBottomBarColor"].forEach((method) => {
      try { tg[method]?.(color); } catch {}
    });
  }

  applyTheme();
  tg.onEvent?.("themeChanged", applyTheme);
  const colorScheme = matchMedia("(prefers-color-scheme: light)");
  colorScheme.addEventListener?.("change", applyTheme);
  const preventZoom = (event) => event.preventDefault();
  const preventMultiTouch = (event) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  let lastTap = 0;
  const preventDoubleTap = (event) => {
    const now = Date.now();
    if (now - lastTap < 300) event.preventDefault();
    lastTap = now;
  };
  ["gesturestart", "gesturechange", "gestureend"].forEach((event) => document.addEventListener(event, preventZoom));
  document.addEventListener("touchmove", preventMultiTouch, { passive: false });
  document.addEventListener("touchend", preventDoubleTap, { passive: false });

  const hap = (type) => {
    try { tg.HapticFeedback?.impactOccurred(type || "light"); } catch {}
  };
  const lget = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  };
  const store = {
    get: (key) => new Promise((resolve) => {
      try {
        const cloudStorage = tg.CloudStorage;
        if (!cloudStorage?.getItem) {
          resolve(lget(key));
          return;
        }
        cloudStorage.getItem(key, (error, value) => resolve(!error && value ? JSON.parse(value) : lget(key)));
      } catch {
        resolve(lget(key));
      }
    }),
    set: (key, value) => {
      const serialized = JSON.stringify(value);
      try { localStorage.setItem(key, serialized); } catch {}
      try { tg.CloudStorage?.setItem(key, serialized); } catch {}
    },
  };

  let hist = [];
  let favs = [];
  let cur = null;
  let player = null;
  let loop = false;
  let pending = null;
  let countdownTimer = null;
  const speeds = [1, 1.25, 1.5, 2, 0.5];
  let speedIndex = 0;
  const parseId = (value) => {
    const input = value || "";
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|[?&]v=)([\w-]{11})/) ||
      (/^[\w-]{11}$/.test(input.trim()) ? [0, input.trim()] : null);
    return match ? match[1] : null;
  };

  tg.ready?.();
  tg.expand?.();
  try { tg.requestFullscreen?.(); } catch {}
  try { tg.disableVerticalSwipes?.(); } catch {}
  $("link").placeholder = T.l;
  $("ptxt").textContent = T.p;
  $("linkError").textContent = T.invalid;
  $("favT").querySelector(".section-title").textContent = T.f;
  $("hisT").querySelector(".section-title").textContent = T.h;
  $("share").querySelector("b").textContent = T.sh;
  $("pback").querySelector("b").textContent = T.b;
  $("err").textContent = T.e;
  $("htxt").textContent = T.yt;
  $("hsub").textContent = T.auto.replace("{n}", 3);
  if (!tg.addToHomeScreen) $("a2hs").classList.add("hide");

  const user = tg.initDataUnsafe?.user;
  if (user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "";
    $("profile-label").textContent = "Telegram profile";
    $("uname").textContent = name;
    $("uhandle").textContent = user.username ? `@${user.username}` : "Connected with Telegram";
    const avatar = $("av");
    if (user.photo_url) {
      const image = new Image();
      image.src = user.photo_url;
      image.alt = "";
      image.onerror = () => { avatar.textContent = (name[0] || "?").toUpperCase(); };
      avatar.replaceChildren(image);
    } else {
      avatar.textContent = (name[0] || "?").toUpperCase();
    }
  }

  function stopCountdown(silent) {
    if (countdownTimer === null) return;
    clearInterval(countdownTimer);
    countdownTimer = null;
    $("hero").classList.remove("run");
    $("hsub").textContent = silent ? "" : T.cancel;
  }

  function startCountdown() {
    let remaining = 3;
    $("hsub").textContent = T.auto.replace("{n}", remaining);
    $("hero").classList.add("run");
    countdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        stopCountdown(true);
        go("https://m.youtube.com");
        return;
      }
      $("hsub").textContent = T.auto.replace("{n}", remaining);
    }, 1000);
  }

  const cancelCountdown = (event) => {
    if (countdownTimer !== null && !event.target.closest?.("#hero")) stopCountdown();
  };
  document.addEventListener("pointerdown", cancelCountdown, true);
  document.addEventListener("keydown", cancelCountdown, true);

  function show(view) {
    if (view !== "home") stopCountdown(true);
    ["home", "player"].forEach((name) => $(name).classList.toggle("hide", name !== view));
    try {
      if (view === "home") tg.BackButton?.hide();
      else tg.BackButton?.show();
    } catch {}
    scrollTo(0, 0);
  }

  const renderLists = () => {
    $("favs").replaceChildren(...favs.map(makeItem));
    $("hist").replaceChildren(...hist.map(makeItem));
    $("favT").classList.toggle("hide", !favs.length);
    $("hisT").classList.toggle("hide", !hist.length);
  };
  const home = () => {
    try { player?.pauseVideo(); } catch {}
    show("home");
    renderLists();
  };
  const backToHome = () => { hap(); home(); };
  tg.BackButton?.onClick?.(home);
  $("pback").onclick = backToHome;

  const KEEP_HISTORY = false;
  const OPEN_MODE = "inapp";
  const go = (url) => {
    hap();
    if (OPEN_MODE === "browser") {
      tg.openLink(url, { try_instant_view: false });
      return;
    }
    try { tg.exitFullscreen?.(); } catch {}
    setTimeout(() => KEEP_HISTORY ? location.assign(url) : location.replace(url), 250);
  };
  const onPageShow = (event) => {
    if (event.persisted) {
      try { tg.requestFullscreen?.(); } catch {}
      applyTheme();
    }
  };
  window.addEventListener("pageshow", onPageShow);
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.onclick = () => go(button.dataset.go);
  });
  $("a2hs").onclick = () => {
    hap();
    try { tg.addToHomeScreen?.(); } catch {}
  };

  $("hero").onclick = () => {
    stopCountdown(true);
    go("https://m.youtube.com");
  };

  function makeItem(video) {
    const element = document.createElement("div");
    element.className = "item";
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    const title = document.createElement("span");
    title.textContent = video.t || video.id;
    element.append(image, title);
    element.onclick = () => play(video.id);
    return element;
  }

  async function titleOf(id) {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://youtu.be/${id}`)}`);
      return (await response.json()).title;
    } catch {
      return id;
    }
  }

  function makePlayer(id) {
    if (player?.loadVideoById) {
      player.loadVideoById(id);
      return;
    }
    if (!window.YT?.Player) {
      pending = id;
      return;
    }
    player = new window.YT.Player("yt", {
      videoId: id,
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (event) => {
          if (event.data === 0 && loop) {
            player.seekTo(0);
            player.playVideo();
          }
        },
        onError: () => $("err").classList.remove("hide"),
      },
    });
  }

  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    previousReady?.();
    if (pending) {
      const id = pending;
      pending = null;
      makePlayer(id);
    }
  };
  const iframeScript = document.createElement("script");
  iframeScript.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(iframeScript);

  async function play(id) {
    hap();
    cur = { id, t: id };
    show("player");
    $("err").classList.add("hide");
    $("ptitle").textContent = "";
    makePlayer(id);
    updateFavorite();
    const title = await titleOf(id);
    if (!cur || cur.id !== id) return;
    cur.t = title;
    $("ptitle").textContent = title;
    hist = [{ id, t: title.slice(0, 50) }, ...hist.filter((video) => video.id !== id)].slice(0, 20);
    store.set("hist", hist);
    if (favs.find((video) => video.id === id)) {
      favs = favs.map((video) => video.id === id ? { id, t: title.slice(0, 50) } : video);
      store.set("favs", favs);
    }
  }

  function updateFavorite() {
    $("fav").classList.toggle("star", !!favs.find((video) => video.id === cur?.id));
  }

  $("fav").onclick = () => {
    if (!cur) return;
    hap("medium");
    favs = favs.find((video) => video.id === cur.id)
      ? favs.filter((video) => video.id !== cur.id)
      : [{ id: cur.id, t: (cur.t || cur.id).slice(0, 50) }, ...favs].slice(0, 20);
    store.set("favs", favs);
    updateFavorite();
  };
  $("speed").onclick = () => {
    hap();
    speedIndex = (speedIndex + 1) % speeds.length;
    try { player?.setPlaybackRate(speeds[speedIndex]); } catch {}
    $("speed").textContent = `${speeds[speedIndex]}x`;
  };
  $("loop").onclick = () => {
    hap();
    loop = !loop;
    $("loop").classList.toggle("on", loop);
  };
  $("back10").onclick = () => {
    hap();
    try { player?.seekTo(player.getCurrentTime() - 10, true); } catch {}
  };
  $("fwd10").onclick = () => {
    hap();
    try { player?.seekTo(player.getCurrentTime() + 10, true); } catch {}
  };
  $("share").onclick = () => {
    if (!cur) return;
    hap();
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(`https://youtu.be/${cur.id}`)}&text=${encodeURIComponent(cur.t || "")}`);
  };
  $("open").onclick = () => {
    if (!cur) return;
    hap();
    tg.openLink(`https://youtu.be/${cur.id}`);
  };
  const playLink = () => {
    const id = parseId($("link").value);
    if (id) {
      $("link").value = "";
      $("linkError").classList.add("hide");
      play(id);
    } else {
      hap("heavy");
      $("linkError").classList.remove("hide");
    }
  };
  $("pbtn").onclick = playLink;
  const onLinkKeyDown = (event) => {
    if (event.key === "Enter") playLink();
  };
  const onLinkInput = () => $("linkError").classList.add("hide");
  $("link").addEventListener("keydown", onLinkKeyDown);
  $("link").addEventListener("input", onLinkInput);

  const initializeStorage = async () => {
    hist = (await store.get("hist")) || [];
    favs = (await store.get("favs")) || [];
    renderLists();
    const deepLink = parseId(new URLSearchParams(location.search).get("v")) ||
      parseId(tg.initDataUnsafe?.start_param);
    if (deepLink) play(deepLink);
    else startCountdown();
  };
  initializeStorage();

  return () => {
    stopCountdown(true);
    document.removeEventListener("gesturestart", preventZoom);
    document.removeEventListener("gesturechange", preventZoom);
    document.removeEventListener("gestureend", preventZoom);
    document.removeEventListener("touchmove", preventMultiTouch);
    document.removeEventListener("touchend", preventDoubleTap);
    document.removeEventListener("pointerdown", cancelCountdown, true);
    document.removeEventListener("keydown", cancelCountdown, true);
    $("link").removeEventListener("keydown", onLinkKeyDown);
    $("link").removeEventListener("input", onLinkInput);
    window.removeEventListener("pageshow", onPageShow);
    colorScheme.removeEventListener?.("change", applyTheme);
    tg.offEvent?.("themeChanged", applyTheme);
    tg.BackButton?.offClick?.(home);
    if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady = previousReady;
    iframeScript.remove();
    try { player?.destroy(); } catch {}
  };
}

function createTelegramFallback() {
  return {
    initDataUnsafe: {},
    colorScheme: "dark",
    HapticFeedback: { impactOccurred() {} },
    BackButton: { show() {}, hide() {}, onClick() {}, offClick() {} },
    ready() {},
    expand() {},
    requestFullscreen() {},
    disableVerticalSwipes() {},
    onEvent() {},
    openLink(url) { window.open(url, "_blank", "noopener,noreferrer"); },
    openTelegramLink(url) { window.open(url, "_blank", "noopener,noreferrer"); },
  };
}
