/** Real monthly calendar — every day is pickable (weekdays too). */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CALENDAR_MAX_DATE,
  CALENDAR_MAX_MONTHS_AHEAD,
  CALENDAR_MIN_DATE,
  CALENDAR_START,
  DATE_NOTES,
} from "@shared/invitation.config";
import {
  addMonths,
  buildMonthGrid,
  WEEKDAY_HEADERS,
  dateForKey,
} from "../lib/dateUtils";
import { TinyFlower } from "./botanicals";
import { FlowerImage } from "./flowers";
import { useReducedMotion } from "../hooks/useReducedMotion";

function clampMonth({ year, month }: { year: number; month: number }) {
  const max = addMonths(
    CALENDAR_START.year,
    CALENDAR_START.month,
    CALENDAR_MAX_MONTHS_AHEAD,
  );
  if (year < CALENDAR_START.year) return { year: CALENDAR_START.year, month: CALENDAR_START.month };
  if (year === CALENDAR_START.year && month < CALENDAR_START.month)
    return { year: CALENDAR_START.year, month: CALENDAR_START.month };
  if (year > max.year) return max;
  if (year === max.year && month > max.month) return max;
  return { year, month };
}

export function DatePicker({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}) {
  const [{ year, month }, setMonth] = useState(() =>
    clampMonth(
      selectedDate
        ? (() => {
            const [y, m] = selectedDate.split("-").map(Number);
            return { year: y ?? CALENDAR_START.year, month: m ?? CALENDAR_START.month };
          })()
        : CALENDAR_START,
    ),
  );
  const reduced = useReducedMotion();

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const minDate = CALENDAR_MIN_DATE;
  const maxDate = CALENDAR_MAX_DATE;

  const canGoPrev =
    year > CALENDAR_START.year || month > CALENDAR_START.month;
  const canGoNext = (() => {
    const max = addMonths(CALENDAR_START.year, CALENDAR_START.month, CALENDAR_MAX_MONTHS_AHEAD);
    return year < max.year || (year === max.year && month < max.month);
  })();

  const go = (dir: -1 | 1) => {
    setMonth(clampMonth(addMonths(year, month, dir)));
  };

  // Today at midnight-ish (noon) for highlight, if within grid
  const todayKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div>
      {/* header: month + nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="cal-nav"
          onClick={() => go(-1)}
          disabled={!canGoPrev}
          aria-label="previous month"
        >
          ‹
        </button>
        <h3 className="hand text-2xl">{grid.monthLabel}</h3>
        <button
          type="button"
          className="cal-nav"
          onClick={() => go(1)}
          disabled={!canGoNext}
          aria-label="next month"
        >
          ›
        </button>
      </div>

      {/* weekday headers — columns are Sunday-start */}
      <div className="grid grid-cols-7 gap-1 text-center" role="row">
        {WEEKDAY_HEADERS.map((w, i) => (
          <div
            key={i}
            className="hand text-lg font-semibold text-cocoa/80"
            aria-hidden="true"
          >
            {w}
          </div>
        ))}
      </div>

      {/* the days grid */}
      <div className="grid grid-cols-7 gap-1 text-center" role="grid">
        {grid.days.map((key, i) => {
          if (key === null) return <div key={`blank-${i}`} aria-hidden="true" />;

          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          const disabled =
            (minDate !== null && key < minDate) || (maxDate !== null && key > maxDate);

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(key)}
              aria-pressed={isSelected}
              aria-label={`${dateForKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${isSelected ? " — selected" : ""}`}
              className={[
                "cal-day",
                isSelected ? "cal-day--selected" : "",
                isToday && !isSelected ? "cal-day--today" : "",
                disabled ? "cal-day--disabled" : "",
              ].join(" ")}
            >
              {/* THE sunflower — only ever on the currently selected date */}
              {isSelected && (
                <motion.span
                  className="absolute -right-1.5 -top-2 z-10"
                  initial={reduced ? false : { scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 15 }}
                  aria-hidden="true"
                >
                  <FlowerImage type="sunflower" size={22} />
                </motion.span>
              )}
              {isToday && !isSelected && !disabled && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
                  aria-hidden="true"
                >
                  <TinyFlower size={9} />
                </span>
              )}
              <span className="relative z-[1]">{dateForKey(key).getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* handwritten date notes */}
      {Object.keys(DATE_NOTES).length > 0 && (
        <div className="mt-3 space-y-1 text-center">
          {Object.entries(DATE_NOTES).map(([key, text]) => (
            <p key={key} className="hand text-lg opacity-80">
              {formatNoteDate(key)} — {text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNoteDate(key: string): string {
  return dateForKey(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
