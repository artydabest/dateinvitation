/**
 * ════════════════════════════════════════════════════════════════
 *  THE INVITATION — one file to customize the entire experience.
 *  Change names, dates, times, copy, and toggles here.
 *  (Secrets live in the server's .env — never in this file.)
 * ════════════════════════════════════════════════════════════════
 */

export const INVITEE_NAME = "Sakshi";
export const INVITER_NAME = "Roshan";

/* ─────────────────────── CHARACTERS ─────────────────────────── */

export const CHARACTERS = {
  pompompurin: "/assets/characters/pompompurin.png",
  kuromi: "/assets/characters/kuromi.png",
  fatahh: "/assets/characters/fatahh.png",
} as const;

/* ──────────────────────── FLOWER IMAGES ─────────────────────── */

export const FLOWER_IMAGES = {
  cherryRedHibiscus: "/assets/flowers/cherry-red-hibiscus.png",
  sunflower: "/assets/flowers/sunflower.png",
  lily: "/assets/flowers/lily.png",
  lilyAlt: "/assets/flowers/lily-alt.png",
  babysBreath: "/assets/flowers/babys-breath.png",
  smallPink: "/assets/flowers/small-pink.png",
} as const;

export type FlowerType = keyof typeof FLOWER_IMAGES;

/* ─────────────────────── GARDEN (opening) ──────────────────────
 * The tappable flowers around the question card. Duplicate `type`
 * freely — each keeps its own picked state. Position: % of viewport;
 * size in px. Keep flowers clear of the center card on small screens.
 * ──────────────────────────────────────────────────────────── */
export interface GardenFlower {
  id: string;
  type: FlowerType;
  x: number; // % of viewport width
  y: number; // % of viewport height
  size: number; // px
  z: "front" | "back";
  rotate?: number; // deg
  /** If false the flower is pure decoration (not pickable). Default true. */
  pickable?: boolean;
}

export const GARDEN_FLOWERS: GardenFlower[] = [
  // top-left corner — peeking in (top-RIGHT is reserved for the bouquet)
  { id: "f1", type: "sunflower", x: 9, y: 12, size: 110, z: "front", rotate: -14 },
  { id: "f3", type: "babysBreath", x: 22, y: 7, size: 64, z: "front", rotate: -8 },
  // sides — some drift partially off-screen
  { id: "f4", type: "lily", x: 6, y: 46, size: 92, z: "front", rotate: 8 },
  { id: "f5", type: "cherryRedHibiscus", x: 95, y: 52, size: 104, z: "front", rotate: -10 },
  { id: "f6", type: "smallPink", x: 88, y: 38, size: 52, z: "front", rotate: 16 },
  { id: "f7", type: "babysBreath", x: 16, y: 30, size: 56, z: "back", rotate: 6 },
  // bottom band — the flower bed
  { id: "f8", type: "sunflower", x: 14, y: 86, size: 118, z: "front", rotate: 6 },
  { id: "f9", type: "cherryRedHibiscus", x: 33, y: 91, size: 86, z: "front", rotate: -7 },
  { id: "f10", type: "lilyAlt", x: 52, y: 89, size: 96, z: "front", rotate: 9 },
  { id: "f11", type: "smallPink", x: 68, y: 93, size: 60, z: "front", rotate: -12 },
  { id: "f12", type: "babysBreath", x: 84, y: 88, size: 70, z: "front", rotate: 14 },
  // second real lily, top-right area
  { id: "f15", type: "lilyAlt", x: 70, y: 9, size: 78, z: "front", rotate: 12 },
  // tucked behind the card, barely visible — depth
  { id: "f13", type: "sunflower", x: 60, y: 16, size: 90, z: "back", rotate: 10, pickable: false },
  { id: "f14", type: "cherryRedHibiscus", x: 40, y: 68, size: 72, z: "back", rotate: -16, pickable: false },
];

/** Per-type metadata (names show up as aria-labels + tooltips). */
export const FLOWER_TYPES: Record<FlowerType, { name: string }> = {
  cherryRedHibiscus: { name: "Cherry Red Flower" },
  sunflower: { name: "Sunflower" },
  lily: { name: "Lily" },
  lilyAlt: { name: "Blue Lily" },
  babysBreath: { name: "Baby's Breath" },
  smallPink: { name: "Small Pink Flower" },
};

/** Cutesy handwritten vibe for each 24h hour — shown under the clock. */
export const TIME_VIBES: Record<string, string> = {
  "0": "midnight mission 🌙",
  "1": "the stars are out ✨",
  "2": "very sneaky hours 🌚",
  "3": "cosmically late 🛸",
  "4": "unhinged but romantic 🌌",
  "5": "sunrise romance 🌅",
  "6": "early bird special 🐦",
  "7": "breakfast date 🥞",
  "8": "proper morning ☕",
  "9": "brunch o'clock 🥐",
  "10": "late-morning stroll 🌼",
  "11": "almost lunch 🍱",
  "12": "lunch is sacred 🍝",
  "13": "siesta energy 😴",
  "14": "post-lunch wander ☀️",
  "15": "café hour 🧁",
  "16": "golden hour 🌇",
  "17": "magic hour, literally ✨",
  "18": "dinner-ish, perfect 🌙",
  "19": "evening glow 🏮",
  "20": "night owl special 🦉",
  "21": "city lights 🌃",
  "22": "stargazing hours 🌌",
  "23": "one last adventure 🌙",
};

/** Playful handwritten notes under specific dates — add "YYYY-MM-DD": "note" pairs. */
export const DATE_NOTES: Record<string, string> = {};

/* ─────────────────────── ACTIVITY PICKER ──────────────────────
 * She picks the MAIN activity for the date. Hovering a card
 * (or tapping it on touch) peeks the "photo", what we'd do there
 * + a Google Maps link for the real spot.
 *
 * `image`: optional real photo — drop a file into client/public and
 * set the path here (e.g. "/assets/activities/arcade.png"). While
 * empty, the placeholder `emoji` shows on the pastel `color`.
 * ─────────────────────────────────────────────────────────── */
export interface ActivityOption {
  id: string;
  name: string;
  /** What we'd do there — shown when she peeks at the card. */
  description: string;
  /** Real photo path under client/public. Empty string = placeholder. */
  image: string;
  /** Placeholder emoji shown until a real `image` is set. */
  emoji: string;
  /** Pastel backdrop color for the placeholder "photo". */
  color: string;
  /** Short area label shown with the map link in the peek popup. Optional. */
  place?: string;
  /** Google Maps link — opens in a new tab from the peek popup. Optional. */
  location?: string;
}

/** Google Maps search link — lands on the pin for this address. */
const mapsLink = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: "aquarium",
    name: "Aquarium",
    description: "jellyfish tunnel + gift shop souvenirs",
    image: "/assets/activities/aquarium.jpg",
    emoji: "🐠",
    color: "#bfe3e0",
    place: "J.C.Nagar, Bengaluru",
    location: mapsLink(
      "Jayamahal Main Rd, opposite TV Tower, J.C.Nagar, Bengaluru, Karnataka 560006",
    ),
  },
  {
    id: "arcade",
    name: "Arcade & bowling",
    description: "air hockey, bowling + loser buys tiramisu",
    image: "/assets/activities/arcade.jpg",
    emoji: "🎳",
    color: "#f7d774",
    place: "Church St, Bengaluru",
    location: mapsLink(
      "Amoeba complex, 22, Church St, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
    ),
  },
  {
    id: "diy",
    name: "DIY workshop",
    description: "paint your own mugs at dyu art cafe — zero talent required",
    image: "/assets/activities/diy.jpg",
    emoji: "🎨",
    color: "#f3c4cd",
    place: "Koramangala 8th Block",
    location: mapsLink(
      "Dyu Art Cafe, KHB MIG Colony, 23, 22, 1st Cross Rd, Koramangala 8th Block, Koramangala, Bengaluru, Karnataka 560095",
    ),
  },
  {
    id: "museum",
    name: "National museum of art",
    description: "fancy art + pretending we understand it",
    image: "/assets/activities/museum.jpg",
    emoji: "🖼️",
    color: "#dcd1f0",
    place: "Palace Rd, Vasanth Nagar",
    location: mapsLink(
      "Manikyavelu Mansion, 49, Palace Rd, Vasanth Nagar, Bengaluru, Karnataka 560052",
    ),
  },
  {
    id: "ballin",
    name: "Fuck it we ball",
    description: "let's see where the road takes us",
    image: "",
    emoji: "🛣️",
    color: "#cdeccb",
  },
];

export function getActivityOption(id: string): ActivityOption | undefined {
  return ACTIVITY_OPTIONS.find((a) => a.id === id);
}

/* ─────────────────── FREE CALENDAR LIMITS ───────────────────
 * She can pick ANY day — weekdays, weekends, whatever works.
 * These just keep the browsable range sane.
 * ──────────────────────────────────────────────────────────── */
export const CALENDAR_START = { year: 2026, month: 9 }; // month 1–12
export const CALENDAR_MIN_DATE: string | null = "2026-09-14";
export const CALENDAR_MAX_DATE: string | null = "2027-12-31";
export const CALENDAR_MAX_MONTHS_AHEAD = 18;

/* ─────────────────── NO LOOP (sequential) ──────────────────
 * Each click of "no" advances ONE stage — one message at a time,
 * in this order. `sticker` picks who does the begging:
 * "kuromi" | "fatahh" | "pompompurin". After the last stage comes
 * the respectful close (COPY.noRespect).
 * ──────────────────────────────────────────────────────────── */
export interface NoStage {
  message: string;
  /** Optional small line under the message (e.g. fatahh's). */
  subtitle?: string;
  sticker: "kuromi" | "fatahh" | "pompompurin";
  /** Label for the YES button. Default "okay fine 💗". */
  yes?: string;
  /** Label for the NO button. Default "no". */
  no?: string;
}

export const NO_STAGES: NoStage[] = [
  {
    message: "i'll make you laugh",
    sticker: "kuromi",
  },
  {
    message: "i'll get you tiramisu",
    sticker: "kuromi",
  },
  {
    message: "i'll try my best not to giggle a lot when i see you",
    subtitle: "i didn't forget about fatahh",
    sticker: "fatahh",
  },
];

/* ──────────────────────────── COPY ──────────────────────────── */

export const COPY = {
  opening: {
    title: `${INVITEE_NAME},`,
    subtitle: "I've been waiting a long time to ask you this",
    question: "Do you wanna go on a date with me?",
    yes: "yes ",
    no: "no",
    hint: "click on no a few times, i've added some easter eggs",
    /** Shown under the corner bouquet. */
    bouquetLabel: "for you 🤍",
  },
  noRespect: {
    title: "okay okay 😭",
    body: "I respect the decision.\n\n…but you're still very cute.\n\nThe offer doesn't expire, by the way.",
    close: "close",
  },
  yesBurst: {
    title: "IT'S A DATE 💗",
    subtitle: "wait— really?? okay okay. pick a day:",
    continue: "let's plan it →",
  },
  planning: {
    title: "Pick a day",
    calendarLabel: "the calendar",
    note: "every free day is a real offer. no tricks.",
    timeTitle: "and a time",
    timeNote: "(I'll be early, obviously)",
    activityTitle: "and the important part —",
    activityHeading: "what are we doing?",
    activityNote: "peek before you pick 👀",
  },
  confirmation: {
    title: "Your date with Roshan 🌻",
    dateLabel: "the day",
    timeLabel: "the time",
    activityLabel: "the main activity",
    activityNote: "this is just the main activity — i make the rest of the plan 😌",
    confirm: "confirm date 💌",
    edit: "wait, change it",
    note: "one tap and it's officially official",
  },
  final: {
    title: "It's a date. 🌻",
    names: `${INVITEE_NAME} × ${INVITER_NAME}`,
    closing: "I'll see you then. 💗",
    ps: "P.S. (I ain't splitting the bill, just so you know.)",
    activityNote: "this is just the main activity — i make the rest of the plan 😌",
    calendar: "add to google calendar 📅",
    pdf: "keep the invitation forever 💌 (pdf)",
    ics: "download calendar file 🗓",
    whatsapp: `message ${INVITER_NAME} 💌`,
  },
} as const;

/* ────────────────────────── CALENDAR ────────────────────────── */

/** Duration of the date in minutes (used for calendar events + .ics). */
export const EVENT_DURATION_MINUTES = 120;

export const CALENDAR_EVENT = {
  title: `${INVITEE_NAME} & ${INVITER_NAME}'s Little Date 🌻`,
  description: [
    "A very important appointment.",
    "Attendance strongly encouraged. 🌻",
    "",
    "(yes, there was a whole website)",
  ].join("\n"),
};

/* ──────────────────────────── EMAIL ─────────────────────────── */

export const EMAIL = {
  /** Where the "IT'S OFFICIAL" email lands. Usually Roshan. */
  notifyEmail: "", // e.g. "roshan@example.com" — leave empty to skip
  /** Optional copy to Sakshi. Leave empty to skip. */
  inviteeEmail: "",
  subject: `Date with ${INVITER_NAME} 💗`,
  buildBody: (datePretty: string, timePretty: string, activityName?: string | null) =>
    [
      "IT'S OFFICIAL 🌻",
      "",
      `${INVITEE_NAME} has picked:`,
      datePretty,
      timePretty,
      ...(activityName
        ? [
            `main activity: ${activityName}`,
            "(this is just the main activity — i make the rest of the plan 😌)",
          ]
        : []),
      "",
      "See you then 💗",
    ].join("\n"),
};

/* ─────────────────────────── WHATSAPP ───────────────────────── */

export const WHATSAPP = {
  /** International format, digits only. Empty string hides the button. */
  phone: "", // e.g. "919999999999"
  message: "hehe okay it's a date 😛",
};

/* ───────────────────────── FEATURE TOGGLES ──────────────────── */

export const FEATURES = {
  /** Server-side Google Calendar push (requires Roshan's one-time OAuth). */
  googleCalendarPush: true,
  /** Pre-filled Google Calendar link — always available, zero auth. */
  googleCalendarLink: true,
  /** .ics file download fallback. */
  icsDownload: true,
  /** Keepsake invitation PDF download. */
  pdfDownload: true,
  /** WhatsApp button on the final screen. */
  whatsapp: true,
  /** Confirmation email via the configured provider. */
  email: true,
  /** Little clickable discoveries scattered around. */
  easterEggs: true,
  /** Let her pick the main activity (with peek cards) on the planning screen. */
  activityPicker: true,
  /** Floating petals + sways (auto-disabled under prefers-reduced-motion). */
  petals: true,
} as const;

