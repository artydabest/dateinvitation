/** The happy ending — date saved, calendar links, and the two of them. */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { DateInvitationDTO } from "@shared/invitation.types";
import { COPY, FEATURES, WHATSAPP, getActivityOption } from "@shared/invitation.config";
import { fetchGoogleStatus } from "../api/invitationApi";
import { Bouquet, type PickedFlower } from "../components/Bouquet";
import { FlowerCluster, HeartDivider, PetalBurst } from "../components/Decorations";
import { HeartDoodle } from "../components/botanicals";
import { FlowerImage } from "../components/flowers";
import { formatLong, formatTimePretty } from "../lib/dateUtils";

const KUROMI = "/assets/characters/kuromi.png";
const POMPOMPURIN = "/assets/characters/pompompurin.png";

/** The two of them, watching her say yes to more dates. */
function CharacterDuo() {
  const [failed, setFailed] = useState<string[]>([]);
  const tryImg = (key: string) => setFailed((f) => [...f, key]);

  if (failed.includes("k") && failed.includes("p")) {
    return <FlowerImage type="lily" size={86} className="animate-sway" />;
  }

  return (
    <div className="flex items-end justify-center gap-1" aria-hidden="true">
      {!failed.includes("k") && (
        <img
          src={KUROMI}
          alt=""
          draggable={false}
          width={92}
          height={92}
          className="select-none object-contain drop-shadow-sm"
          onError={() => tryImg("k")}
        />
      )}
      {!failed.includes("p") && (
        <img
          src={POMPOMPURIN}
          alt=""
          draggable={false}
          width={112}
          height={112}
          className="-ml-4 select-none object-contain drop-shadow-sm"
          onError={() => tryImg("p")}
        />
      )}
    </div>
  );
}

type GoogleState =
  | { kind: "loading" }
  | { kind: "ready"; authorized: boolean }
  | { kind: "error"; message: string };

export function FinalScreen({
  result,
  selectedDate,
  selectedTime,
  selectedActivityId,
  pickedFlowers,
}: {
  result: DateInvitationDTO | null;
  selectedDate: string;
  selectedTime: string;
  selectedActivityId: string | null;
  pickedFlowers: PickedFlower[];
}) {
  const activity = selectedActivityId ? getActivityOption(selectedActivityId) : null;
  const [burst, setBurst] = useState(true);
  const [google, setGoogle] = useState<GoogleState>({ kind: "loading" });

  useEffect(() => {
    const t = window.setTimeout(() => setBurst(false), 1600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchGoogleStatus()
      .then((s) => {
        if (alive) setGoogle({ kind: "ready", authorized: s.authorized });
      })
      .catch(() => {
        if (alive)
          setGoogle({
            kind: "error",
            message: "couldn't check the calendar connection",
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  const calendarHref = result?.calendarLink ?? null;
  const icsHref = result?.icsUrl ?? null;
  const whatsappHref =
    FEATURES.whatsapp && WHATSAPP.phone
      ? `https://wa.me/${WHATSAPP.phone}?text=${encodeURIComponent(WHATSAPP.message)}`
      : null;

  return (
    <motion.section
      className="screen"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      aria-labelledby="final-title"
    >
      <PetalBurst show={burst} />
      <FlowerCluster corner="top-left" variant="mixed" />
      <FlowerCluster corner="bottom-right" variant="hibiscus" />

      <motion.div
        initial={{ y: 18, opacity: 0, rotate: -1 }}
        animate={{ y: 0, opacity: 1, rotate: -0.6 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="paper-card relative z-10 w-full max-w-md px-7 py-9 text-center"
      >
        <span className="tape tape--custard -top-3 left-8 -rotate-3" aria-hidden="true" />
        <span className="tape tape--powder -top-2 right-8 rotate-2" aria-hidden="true" />

        <div className="mx-auto w-fit">
          <CharacterDuo />
        </div>
        <p className="hand mt-2 text-2xl text-cherry">
          {result?.calendarStatus === "success"
            ? "on the calendar and everything 📅"
            : google.kind === "ready" && !google.authorized
              ? "saved on the website 🌸"
              : null}
        </p>
        <h1 id="final-title" className="mt-1 font-serif text-5xl font-semibold text-balance">
          {COPY.final.title}
        </h1>
        <p className="mt-2 font-serif text-2xl italic text-cocoa">{COPY.final.names}</p>

        <HeartDivider className="my-5" />

        <p className="font-serif text-2xl font-semibold">{formatLong(selectedDate)}</p>
        <p className="hand text-3xl text-cherry">{formatTimePretty(selectedTime)}</p>

        {activity && (
          <>
            <p className="hand mt-3 text-xl text-cocoa">
              main activity: {`${activity.emoji} ${activity.name}`}
            </p>
            <p className="hand mt-1 text-lg opacity-75">{COPY.final.activityNote}</p>
          </>
        )}

        <p className="mt-5 text-[15px] leading-relaxed text-cocoa">{COPY.final.closing}</p>
        <p className="hand mt-3 text-xl opacity-85">{COPY.final.ps}</p>

        <div className="mt-7 flex flex-col gap-2.5">
          {FEATURES.googleCalendarLink && calendarHref && (
            <a
              className="btn-cherry"
              href={calendarHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {COPY.final.calendar}
            </a>
          )}
          {FEATURES.icsDownload && icsHref && (
            <a className="btn-powder" href={icsHref} download>
              {COPY.final.ics}
            </a>
          )}
          {whatsappHref && (
            <a
              className="btn-ghost"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {COPY.final.whatsapp}
            </a>
          )}
        </div>

        {/* the flowers she picked, gathered — only if she picked any */}
        {pickedFlowers.length > 0 && (
          <div className="mt-7 border-t border-dashed border-cocoa/20 pt-5">
            <p className="hand text-xl opacity-85">the flowers you picked:</p>
            <div className="mt-2 flex justify-center">
              <Bouquet flowers={pickedFlowers} label="with love" />
            </div>
          </div>
        )}

        {/* honest google status footnote */}
        <p className="mt-5 text-xs leading-relaxed text-cocoa/70">
          {google.kind === "loading" && "checking the calendar connection…"}
          {google.kind === "ready" &&
            (google.authorized
              ? "this event was also added to Roshan's google calendar automatically ✓"
              : "tip: the calendar button above adds it to your calendar in one tap")}
          {google.kind === "error" && google.message}
        </p>
      </motion.div>

      <HeartDoodle
        size={34}
        className="pointer-events-none absolute -left-4 top-1/3 animate-bob opacity-80"
      />
      <FlowerImage
        type="lily"
        size={96}
        className="pointer-events-none absolute -right-4 top-1/2 hidden opacity-40 sm:block"
      />
    </motion.section>
  );
}
