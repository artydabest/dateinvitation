/**
 * End-to-end smoke test via headless Chrome (CDP). No deps — Node 24 WebSocket.
 * Usage: node scripts/smoke.mjs   (dev server must be running on :5173)
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";
const PORT = 9223;
const W = Number(process.argv[2] ?? 1280);
const H = Number(process.argv[3] ?? 900);
const SHOT_DIR = "smoke";

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(tmpdir(), `chrome-smoke-${Date.now()}`)}`,
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${W},${H}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) throw new Error("chrome did not start");

  const tab = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: "PUT" })
  ).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error("ws failed"));
  });

  let msgId = 0;
  const pending = new Map();
  const consoleErrors = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    } else if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(
        "EXCEPTION: " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text),
      );
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++msgId;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send("Runtime.enable");
  await send("Page.enable");

  const evalJs = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) {
      throw new Error("eval failed: " + (r.result.exceptionDetails.exception?.description ?? "?"));
    }
    return r.result?.result?.value;
  };
  const shot = async (name) => {
    mkdirSync(SHOT_DIR, { recursive: true });
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(SHOT_DIR, `${name}.png`), Buffer.from(r.result.data, "base64"));
  };
  const clickBtn = (text, { scope = "document", exact = false } = {}) =>
    evalJs(
      `(() => { const s = ${scope === "dialog" ? `document.querySelector('[role="dialog"]') ?? document` : "document"};
        const want = ${JSON.stringify(text)}.toLowerCase();
        const b = [...s.querySelectorAll('button, a')]
          .filter(el => el.offsetParent !== null)
          .find(el => { const t = el.textContent.trim().toLowerCase(); return ${exact ? "t === want" : "t.includes(want)"}; });
        if (!b) return "NOT FOUND: " + ${JSON.stringify(text)};
        b.click(); return "clicked: " + b.textContent.trim().slice(0, 50); })()`,
    );

  const report = [];
  const check = (name, ok, extra = "") => report.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  const bodyHas = (t) => evalJs(`document.body.innerText.includes(${JSON.stringify(t)})`);

  await sleep(2500);
  check("opening screen renders", await bodyHas("Do you wanna go on a date"));
  const flowers = await evalJs(`document.querySelectorAll('button[aria-label^="pick the"]').length`);
  check("garden flowers pickable", flowers > 0, `${flowers} flowers`);
  await shot("1-opening");

  // pick a flower for the bouquet
  await evalJs(`document.querySelector('button[aria-label^="pick the"]')?.click()`);
  await sleep(900);

  console.log(await clickBtn("yes"));
  await sleep(1200);
  check("celebration screen", await bodyHas("IT'S A DATE"));
  await shot("2-celebration");

  console.log(await clickBtn("let's plan"));
  await sleep(1200);
  check("planning screen", await bodyHas("Pick a day"));

  const days = await evalJs(`document.querySelectorAll('.cal-day').length`);
  const enabledDays = await evalJs(`[...document.querySelectorAll('.cal-day')].filter(b => !b.disabled).length`);
  check("calendar days rendered", days > 0, `${days} total, ${enabledDays} enabled`);
  await evalJs(`[...document.querySelectorAll('.cal-day')].find(b => !b.disabled)?.click()`);
  await sleep(700);

  check("time section present", await bodyHas("and a time"));
  const pills = await evalJs(
    `[...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /AM|PM/.test(t))`,
  );
  check("time pills rendered", Array.isArray(pills) && pills.length > 0, (pills ?? []).join(" | "));
  const pillBox = await evalJs(
    `(() => { const el = [...document.querySelectorAll('button')].find(b => /AM|PM/.test(b.textContent));
      if (!el) return null; const r = el.getBoundingClientRect();
      return { visible: !!el.offsetParent, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })()`,
  );
  check("time pill visible", !!pillBox?.visible && (pillBox?.w ?? 0) > 0, JSON.stringify(pillBox));
  const fold = await evalJs(
    `(() => { const el = [...document.querySelectorAll('button')].find(b => /AM|PM/.test(b.textContent));
      if (!el) return null; const r = el.getBoundingClientRect();
      return { belowFold: r.top > window.innerHeight, vh: window.innerHeight, pillTop: Math.round(r.top) }; })()`,
  );
  check("time pill above the fold", !fold?.belowFold, JSON.stringify(fold));
  await shot(`3-planning-${W}x${H}`);

  if (pills?.length) {
    console.log(await clickBtn(pills[0]));
    await sleep(500);
    const picked = await evalJs(`document.body.innerText.includes("look at our date")`);
    console.log("time picked, continue button state:", picked ? "enabled text" : "still disabled");
  }
  const contState = await evalJs(
    `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('look at our date'));
      return b ? (b.disabled ? "DISABLED" : "enabled") : "missing"; })()`,
  );
  check("continue enabled after day+time", contState === "enabled", contState);

  console.log(await clickBtn("look at our date"));
  await sleep(1300);
  check("confirmation screen", await bodyHas("confirm date"));
  await shot("4-confirmation");

  console.log(await clickBtn("confirm"));
  await sleep(2500);
  check("final screen", (await bodyHas("splitting the bill")) || (await bodyHas("It's a date")));
  const recap = await evalJs(`document.body.innerText.includes("the flowers you picked")`);
  check("bouquet recap on final", recap === true);
  await shot("5-final");

  // ── NO loop on a fresh load: click the DIALOG's own "no" button ──
  await evalJs(`location.reload()`);
  await sleep(2200);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    // the overlay blocks the main button — click inside the dialog when it's open
    const hasDialog = await evalJs(`!!document.querySelector('[role="dialog"]')`);
    let r = await clickBtn("no", { exact: true, scope: hasDialog ? "dialog" : "document" });
    if (hasDialog && r.startsWith("NOT FOUND")) r = await clickBtn("close", { scope: "dialog" });
    await sleep(800);
    const dialog = await evalJs(
      `(document.querySelector('[role="dialog"]')?.innerText ?? "NO DIALOG").split("\\n").slice(0, 4).join(" / ")`,
    );
    seen.push(`#${i + 1} ${r} → ${dialog}`);
    if (dialog === "NO DIALOG") {
      // respect-close shown; close it and continue from the main screen
      console.log(await clickBtn("close"));
      await sleep(500);
    }
  }
  console.log("\nNO loop:");
  seen.forEach((s) => console.log("  " + s.slice(0, 160)));
  await shot("6-no-loop");

  console.log("\n=== console errors ===");
  console.log(consoleErrors.length ? consoleErrors.map((e) => e.slice(0, 300)).join("\n") : "(none)");
  console.log("\n=== report ===");
  report.forEach((r) => console.log(r));
} finally {
  try {
    rmSync(join(tmpdir(), "chrome-smoke"), { recursive: true, force: true });
  } catch {}
  chrome.kill();
}
