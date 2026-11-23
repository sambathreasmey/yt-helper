"use client";

import { useId } from "react";

export function GoldBullionArt() {
  const prefix = useId().replace(/:/g, "");
  const face = `${prefix}-market-gold-face`;
  const side = `${prefix}-market-gold-side`;
  const edge = `${prefix}-market-gold-edge`;
  const glow = `${prefix}-market-gold-glow`;
  const shadow = `${prefix}-market-gold-shadow`;

  return (
    <svg aria-hidden="true" className="gold-bullion-art" preserveAspectRatio="xMidYMid meet" viewBox="0 0 360 250">
      <defs>
        <linearGradient id={face} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="32%" stopColor="#ffe17a" />
          <stop offset="72%" stopColor="#f4b52d" />
          <stop offset="100%" stopColor="#c7790c" />
        </linearGradient>
        <linearGradient id={side} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6bd42" />
          <stop offset="55%" stopColor="#c77b12" />
          <stop offset="100%" stopColor="#75400b" />
        </linearGradient>
        <linearGradient id={edge} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff0a0" />
          <stop offset="100%" stopColor="#e49a17" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0%" stopColor="#ffc83d" stopOpacity="0.38" />
          <stop offset="72%" stopColor="#f3a91c" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffc83d" stopOpacity="0" />
        </radialGradient>
        <filter height="200%" id={shadow} width="180%" x="-40%" y="-50%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <ellipse cx="205" cy="132" fill={`url(#${glow})`} rx="138" ry="108" />
      <ellipse cx="205" cy="199" fill="#020713" filter={`url(#${shadow})`} rx="91" ry="17" />
      <ellipse
        cx="196"
        cy="151"
        fill="none"
        opacity="0.8"
        rx="157"
        ry="37"
        stroke="#ffda62"
        strokeWidth="2.6"
        transform="rotate(-19 196 151)"
      />
      <ellipse
        cx="201"
        cy="142"
        fill="none"
        opacity="0.66"
        rx="75"
        ry="127"
        stroke="#ffe28a"
        strokeWidth="1.8"
        transform="rotate(34 201 142)"
      />
      <ellipse
        cx="201"
        cy="142"
        fill="none"
        opacity="0.32"
        rx="75"
        ry="127"
        stroke="#f6bd42"
        strokeWidth="5"
        filter={`url(#${shadow})`}
        transform="rotate(34 201 142)"
      />
      <path d="m111 148 76-104 93 17-67 105z" fill={`url(#${face})`} stroke={`url(#${edge})`} strokeWidth="2" />
      <path d="m111 148 102 18-8 54-108-20z" fill={`url(#${face})`} stroke="#e8a52a" strokeWidth="1.5" />
      <path d="m213 166 67-105 2 68-77 91z" fill={`url(#${side})`} stroke="#d58a17" strokeWidth="1.5" />
      <path d="m126 145 77-92" fill="none" stroke="#fff9d1" strokeOpacity=".76" strokeWidth="2" />
      <text fill="#94600e" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="700" transform="rotate(10 193 111)" x="155" y="112">FINE GOLD</text>
      <text fill="#94600e" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" transform="rotate(10 193 111)" x="176" y="128">999.9</text>
      <circle cx="74" cy="89" fill="#ffe38a" opacity=".82" r="2" />
      <circle cx="304" cy="117" fill="#ffe38a" opacity=".78" r="1.8" />
      <circle cx="252" cy="31" fill="#ffe38a" opacity=".72" r="1.5" />
    </svg>
  );
}
