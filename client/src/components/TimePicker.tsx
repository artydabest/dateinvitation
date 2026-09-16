/** Time picking: a real little clock — she grabs anywhere and drags the hands. */
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { TIME_VIBES } from "@shared/invitation.config";
import { formatTimePretty } from "../lib/dateUtils";
import { FlowerImage } from "./flowers";
import { useReducedMotion } from "../hooks/useReducedMotion";

const C = 100; // viewBox center (200×200)
const HOUR_LEN = 44;
const MIN_LEN = 66;
const NUM_R = 72;
/** grabs within this radius (viewBox units) move the hour hand, outside → minute */
const HOUR_ZONE = 56;

const mod = (n: number, m: number) => ((n % m) + m) % m;
/** hand state → "HH:mm" (24h) */
const toKey = (h12: number, pm: boolean, minutes: number) =>
  `${String(mod(h12, 12) + (pm ? 12 : 0)).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

/** pointer position → angle in degrees, 0° at 12 o'clock, clockwise */
function angleOf(clientX: number, clientY: number, el: SVGSVGElement): number {
  const r = el.getBoundingClientRect();
  const dx = clientX - (r.left + r.width / 2);
  const dy = clientY - (r.top + r.height / 2);
  return mod((Math.atan2(dx, -dy) * 180) / Math.PI, 360);
}
/** pointer distance from center, in viewBox units (0–100) */
function distOf(clientX: number, clientY: number, el: SVGSVGElement): number {
  const r = el.getBoundingClientRect();
  const dx = clientX - (r.left + r.width / 2);
  const dy = clientY - (r.top + r.height / 2);
  return Math.hypot(dx, dy) * (200 / r.width);
}

const NUMERALS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return { n, x: C + NUM_R * Math.sin(a), y: C - NUM_R * Math.cos(a) };
});
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 6 * Math.PI) / 180;
  const long = i % 5 === 0;
  const r1 = long ? 84 : 88;
  return {
    i,
    long,
    x1: C + r1 * Math.sin(a),
    y1: C - r1 * Math.cos(a),
    x2: C + 92 * Math.sin(a),
    y2: C - 92 * Math.cos(a),
  };
});

export function TimePicker({
  selectedTime,
  onSelectTime,
}: {
  selectedTime: string | null;
  onSelectTime: (t: string) => void;
}) {
  const reduced = useReducedMotion();

  /** Single source of truth in a ref — drag handlers never read stale state. */
  const initial = (() => {
    const [h = 18, m = 30] = (selectedTime ?? "18:30").split(":").map(Number);
    return { h: h % 12 || 12, pm: h >= 12, m: mod(m, 60) };
  })();
  const [clock, setClock] = useState(initial);
  const clockRef = useRef(clock);
  const set = (patch: Partial<typeof initial>) => {
    clockRef.current = { ...clockRef.current, ...patch };
    setClock(clockRef.current);
  };

  /** true once she sets a time (a drag that ended, a key, or AM/PM) */
  const [touched, setTouched] = useState(selectedTime !== null);
  const [dragging, setDragging] = useState<null | "hour" | "min">(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ hand: "hour" | "min"; lastRaw: number; acc: number } | null>(null);
  /** parity of completed hour-hand spins — each full turn flips AM/PM */
  const parity = useRef(0);

  const commit = () => {
    const { h, pm, m } = clockRef.current;
    setTouched(true);
    onSelectTime(toKey(h, pm, m));
  };

  /** call after the hour-hand accumulator changes; flips AM/PM on each full turn */
  const flipOnTurn = (acc: number) => {
    const p = mod(Math.floor(acc / 360), 2);
    if (p !== parity.current) {
      parity.current = p;
      set({ pm: !clockRef.current.pm });
    }
  };

  // ── grab anywhere on the face ──
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    e.preventDefault();
    const dist = distOf(e.clientX, e.clientY, svgRef.current);
    const raw0 = angleOf(e.clientX, e.clientY, svgRef.current);
    // grabbing the minute hand's body counts as minutes, even inside the
    // hour zone (the hands often overlap each other's radius)
    const minDeg = clockRef.current.m * 6;
    const nearMinHand =
      dist > 34 &&
      Math.min(mod(raw0 - minDeg, 360), mod(minDeg - raw0, 360)) <= 16;
    const hand = dist > HOUR_ZONE || nearMinHand ? "min" : "hour";
    drag.current = {
      hand,
      lastRaw: raw0,
      // the accumulator starts at the dragged hand's current angle, so any
      // drag delta immediately moves it (no dead zone around ticks)
      acc: hand === "min" ? clockRef.current.m * 6 : (clockRef.current.h % 12) * 30,
    };
    if (hand === "hour") parity.current = 0; // each drag counts its own turns
    svgRef.current.setPointerCapture(e.pointerId);
    setDragging(hand);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return;
    const raw = angleOf(e.clientX, e.clientY, svgRef.current);

    if (drag.current.hand === "min") {
      // accumulate the drag delta, then snap the ACCUMULATED angle to the
      // nearest 5-minute step — the hand follows every movement instead of
      // ignoring small drags near a tick
      let d = raw - drag.current.lastRaw;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.current.lastRaw = raw;
      drag.current.acc += d;
      const m = mod(Math.round(drag.current.acc / 30) * 5, 60);
      if (m !== clockRef.current.m) set({ m });
      return;
    }

    let d = raw - drag.current.lastRaw;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    drag.current.lastRaw = raw;
    drag.current.acc += d;
    set({ h: mod(Math.round(drag.current.acc / 30), 12) || 12 });
    flipOnTurn(drag.current.acc);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return;
    if (svgRef.current.hasPointerCapture(e.pointerId))
      svgRef.current.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(null);
    commit();
  };

  // ── keyboard nudging (the hands are focusable sliders) ──
  const nudgeHour = (dir: -1 | 1) => {
    const { h, pm } = clockRef.current;
    const next = mod(h + dir - 1, 12) + 1;
    // wrapping 12↔1 turns the am/pm
    const flipped = (h === 12 && dir === 1) || (h === 1 && dir === -1);
    set({ h: next, pm: flipped ? !pm : pm });
    commit();
  };
  const nudgeMinute = (dir: -1 | 1) => {
    const { m } = clockRef.current;
    const next = mod(m + dir * 5, 60);
    if (next === 0 && dir === 1) nudgeHour(1);
    else if (next === 55 && dir === -1) nudgeHour(-1);
    set({ m: next });
    commit();
  };

  const hourDeg = (clock.h % 12) * 30;
  const minDeg = clock.m * 6;
  const key = toKey(clock.h, clock.pm, clock.m);
  const vibe = TIME_VIBES[String(mod(clock.h, 12) + (clock.pm ? 12 : 0))] ?? "any hour with you 💗";

  const handStyle = (deg: number): React.CSSProperties => ({
    transform: `rotate(${deg}deg)`,
    transformOrigin: "100px 100px",
    transformBox: "view-box",
    ...(dragging || reduced
      ? {}
      : { transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1)" }),
  });

  const sliderProps = (label: string, now: number, max: number, text: string) => ({
    tabIndex: 0,
    role: "slider" as const,
    "aria-label": label,
    "aria-valuenow": now,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    "aria-valuetext": text,
  });

  return (
    <div className="flex flex-col items-center">
      {/* the clock — grab the inner half for the hour hand, the outer for minutes */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className={`w-[210px] max-w-full touch-none select-none ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          role="group"
          aria-label="pick the time by moving the clock hands"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* face */}
          <circle
            cx={C}
            cy={C}
            r={95}
            className="fill-paper"
            stroke={touched ? "#c8102e" : "rgba(107,87,68,0.35)"}
            strokeWidth={touched ? 2.5 : 1.5}
          />

          {/* ticks — the one the minute hand points at glows */}
          {TICKS.map((t) => (
            <line
              key={t.i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={
                t.i === clock.m / 5
                  ? "#c8102e"
                  : t.long
                    ? "rgba(107,87,68,0.55)"
                    : "rgba(107,87,68,0.25)"
              }
              strokeWidth={t.i === clock.m / 5 ? 2.4 : t.long ? 1.8 : 1}
              strokeLinecap="round"
            />
          ))}

          {/* numerals */}
          {NUMERALS.map(({ n, x, y }) => (
            <text
              key={n}
              x={x}
              y={y + 4.5}
              textAnchor="middle"
              className="font-hand pointer-events-none"
              fontSize={14}
              fill="#6b5744"
            >
              {n}
            </text>
          ))}

          {/* hour hand — heart at the tip; the slider lives on this group so
              keyboard focus draws its ring right at the hand */}
          <g
            {...sliderProps(
              "hour hand",
              clock.h,
              12,
              `${clock.h} ${clock.pm ? "PM" : "AM"}`,
            )}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); nudgeHour(1); }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); nudgeHour(-1); }
            }}
            style={handStyle(hourDeg)}
            pointerEvents="none"
          >
            <line
              x1={C}
              y1={C + 12}
              x2={C}
              y2={C - HOUR_LEN}
              stroke="#c8102e"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <text x={C} y={C - HOUR_LEN + 2} textAnchor="middle" fontSize={13}>
              💗
            </text>
            {/* real geometry so the focus ring has something to wrap */}
            <circle cx={C} cy={C - HOUR_LEN + 4} r={16} fill="transparent" />
          </g>

          {/* minute hand */}
          <g
            {...sliderProps("minute hand", clock.m, 55, `${clock.m} minutes`)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); nudgeMinute(1); }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); nudgeMinute(-1); }
            }}
            style={handStyle(minDeg)}
            pointerEvents="none"
          >
            <line
              x1={C}
              y1={C + 14}
              x2={C}
              y2={C - MIN_LEN}
              stroke="#8fb8d8"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <circle cx={C} cy={C - MIN_LEN + 5} r={3.5} fill="#8fb8d8" />
            <circle cx={C} cy={C - MIN_LEN + 5} r={14} fill="transparent" />
          </g>

          {/* center pin */}
          <circle cx={C} cy={C} r={5.5} fill="#433528" />
          <circle cx={C} cy={C} r={2} fill="#faf5ee" />
        </svg>

        {/* THE small pink flower — appears once the time is set */}
        {(touched || selectedTime !== null) && !dragging && (
          <motion.span
            className="absolute -right-1.5 -top-2 z-10"
            initial={reduced ? false : { scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 15 }}
            aria-hidden="true"
          >
            <FlowerImage type="smallPink" size={26} />
          </motion.span>
        )}
      </div>

      {/* the readout + vibe */}
      <div className="mt-3 min-h-[3.4rem] text-center">
        {touched ? (
          <motion.div
            key={key}
            initial={{ opacity: 0, rotate: -1.5 }}
            animate={{ opacity: 1, rotate: -0.8 }}
          >
            <p className="hand text-3xl leading-none text-cherry">
              {formatTimePretty(key)}
            </p>
            <p className="hand mt-1 text-lg opacity-80">{vibe}</p>
          </motion.div>
        ) : (
          <p className="hand text-xl opacity-60">
            drag the hands to pick a time 🕐
          </p>
        )}
      </div>

      {/* AM / PM pills */}
      <div className="flex items-center gap-1 rounded-full border border-cocoa/25 bg-paper px-1 py-1">
        {(["AM", "PM"] as const).map((label) => {
          const on = (label === "PM") === clock.pm;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => {
                set({ pm: label === "PM" });
                commit();
              }}
              className={`ampm rounded-full ${on ? "ampm--on" : "hover:bg-blush/40"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
