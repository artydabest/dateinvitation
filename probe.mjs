/** Temporary CDP probe — the "no" easter-egg loop. Delete after use. */
const DEBUG = "http://localhost:9222";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const res = await fetch(`${DEBUG}/json/new?url=about:blank`, { method: "PUT" });
  const tab = await res.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (m, p = {}) =>
    new Promise((res2, rej) => {
      const mid = ++id;
      pending.set(mid, { res: res2, rej });
      ws.send(JSON.stringify({ id: mid, method: m, params: p }));
    });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res: r, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : r(msg.result);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  await send("Runtime.enable");
  const evaluate = async (expression) => {
    const out = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return out.result?.value;
  };
  const tap = async (x, y) => {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  };

  await send("Page.navigate", { url: "http://localhost:5173/" });
  await sleep(5000);

  // click "no" → popup 1
  const noBtn = await evaluate(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.className.includes("btn-ghost") && x.textContent.trim() === "no");
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  })()`);
  await tap(noBtn.cx, noBtn.cy);
  await sleep(800);
  console.log("popup after no:", await evaluate(`document.querySelector("[role='dialog']")?.innerText.split("\\n").slice(0, 4).join(" | ")`));

  // insist "no" twice more → stage 3 (fatahh), then once more → respectful close
  for (let i = 0; i < 3; i++) {
    const g = await evaluate(`(() => {
      const btns = [...document.querySelectorAll("[role='dialog'] button")];
      const b = btns.find((x) => x.textContent.trim() === "no");
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()`);
    if (!g) { console.log("no more 'no' buttons (respectful close?) at iteration", i); break; }
    await tap(g.cx, g.cy);
    await sleep(700);
  }
  console.log("final popup text:", await evaluate(`document.querySelector("[role='dialog']")?.innerText.split("\\n").slice(0, 4).join(" | ")`));

  // the respectful close should still offer a way back — close it
  const close = await evaluate(`(() => {
    const b = [...document.querySelectorAll("[role='dialog'] button")].find((x) => x.textContent.includes("close"));
    const r = b.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  })()`);
  await tap(close.cx, close.cy);
  await sleep(600);
  console.log("back on opening, no popup:", !(await evaluate(`Boolean(document.querySelector("[role='dialog']"))`)));

  // now say yes from the popup path: open popup again, then "okay fine 💗"
  await tap(noBtn.cx, noBtn.cy);
  await sleep(600);
  const fine = await evaluate(`(() => {
    const b = [...document.querySelectorAll("[role='dialog'] button")].find((x) => x.textContent.includes("okay fine"));
    const r = b.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  })()`);
  await tap(fine.cx, fine.cy);
  await sleep(1500);
  console.log("gave in → screen:", await evaluate(`document.querySelector("main section")?.getAttribute("aria-labelledby")`));

  ws.close();
}

main().catch((e) => {
  console.error("PROBE FAILED:", e.message);
  process.exit(1);
});
