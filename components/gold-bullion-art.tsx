"use client";

import { useId } from "react";

export function GoldBullionArt() {
  const prefix = useId().replace(/:/g, "");
  const ids = {
    top: `${prefix}-gold-top`,
    front: `${prefix}-gold-front`,
    side: `${prefix}-gold-side`,
    rim: `${prefix}-gold-rim`,
    glow: `${prefix}-gold-glow`,
    shadow: `${prefix}-gold-shadow`,
    barShadow: `${prefix}-gold-bar-shadow`,
    grain: `${prefix}-gold-grain`,
    topClip: `${prefix}-gold-top-clip`,
    frontClip: `${prefix}-gold-front-clip`,
  };

  return (
    <svg aria-hidden="true" className="gold-bullion-art" preserveAspectRatio="xMidYMid meet" viewBox="0 0 360 250">
      <defs>
        <linearGradient id={ids.top} x1="0.08" x2="0.92" y1="0.04" y2="0.98">
          <stop offset="0%" stopColor="#fff8d5" />
          <stop offset="17%" stopColor="#fff0a0" />
          <stop offset="38%" stopColor="#ffd958" />
          <stop offset="63%" stopColor="#f5b52c" />
          <stop offset="83%" stopColor="#d98a12" />
          <stop offset="100%" stopColor="#a85d08" />
        </linearGradient>
        <linearGradient id={ids.front} x1="0" x2="0.85" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffe17b" />
          <stop offset="28%" stopColor="#ffc943" />
          <stop offset="67%" stopColor="#eea31c" />
          <stop offset="100%" stopColor="#bf710c" />
        </linearGradient>
        <linearGradient id={ids.side} x1="0" x2="1" y1="0" y2="0.9">
          <stop offset="0%" stopColor="#e9a323" />
          <stop offset="36%" stopColor="#c77c13" />
          <stop offset="72%" stopColor="#9b560b" />
          <stop offset="100%" stopColor="#633307" />
        </linearGradient>
        <linearGradient id={ids.rim} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff9cf" />
          <stop offset="26%" stopColor="#fff0a0" />
          <stop offset="68%" stopColor="#e7a127" />
          <stop offset="100%" stopColor="#96500a" />
        </linearGradient>
        <radialGradient id={ids.glow}>
          <stop offset="0%" stopColor="#ffc83d" stopOpacity="0.48" />
          <stop offset="58%" stopColor="#f3a91c" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffc83d" stopOpacity="0" />
        </radialGradient>
        <filter height="240%" id={ids.shadow} width="220%" x="-60%" y="-70%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
        <filter height="150%" id={ids.barShadow} width="150%" x="-25%" y="-25%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="5" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA slope="0.42" type="linear" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter height="150%" id={ids.grain} width="150%" x="-25%" y="-25%">
          <feTurbulence baseFrequency="0.72" numOctaves="2" result="noise" seed="12" type="fractalNoise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA slope="0.12" type="linear" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
        <clipPath id={ids.topClip}>
          <path d="m122 125 55-79q5-7 14-5l91 17q10 2 5 11l-52 82q-4 6-12 5l-93-18q-12-2-8-13Z" />
        </clipPath>
        <clipPath id={ids.frontClip}>
          <path d="m122 125 101 19-9 49q-1 8-10 6l-92-18q-8-2-6-10z" />
        </clipPath>
      </defs>

      <ellipse cx="204" cy="127" fill={`url(#${ids.glow})`} rx="151" ry="116" />
      <ellipse cx="204" cy="196" fill="#020713" filter={`url(#${ids.shadow})`} rx="99" ry="17" />

      <ellipse
        cx="198"
        cy="145"
        fill="none"
        opacity="0.2"
        rx="160"
        ry="37"
        stroke="#fff1a7"
        strokeWidth="8"
        filter={`url(#${ids.shadow})`}
        transform="rotate(-19 198 145)"
      />
      <ellipse
        cx="198"
        cy="145"
        fill="none"
        opacity="0.88"
        rx="160"
        ry="37"
        stroke={`url(#${ids.rim})`}
        strokeWidth="2.4"
        transform="rotate(-19 198 145)"
      />
      <ellipse
        cx="204"
        cy="137"
        fill="none"
        opacity="0.67"
        rx="70"
        ry="128"
        stroke="#ffe59a"
        strokeWidth="1.7"
        transform="rotate(34 204 137)"
      />
      <ellipse
        cx="204"
        cy="137"
        fill="none"
        opacity="0.3"
        rx="70"
        ry="128"
        stroke="#f6bd42"
        strokeWidth="5"
        filter={`url(#${ids.shadow})`}
        transform="rotate(34 204 137)"
      />

      <g filter={`url(#${ids.barShadow})`}>
        <path
          d="m122 125 55-79q5-7 14-5l91 17q10 2 5 11l-52 82q-4 6-12 5l-93-18q-12-2-8-13Z"
          fill={`url(#${ids.top})`}
          stroke={`url(#${ids.rim})`}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m122 125 101 19-9 49q-1 8-10 6l-92-18q-8-2-6-10z"
          fill={`url(#${ids.front})`}
          stroke="#e8a52a"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="m223 144 64-86 1 61q0 7-6 12l-68 68z"
          fill={`url(#${ids.side})`}
          stroke="#bc7415"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        <path d="m128 121 53-75q5-6 11-4l88 17" fill="none" stroke="#fffde1" strokeOpacity=".78" strokeWidth="2.2" />
        <path d="m126 127 96 18-8 43" fill="none" stroke="#fff0a0" strokeOpacity=".75" strokeWidth="1.5" />
        <path d="m229 143 54-73" fill="none" stroke="#ffe085" strokeOpacity=".72" strokeWidth="1.5" />
        <path d="m125 135 94 18" fill="none" stroke="#a96009" strokeOpacity=".28" strokeWidth="1" />
        <path
          clipPath={`url(#${ids.topClip})`}
          d="M142 62Q193 48 262 73"
          fill="none"
          opacity=".28"
          stroke="#fffde1"
          strokeWidth="9"
        />
        <path
          clipPath={`url(#${ids.topClip})`}
          d="M139 82Q197 69 268 93"
          fill="none"
          opacity=".16"
          stroke="#fff7c5"
          strokeWidth="2"
        />
        <path
          clipPath={`url(#${ids.frontClip})`}
          d="M126 152Q169 163 217 165"
          fill="none"
          opacity=".2"
          stroke="#fff6c1"
          strokeWidth="8"
        />
        <path
          clipPath={`url(#${ids.topClip})`}
          d="m129 55 146 27-48 61-104-20z"
          fill="#fff5c2"
          filter={`url(#${ids.grain})`}
          opacity=".15"
        />

        <g transform="rotate(11 201 95)">
          <text fill="#98600e" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="800" letterSpacing=".35" textAnchor="middle" x="202" y="95">FINE GOLD</text>
          <text fill="#9d6412" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" letterSpacing=".4" textAnchor="middle" x="202" y="110">999.9</text>
          <path d="M188 116h28" stroke="#9d6412" strokeOpacity=".58" strokeWidth=".8" />
          <text fill="#9d6412" fontFamily="Arial, sans-serif" fontSize="4.7" fontWeight="700" letterSpacing=".8" textAnchor="middle" x="202" y="123">CERTIFIED FINE GOLD</text>
        </g>
        <text fill="#f3c65a" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" letterSpacing=".6" opacity=".8" transform="rotate(-5 254 163)" x="254" y="163">24K</text>
      </g>

      <path d="M111 89h-5m2.5-2.5v5" stroke="#fff1a0" strokeLinecap="round" strokeWidth="1.3" />
      <path d="M306 110h-4m2-2v4" stroke="#fff1a0" strokeLinecap="round" strokeWidth="1.1" />
      <circle cx="74" cy="89" fill="#fff0a0" opacity=".82" r="1.8" />
      <circle cx="310" cy="116" fill="#fff0a0" opacity=".78" r="1.6" />
      <circle cx="252" cy="31" fill="#fff0a0" opacity=".72" r="1.4" />
    </svg>
  );
}
