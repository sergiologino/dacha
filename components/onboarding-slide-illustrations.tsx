/**
 * Локальные иллюстрации онбординга (SVG), без внешних URL —
 * не пустеют при блокировке Unsplash/CSP и работают офлайн.
 */

import type { FC, SVGProps } from "react";

function SvgFrame({
  children,
  gradientId,
  stops,
  ...props
}: SVGProps<SVGSVGElement> & {
  gradientId: string;
  stops: [string, string];
}) {
  return (
    <svg
      viewBox="0 0 800 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="100%" stopColor={stops[1]} />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

/** 0 — добро пожаловать, общий сад */
export function OnboardingSlideArt0(props: SVGProps<SVGSVGElement>) {
  const gid = "obg0";
  return (
    <SvgFrame gradientId={gid} stops={["#bbf7d0", "#34d399"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      <ellipse cx="400" cy="420" rx="320" ry="60" fill="#166534" fillOpacity="0.15" />
      <path
        d="M120 380 Q200 280 400 300 T680 360 L680 420 L120 420Z"
        fill="#15803d"
        fillOpacity="0.35"
      />
      <circle cx="250" cy="220" r="50" fill="#fbbf24" fillOpacity="0.9" />
      <path
        d="M400 140 L420 220 L380 220 Z M400 100 L430 200 L370 200 Z"
        fill="#166534"
        fillOpacity="0.85"
      />
      <rect x="360" y="220" width="80" height="120" rx="8" fill="#854d0e" fillOpacity="0.7" />
      <circle cx="320" cy="340" r="24" fill="#22c55e" />
      <circle cx="480" cy="360" r="28" fill="#4ade80" />
      <circle cx="560" cy="320" r="20" fill="#86efac" />
    </SvgFrame>
  );
}

/** 1 — участок / грядки */
export function OnboardingSlideArt1(props: SVGProps<SVGSVGElement>) {
  const gid = "obg1";
  return (
    <SvgFrame gradientId={gid} stops={["#d9f99d", "#65a30d"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={180 + i * 160}
          y={200 + (i % 2) * 20}
          width="120"
          height="200"
          rx="12"
          fill="#3f6212"
          fillOpacity={0.25 - i * 0.05}
        />
      ))}
      <path
        d="M160 400 L640 380"
        stroke="#a3a3a3"
        strokeWidth="4"
        strokeDasharray="12 14"
        strokeLinecap="round"
      />
    </SvgFrame>
  );
}

/** 2 — таймлайн */
export function OnboardingSlideArt2(props: SVGProps<SVGSVGElement>) {
  const gid = "obg2";
  return (
    <SvgFrame gradientId={gid} stops={["#ffedd5", "#fb923c"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      <path
        d="M100 280 L700 280"
        stroke="#9a3412"
        strokeOpacity="0.35"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {[140, 260, 380, 520, 640].map((x, i) => (
        <circle key={x} cx={x} cy="280" r={10 + i * 2} fill="#ea580c" fillOpacity={0.85} />
      ))}
    </SvgFrame>
  );
}

/** 3 — календарь */
export function OnboardingSlideArt3(props: SVGProps<SVGSVGElement>) {
  const gid = "obg3";
  return (
    <SvgFrame gradientId={gid} stops={["#e0f2fe", "#38bdf8"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      <rect x="220" y="100" width="360" height="320" rx="20" fill="white" fillOpacity="0.9" />
      <rect x="220" y="100" width="360" height="56" rx="20" fill="#0284c7" fillOpacity="0.85" />
      <text
        x="400"
        y="138"
        textAnchor="middle"
        fill="white"
        fontSize="28"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        Март
      </text>
      {Array.from({ length: 28 }, (_, d) => {
        const col = d % 7;
        const row = Math.floor(d / 7);
        const cx = 248 + col * 44;
        const cy = 188 + row * 44;
        const active = d === 10;
        return (
          <circle
            key={d}
            cx={cx}
            cy={cy}
            r="16"
            fill={active ? "#16a34a" : "#e2e8f0"}
            fillOpacity={active ? 1 : 0.7}
          />
        );
      })}
    </SvgFrame>
  );
}

/** 4 — справочник */
export function OnboardingSlideArt4(props: SVGProps<SVGSVGElement>) {
  const gid = "obg4";
  return (
    <SvgFrame gradientId={gid} stops={["#ede9fe", "#a78bfa"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      <rect x="200" y="120" width="400" height="280" rx="16" fill="white" fillOpacity="0.92" />
      <circle cx="320" cy="240" r="48" fill="#dcfce7" />
      <path
        d="M300 230 Q320 200 340 230 Q320 260 300 230"
        fill="#22c55e"
        fillOpacity="0.8"
      />
      <rect x="400" y="200" width="160" height="16" rx="4" fill="#cbd5e1" />
      <rect x="400" y="232" width="120" height="12" rx="3" fill="#e2e8f0" />
      <rect x="400" y="260" width="140" height="12" rx="3" fill="#e2e8f0" />
    </SvgFrame>
  );
}

/** 5 — чат / камера */
export function OnboardingSlideArt5(props: SVGProps<SVGSVGElement>) {
  const gid = "obg5";
  return (
    <SvgFrame gradientId={gid} stops={["#ccfbf1", "#14b8a6"]} {...props}>
      <rect width="800" height="500" fill={`url(#${gid})`} />
      <rect x="180" y="130" width="440" height="260" rx="24" fill="white" fillOpacity="0.95" />
      <rect x="220" y="170" width="280" height="44" rx="14" fill="#0d9488" fillOpacity="0.2" />
      <rect x="360" y="240" width="220" height="52" rx="16" fill="#0f766e" fillOpacity="0.35" />
      <circle cx="580" cy="300" r="36" fill="#0d9488" fillOpacity="0.5" />
      <circle cx="580" cy="300" r="18" fill="#ecfdf5" />
    </SvgFrame>
  );
}

export const ONBOARDING_SLIDE_ART: readonly FC<SVGProps<SVGSVGElement>>[] = [
  OnboardingSlideArt0,
  OnboardingSlideArt1,
  OnboardingSlideArt2,
  OnboardingSlideArt3,
  OnboardingSlideArt4,
  OnboardingSlideArt5,
];
