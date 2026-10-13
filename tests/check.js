// Regression suite for the calculator. Run: npm install && npm test
// Each reference case compares the app's output with a published figure.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8")
  .replace(/<script>\s*if\("serviceWorker"[\s\S]*?<\/script>/, "");
const dom = new JSDOM(html, { runScripts: "dangerously" });
const w = dom.window, d = w.document, $ = id => d.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
const PASTES = ["bog", "easy", "fibre", "gpaste", "pbond", "vbond", "ua", "mma", "fair", "fairo"];

function run(c) {
  $("tab-" + (PASTES.includes(c.p) ? "paste" : "resin")).click();
  const pr = $("prod-" + c.p); pr.checked = true; fire(pr, "change");
  if (c.h) { const hr = $("hard-" + c.h); hr.checked = true; fire(hr, "change"); }
  for (const [k, v] of [["tdsPct", c.tdsPct ?? ""], ["tdsT", c.tdsT ?? ""], ["tdsGel", ""]]) { $(k).value = v; fire($(k), "input"); }
  for (const [id, v] of [["temp", c.t ?? 25], ["rh", c.rh ?? 55], ["batch", c.b ?? 100]]) { $(id).value = v; fire($(id), "input"); }
  $("unit").value = c.u ?? "g"; fire($("unit"), "change");
  $("pctReset").click();
  if (c.pct != null) { $("pctR").value = c.pct; fire($("pctR"), "input"); }
  const cells = Object.fromEntries([...d.querySelectorAll("#amounts div")].map(x =>
    [x.querySelector("dt").childNodes[0].textContent.trim(), x.querySelector("dd").childNodes[0].textContent.trim()]));
  const hero = $("hero").dataset;
  return { gel: +(+hero.gel).toFixed(1), work: +(+hero.work).toFixed(1), heroNum: $("heroNum").textContent, status: $("status").textContent, status_cls: $("status").className, ratio: $("pct").textContent, cells,
    hard: [...d.querySelectorAll("#hardeners input")].map(x => x.value) };
}
const minutes = s => { const h = /(\d+) h(?: (\d+))?/.exec(s); if (h) return +h[1] * 60 + +(h[2] || 0); return parseFloat(s); };
const grams = s => parseFloat(s.replace(/,/g, ""));

let pass = 0, fail = 0;
const ok = (name, cond, detail) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };

// Disclaimer shows on first open and closes on acceptance
ok("Disclaimer shown on first open", $("terms").hidden === false);
$("acceptTerms").click();
ok("Disclaimer closes when accepted", $("terms").hidden === true);
const within = (name, got, lo, hi) => ok(name, got >= lo && got <= hi, `got ${got}, accept ${lo} to ${hi}`);

// Published reference figures. Tolerance: 20% either side, the spread seen between brands.
const ref = [
  ["Easy Composites GP, 23 °C, 1%", { p: "ortho", h: "m50", t: 23, pct: 1 }, "Typical gel time", 20],
  ["Easy Composites GP, 23 °C, 1.25% (known outlier: Silpak gives 15 min here)", { p: "ortho", h: "m50", t: 23, pct: 1.25 }, "Typical gel time", 13, 0.3],
  ["Easy Composites GP, 23 °C, 1.5%", { p: "ortho", h: "m50", t: 23, pct: 1.5 }, "Typical gel time", 12],
  ["Easy Composites GP, 23 °C, 1.75%", { p: "ortho", h: "m50", t: 23, pct: 1.75 }, "Typical gel time", 11],
  ["Easy Composites GP, 23 °C, 2%", { p: "ortho", h: "m50", t: 23, pct: 2 }, "Typical gel time", 10],
  ["Silpak SLR-22, 25 °C, 1.25%", { p: "ortho", h: "m50", t: 25, pct: 1.25 }, "Typical gel time", 15],
  ["Easy Composites IP2, 20 °C, 1%", { p: "inf", h: "m50", t: 20, pct: 1 }, "Typical gel time", 85],
  ["Easy Composites IP2, 20 °C, 2%", { p: "inf", h: "m50", t: 20, pct: 2 }, "Typical gel time", 48],
  ["Crestomer 1152PA, 25 °C, 2%", { p: "ua", h: "m50", t: 25 }, "Typical gel time", 50],
  ["Mipa P50 filler, 20 °C, 2% (TDS 4 to 5 min)", { p: "bog", t: 20, pct: 2 }, "Typical gel time", 4.5],
  ["West 205, 22 °C (TDS 9 to 12 min)", { p: "epoxy", h: "w205", t: 22, b: 83 }, "Typical pot life", 10.5],
  ["West 209, 22 °C (TDS 40 to 50 min)", { p: "epoxy", h: "w209", t: 22, b: 75 }, "Typical pot life", 45],
  ["West 209, 35 °C (TDS 15 to 20 min)", { p: "epoxy", h: "w209", t: 35, b: 75 }, "Typical pot life", 17.5],
  ["Crestabond M1-05, 22 °C (TDS 4 to 7 min)", { p: "mma", h: "mma5", t: 22 }, "Typical working time", 5.5]
];
for (const [name, c, cell, val, tol = 0.2] of ref) {
  const r = run(c); within(name, cell === "Typical gel time" ? r.gel : r.work, +(val * (1 - tol)).toFixed(1), +(val * (1 + tol)).toFixed(1));
}

// Arithmetic: catalyst weight = batch x ratio
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 15; i++) {
  const b = Math.round(10 + rnd() * 9990), pct = Math.round((0.8 + rnd() * 2.2) * 20) / 20;
  const r = run({ p: "ortho", h: "m50", t: 22, b, pct });
  const exp = b * pct / 100, got = grams(r.cells["Weight"]);
  ok(`MEKP weight for ${b} g at ${pct}%`, Math.abs(got - exp) <= (exp < 100 ? 0.051 : 0.51), `got ${got}, expected ${exp.toFixed(2)}`);
}

// Unit consistency: 1 L and the equivalent kg give the same catalyst
{
  const a = run({ p: "ortho", h: "m50", t: 22, b: 1, u: "L" }), b = run({ p: "ortho", h: "m50", t: 22, b: 1.1, u: "kg" });
  ok("1 L ortho equals 1.1 kg ortho", a.cells["Weight"] === b.cells["Weight"], `${a.cells["Weight"]} vs ${b.cells["Weight"]}`);
}
// Validation and safety logic
ok("Zero batch is refused", run({ p: "ortho", h: "m50", b: 0 }).status_cls.includes("warn"));
ok("Negative batch is refused", run({ p: "ortho", h: "m50", b: -5 }).status_cls.includes("warn"));
ok("Gelcoat at 12 °C is refused", run({ p: "gelc", h: "n925h", t: 12 }).status_cls.includes("crit"));
ok("Gelcoat at 1% is flagged under-catalysed", run({ p: "gelc", h: "n925h", pct: 1 }).status_cls.includes("crit"));
ok("Ortho at 4% is flagged over-catalysed", run({ p: "ortho", h: "m50", pct: 4 }).status_cls.includes("crit"));
ok("TDS figure does not stretch gelcoat maximum", run({ p: "gelc", h: "n925h", tdsPct: 2.2, tdsT: 25, pct: 3.4 }).status_cls.match(/warn|crit/));
ok("Fillers offer BPO cream only", JSON.stringify(run({ p: "easy" }).hard) === '["bpo"]');
ok("Epoxy offers no peroxides", !run({ p: "epoxy" }).hard.some(h => ["kp9", "m50", "bpo"].includes(h)));
ok("MMA offers its own activators only", run({ p: "mma" }).hard.every(h => h.startsWith("mma")));

// Third review: humidity, data sheet validation, epoxy compatibility, per-system custom values, overlaps
{
  const dry = run({ p: "ortho", h: "m50", t: 25, rh: 50 }).ratio, wet = run({ p: "ortho", h: "m50", t: 25, rh: 95 }).ratio;
  ok("Humidity does not change the catalyst ratio", dry === wet, `${dry} vs ${wet}`);
  const base = run({ p: "ortho", h: "m50", t: 25 }).ratio;
  const noTemp = run({ p: "ortho", h: "m50", t: 25, tdsPct: 2 });
  ok("Data sheet % without temperature is ignored", noTemp.ratio === base && !$("tdsErr").hidden, noTemp.ratio);
  const silly = run({ p: "ortho", h: "m50", t: 25, tdsPct: 0.2, tdsT: 25 });
  ok("Implausible data sheet % is rejected", silly.ratio === base && !$("tdsErr").hidden, silly.ratio);
  ok("West epoxy offers West hardeners only", run({ p: "epoxy" }).hard.every(h => h.startsWith("w")));
  ok("Other epoxy offers data sheet entry only", JSON.stringify(run({ p: "epoxyo" }).hard) === '["epc"]');
  run({ p: "epoxyo" }); $("ratio").value = 42; fire($("ratio"), "input");
  run({ p: "fairo" });
  ok("Custom ratio does not carry to another system", $("ratio").value === "", `field shows "${$("ratio").value}"`);
  run({ p: "epoxyo" });
  ok("Custom ratio is remembered for its own system", $("ratio").value === "42", `field shows "${$("ratio").value}"`);
  ok("Cold plus humid reports the critical status", run({ p: "ortho", h: "m50", t: 10, rh: 90 }).status_cls.includes("crit"));
  ok("Above 35 °C is flagged as beyond the data", run({ p: "ortho", h: "m50", t: 38 }).status_cls.match(/warn|crit/));
}

// Drop-down pickers
{
  run({ p: "ortho", h: "m50" });
  ok("Product list starts folded", $("products").hidden === true);
  $("prodBtn").click();
  ok("Tapping the product card opens the list", $("products").hidden === false);
  const iso = $("prod-iso"); iso.checked = true; fire(iso, "change");
  ok("Choosing a product folds the list", $("products").hidden === true && $("prodBtn").textContent.includes("Iso laminating resin"));
  $("hardBtn").click(); const lpt = $("hard-lpt"); lpt.checked = true; fire(lpt, "change");
  ok("Collapsed hardener shows the name only", $("hardBtn").textContent.trim().replace("▾","").trim() === "Butanox LPT-IN", $("hardBtn").textContent);
  $("hardBtn").click();
  ok("Open hardener list still shows speed and data tags", $("hardeners").textContent.includes("Extra slow") && $("hardeners").textContent.includes("Estimated speed"));
  $("hardBtn").click();
  run({ p: "bog" });
  ok("Single-hardener products do not open a list", ($("hardBtn").click(), $("hardeners").hidden === true));
}

// Working time is the headline
{
  const r = run({ p: "ortho", h: "m50", t: 23, pct: 1 });
  ok("Headline shows working time, about three quarters of gel time", Math.abs(r.work - r.gel * 0.75) < 0.2 && r.heroNum.includes("min"), `${r.heroNum}, gel ${r.gel}`);
  ok("Headline says unreliable when too cold", run({ p: "gelc", h: "n925h", t: 12 }).heroNum === "Unreliable");
  ok("Epoxy headline is cup pot life", run({ p: "epoxy", h: "w205", t: 22, b: 83 }).heroNum === "11 min");
}

// Explainers behind info buttons
{
  run({ p: "ortho", h: "m50", t: 25 });
  ok("Humidity explainer starts hidden", $("rhInfo").hidden === true);
  d.querySelector('[data-for="rhInfo"]').click();
  ok("Info button reveals the humidity explainer", $("rhInfo").hidden === false);
  ok("Background notes start folded", $("infoNotes").hidden === true && $("infoNotes").children.length > 0);
  const cold = run({ p: "gelc", h: "n925h", t: 12 });
  ok("Safety warnings stay visible, not folded", !$("notes").hidden && $("notes").textContent.includes("16 °C"));
  run({ p: "epoxy", h: "w205" });
  ok("Fixed-ratio explanation sits behind an info button", !$("ratioInfoBtn").hidden && $("ratioInfo").hidden);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
