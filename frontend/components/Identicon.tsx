import React, { useMemo } from "react";



interface IdenticonProps {

  address: string;

  size?: number;

  className?: string;

  rankBadge?: string;

}



function hashString(str: string): number {

  let hash = 0;

  for (let i = 0; i < str.length; i++) {

    hash = (hash << 5) - hash + str.charCodeAt(i);

    hash |= 0;

  }

  return Math.abs(hash);

}



const PALETTES = [

  ["#0F172A", "#2563EB", "#38BDF8", "#818CF8"], // Cyber Ocean

  ["#064E3B", "#10B981", "#34D399", "#2DD4BF"], // Emerald Matrix

  ["#2E1065", "#7C3AED", "#C084FC", "#F472B6"], // Aave Nebula

  ["#451A03", "#D97706", "#FBBF24", "#FB7185"], // Solar Gold

  ["#1E1B4B", "#4F46E5", "#22D3EE", "#A855F7"], // Stark Indigo

  ["#3B0764", "#EC4899", "#F43F5E", "#FBBF24"], // Hyper Sunset

];



export function Identicon({ address, size = 40, className = "", rankBadge }: IdenticonProps) {

  const { colors, c1, c2, c3, uid } = useMemo(() => {

    const cleanAddr = address || "0x0000000000000000000000000000000000000000";

    const seed = hashString(cleanAddr);

    const palette = PALETTES[seed % PALETTES.length];

    return {

      colors: palette,

      uid: cleanAddr.slice(2, 10) + (seed % 999),

      c1: { x: 15 + (seed % 70), y: 15 + ((seed >> 2) % 70) },

      c2: { x: 20 + ((seed >> 4) % 65), y: 20 + ((seed >> 6) % 65) },

      c3: { x: 10 + ((seed >> 8) % 80), y: 10 + ((seed >> 10) % 80) },

    };

  }, [address]);



  return (

    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>

      <div

        style={{ width: size, height: size }}

        className="relative rounded-xl overflow-hidden p-[1px] bg-gradient-to-b from-white/25 to-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"

      >

        <svg

          width="100%"

          height="100%"

          viewBox="0 0 100 100"

          className="rounded-[11px] overflow-hidden"

          xmlns="http://www.w3.org/2000/svg"

        >

          <defs>

            <filter id={`blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">

              <feGaussianBlur stdDeviation="16" result="blur" />

            </filter>

          </defs>

          {/* Base Background */}

          <rect width="100" height="100" fill={colors[0]} />

          {/* Mesh Blobs */}

          <g filter={`url(#blur-${uid})`}>

            <circle cx={c1.x} cy={c1.y} r="45" fill={colors[1]} />

            <circle cx={c2.x} cy={c2.y} r="38" fill={colors[2]} />

            <circle cx={c3.x} cy={c3.y} r="30" fill={colors[3]} opacity="0.85" />

          </g>

          {/* Subtle Geometric Web3 Overlay */}

          <circle

            cx="50"

            cy="50"

            r="36"

            fill="none"

            stroke="#ffffff"

            strokeOpacity="0.14"

            strokeWidth="1.2"

            strokeDasharray="4 4"

          />

          {/* Top Gloss Highlight */}

          <path

            d="M 0 0 Q 50 35 100 0 L 100 0 L 0 0 Z"

            fill="#ffffff"

            opacity="0.12"

          />

        </svg>

      </div>



      {rankBadge && (

        <span

          title={rankBadge}

          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#090D16] p-[2px] flex items-center justify-center shadow-md"

        >

          <span className="relative flex w-full h-full items-center justify-center">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-gradient-to-tr from-emerald-500 to-teal-300" />

          </span>

        </span>

      )}

    </div>

  );

}
