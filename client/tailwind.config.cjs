/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf5ee",
        paper: "#fffdf8",
        blush: "#f6d7dd",
        blushdeep: "#e9aebc",
        powder: "#bcd6ea",
        powderdeep: "#8fb8d8",
        cherry: "#c8102e",
        cherriesoft: "#e26d7f",
        leaf: "#7a9471",
        moss: "#5f7358",
        ink: "#433528",
        cocoa: "#6b5744",
        // pompompurin-inspired warm yellow, used sparingly
        custard: "#f7d774",
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        hand: ['"Caveat"', "cursive"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        tape: "0 1px 3px rgba(67,53,40,0.08)",
        card: "0 2px 10px rgba(67,53,40,0.07)",
        lift: "0 6px 18px rgba(67,53,40,0.12)",
      },
      keyframes: {
        sway: {
          "0%, 100%": { transform: "rotate(-2.5deg)" },
          "50%": { transform: "rotate(2.5deg)" },
        },
        "sway-slow": {
          "0%, 100%": { transform: "rotate(-1.5deg) translateY(0)" },
          "50%": { transform: "rotate(1.5deg) translateY(-4px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        sway: "sway 7s ease-in-out infinite",
        "sway-slow": "sway-slow 11s ease-in-out infinite",
        bob: "bob 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
