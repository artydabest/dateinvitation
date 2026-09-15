/**
 * Hand-drawn-style SVG botanicals + tiny motifs.
 * All decorative SVGs are aria-hidden; meaningful ones get titles.
 *
 * These are FALLBACKS — any flower with an image configured in
 * shared/invitation.config.ts renders the real image instead.
 */

export function Sunflower({
  size = 72,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* stem */}
      <path
        d="M50 62 C 48 76, 52 88, 49 98"
        stroke="#5f7358"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 76 C 42 74, 36 76, 32 82 C 40 84, 46 82, 50 78"
        fill="#7a9471"
      />
      {/* petals */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i * 360) / 14;
        return (
          <ellipse
            key={i}
            cx="50"
            cy="26"
            rx="7"
            ry="16"
            fill={i % 2 ? "#f2b134" : "#f7d774"}
            stroke="#d9962e"
            strokeWidth="1"
            transform={`rotate(${angle} 50 46)`}
          />
        );
      })}
      {/* center */}
      <circle cx="50" cy="46" r="13" fill="#8a5a2b" />
      <circle cx="50" cy="46" r="13" fill="none" stroke="#6b4420" strokeWidth="2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(a) * 6}
            cy={46 + Math.sin(a) * 6}
            r="1.4"
            fill="#6b4420"
          />
        );
      })}
    </svg>
  );
}

/** Deep cherry-red hibiscus — fallback for the supplied PNG asset. */
export function Hibiscus({
  size = 72,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* five overlapping petals, deep cherry red */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * 360) / 5;
        return (
          <path
            key={i}
            d="M50 50 C 42 40, 40 26, 47 15 C 55 8, 66 12, 67 24 C 68 36, 60 46, 50 50 Z"
            fill={i % 2 ? "#c8102e" : "#a50b24"}
            stroke="#7d081c"
            strokeWidth="1.4"
            transform={`rotate(${angle} 50 50)`}
          />
        );
      })}
      {/* pistil column + stigmas */}
      <path
        d="M50 50 C 52 42, 54 36, 57 30"
        stroke="#f7d774"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="57.5" cy="29" r="2.4" fill="#f7d774" />
      <circle cx="53.5" cy="31.5" r="1.8" fill="#f7d774" />
      <circle cx="60" cy="33.5" r="1.8" fill="#f7d774" />
    </svg>
  );
}

export function Lily({
  size = 64,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M50 58 C 52 74, 48 86, 51 98"
        stroke="#5f7358"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* delicate recurved petals */}
      <path
        d="M50 58 C 38 54, 26 44, 24 28 C 36 32, 46 42, 50 54 Z"
        fill="#fffdf8"
        stroke="#e9aebc"
        strokeWidth="1.6"
      />
      <path
        d="M50 58 C 62 54, 74 44, 76 28 C 64 32, 54 42, 50 54 Z"
        fill="#fffdf8"
        stroke="#e9aebc"
        strokeWidth="1.6"
      />
      <path
        d="M50 58 C 44 46, 44 30, 50 16 C 56 30, 56 46, 50 54 Z"
        fill="#fffdf8"
        stroke="#e9aebc"
        strokeWidth="1.6"
      />
      {/* stamens */}
      <path d="M47 52 C 44 44, 42 38, 43 32" stroke="#c8102e" strokeWidth="1.4" fill="none" />
      <path d="M53 52 C 56 44, 58 38, 57 32" stroke="#c8102e" strokeWidth="1.4" fill="none" />
      <circle cx="43" cy="31" r="2.2" fill="#c8102e" />
      <circle cx="57" cy="31" r="2.2" fill="#c8102e" />
    </svg>
  );
}

/** Airy baby's-breath — clusters of tiny white dots on thin stems. */
export function BabysBreath({
  size = 56,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {[
        ["M50 92 C 48 74, 50 58, 44 40", "M46 62 C 38 56, 32 50, 28 42"],
        ["M52 90 C 56 72, 60 56, 68 42", "M56 66 C 64 60, 70 54, 74 46"],
        ["M50 88 C 50 70, 52 54, 52 36"],
      ].map((stems, i) => (
        <g key={i}>
          {stems.map((d, j) => (
            <path
              key={j}
              d={d}
              stroke="#7a9471"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
      {(
        [
          [44, 38], [40, 47], [50, 34], [56, 44], [68, 40],
          [73, 48], [52, 36], [62, 33], [36, 55], [76, 57],
          [47, 50], [58, 52],
        ] as const
      ).map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.1" fill="#fffdf8" stroke="#e9aebc" strokeWidth="0.9" />
          <circle cx={x} cy={y} r="1" fill="#e9aebc" />
        </g>
      ))}
    </svg>
  );
}

/** Small soft-pink filler flower. */
export function SmallPink({
  size = 48,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M50 58 C 49 72, 51 86, 50 96"
        stroke="#5f7358"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3;
        return (
          <ellipse
            key={i}
            cx={50 + Math.cos(a) * 14}
            cy={42 + Math.sin(a) * 14}
            rx="8.5"
            ry="12"
            fill={i % 2 ? "#f3c4cd" : "#f6d7dd"}
            stroke="#e9aebc"
            strokeWidth="1.2"
            transform={`rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 14} ${42 + Math.sin(a) * 14})`}
          />
        );
      })}
      <circle cx="50" cy="42" r="6" fill="#f7d774" stroke="#d9962e" strokeWidth="1.2" />
    </svg>
  );
}

export function Sprig({
  size = 56,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M20 90 C 40 70, 60 50, 84 14"
        stroke="#5f7358"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {[
        [36, 72, -40],
        [46, 60, -35],
        [56, 48, -30],
        [66, 36, -25],
        [75, 26, -20],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse
            cx={x}
            cy={y}
            rx="4"
            ry="10"
            fill="none"
            stroke="#7a9471"
            strokeWidth="2"
            transform={`rotate(${r} ${x} ${y})`}
          />
          <ellipse
            cx={x + 9}
            cy={y - 6}
            rx="4"
            ry="9"
            fill="none"
            stroke="#7a9471"
            strokeWidth="2"
            transform={`rotate(${r + 55} ${x + 9} ${y - 6})`}
          />
        </g>
      ))}
    </svg>
  );
}

export function TinyFlower({
  size = 22,
  color = "#e9aebc",
  center = "#c8102e",
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  center?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3;
        return (
          <ellipse
            key={i}
            cx={12 + Math.cos(a) * 5.2}
            cy={12 + Math.sin(a) * 5.2}
            rx="3.1"
            ry="4.4"
            fill={color}
            transform={`rotate(${(a * 180) / Math.PI} ${12 + Math.cos(a) * 5.2} ${12 + Math.sin(a) * 5.2})`}
          />
        );
      })}
      <circle cx="12" cy="12" r="2.6" fill={center} />
    </svg>
  );
}

/* ─────────────────── hearts (replace the old yarn motifs) ─────────────────── */

/** Simple filled hand-drawn heart. */
export function HeartDoodle({
  size = 26,
  color = "#e26d7f",
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path
        d="M16 27 C 6 20, 3 13, 6.5 8.5 C 9.5 4.8, 14 6, 16 10 C 18 6, 22.5 4.8, 25.5 8.5 C 29 13, 26 20, 16 27 Z"
        fill={color}
        stroke="rgba(67,53,40,0.25)"
        strokeWidth="1.2"
      />
      <path d="M10.5 10.5 C 9 11.5, 8.3 13, 8.4 14.6" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Cherry-red heart sticker with a tiny shine — scrapbook accent. */
export function HeartSticker({
  size = 34,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path
        d="M16 28 C 5 20.5, 2 13, 6 8 C 9.2 4, 14.2 5.4, 16 9.6 C 17.8 5.4, 22.8 4, 26 8 C 30 13, 27 20.5, 16 28 Z"
        fill="#c8102e"
        stroke="#96071f"
        strokeWidth="1.4"
      />
      <ellipse cx="11" cy="11.5" rx="3" ry="2" fill="rgba(255,255,255,0.55)" transform="rotate(-28 11 11.5)" />
    </svg>
  );
}

/** Outlined doodle heart for annotations. */
export function HeartOutline({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path
        d="M16 27 C 6 20, 3 13, 6.5 8.5 C 9.5 4.8, 14 6, 16 10 C 18 6, 22.5 4.8, 25.5 8.5 C 29 13, 26 20, 16 27 Z"
        fill="none"
        stroke="#e26d7f"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MangoDoodle({
  size = 26,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path
        d="M8 22 C 4 16, 8 7, 17 6 C 25 5, 28 11, 26 17 C 24 24, 14 28, 8 22 Z"
        fill="#f7d774"
        stroke="#d9962e"
        strokeWidth="1.6"
      />
      <path d="M17 6 C 18 4, 20 3, 22 3" stroke="#5f7358" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M11 13 C 12 10, 15 8.5, 18 8.5" stroke="#fde9b0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function WatermelonDoodle({
  size = 26,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path d="M4 18 A 12 12 0 0 0 28 18 Z" fill="#f38ba0" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M2.5 18 A 13.5 13.5 0 0 0 29.5 18" fill="none" stroke="#5f7358" strokeWidth="3" strokeLinecap="round" />
      {[9, 14, 19, 23].map((x, i) => (
        <ellipse key={i} cx={x} cy={i % 2 ? 22 : 24} rx="1" ry="1.5" fill="#433528" />
      ))}
    </svg>
  );
}

export function PomegranateDoodle({
  size = 26,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <circle cx="16" cy="18" r="10" fill="#e26d7f" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M13 7 L 16 3 L 19 7" stroke="#c8102e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="13" cy="17" r="1.4" fill="#c8102e" />
      <circle cx="17" cy="20" r="1.4" fill="#c8102e" />
      <circle cx="20" cy="15" r="1.4" fill="#c8102e" />
    </svg>
  );
}

export function PuddingCup({
  size = 30,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Pompompurin-inspired golden pudding cup — a motif, not the character.
  // (The real image goes in client/public/assets/characters/pompompurin.png)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <path d="M6 13 C 6 22, 9 27, 16 27 C 23 27, 26 22, 26 13 Z" fill="#f7d774" stroke="#d9962e" strokeWidth="1.5" />
      <path d="M5 12 C 5 9.5, 7 8, 9.5 8 C 11 5.5, 15 5, 16.5 7 C 19 5.5, 23 6.5, 23.5 9 C 26 9.5, 27 11, 26.5 12.5 C 23 14, 9 14, 5 12 Z" fill="#f7d774" stroke="#d9962e" strokeWidth="1.5" />
      <circle cx="12.5" cy="18" r="1.3" fill="#6b4420" />
      <circle cx="19.5" cy="18" r="1.3" fill="#6b4420" />
      <path d="M14 21.5 C 15.3 22.6, 16.7 22.6, 18 21.5" stroke="#6b4420" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MusicNote({
  size = 22,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path d="M9 18.5 V 5 L 19 3 V 16.5" stroke="#6b5744" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="6.8" cy="18.7" rx="2.6" ry="2.1" fill="#6b5744" transform="rotate(-18 6.8 18.7)" />
      <ellipse cx="16.8" cy="16.7" rx="2.6" ry="2.1" fill="#6b5744" transform="rotate(-18 16.8 16.7)" />
    </svg>
  );
}
