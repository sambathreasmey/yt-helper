"use client";

import { useEffect } from "react";
import { initializePage } from "./page-client";

function Icon({ name }) {
  return (
    <i aria-hidden="true">
      <svg className="ic">
        <use href={`#i-${name}`} />
      </svg>
    </i>
  );
}

function Symbols() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="symbols">
      <defs>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20" /></symbol>
        <symbol id="i-shorts" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3" /><path d="M12 18h.01" /></symbol>
        <symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></symbol>
        <symbol id="i-fire" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></symbol>
        <symbol id="i-ext" viewBox="0 0 24 24"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 12h8M12 8v8" /></symbol>
        <symbol id="i-back" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></symbol>
        <symbol id="i-ccw" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></symbol>
        <symbol id="i-cw" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></symbol>
        <symbol id="i-loop" viewBox="0 0 24 24"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></symbol>
        <symbol id="i-send" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></symbol>
      </defs>
    </svg>
  );
}

export default function Page() {
  useEffect(() => initializePage(), []);

  return (
    <>
      <Symbols />
      <main>
        <section id="home">
          <header>
            <svg viewBox="0 0 110 78" aria-hidden="true"><rect width="110" height="78" rx="20" fill="#f00" /><polygon points="44,22 44,56 74,39" fill="#fff" /></svg>
            <h1>YouTube Helper</h1>
          </header>
          <button className="hero" id="hero" type="button"><span className="fill" /><span className="hin"><Icon name="play" /><b id="htxt" /></span><small id="hsub" /></button>
          <div className="user hide" id="user"><div className="av" id="av" /><div><div className="uname" id="uname" /><div className="uhandle" id="uhandle" /></div></div>
          <div className="row" id="srow"><input id="q" /><button className="red" id="sbtn" type="button" aria-label="Search"><Icon name="search" /></button></div>
          <div className="row"><input id="link" /><button className="red" id="pbtn" type="button"><Icon name="play" /><b id="ptxt" /></button></div>
          <div className="grid">
            <button data-go="https://m.youtube.com/shorts" type="button"><Icon name="shorts" />Shorts</button>
            <button data-go="https://m.youtube.com/feed/trending" type="button"><Icon name="fire" />Trending</button>
            <button id="a2hs" type="button"><Icon name="plus" />Home Screen</button>
          </div>
          <h2 id="favT"><Icon name="star" /><span /></h2><div id="favs" />
          <h2 id="hisT"><Icon name="clock" /><span /></h2><div id="hist" />
        </section>

        <section id="search" className="hide">
          <button id="sback" type="button"><Icon name="back" /><b /></button>
          <div id="sres" className="search-results" />
        </section>

        <section id="player" className="hide">
          <button id="pback" type="button"><Icon name="back" /><b /></button>
          <div id="pwrap"><div id="yt" /></div>
          <p id="ptitle" />
          <p className="note hide" id="err" />
          <div className="ctl">
            <button id="back10" type="button"><Icon name="ccw" />10s</button><button id="fwd10" type="button">10s<Icon name="cw" /></button>
            <button id="speed" type="button">1x</button><button id="loop" type="button"><Icon name="loop" /></button>
            <button id="fav" type="button"><Icon name="star" /></button><button id="share" type="button"><Icon name="send" /><b /></button><button id="open" type="button"><Icon name="ext" /></button>
          </div>
        </section>
      </main>
    </>
  );
}
