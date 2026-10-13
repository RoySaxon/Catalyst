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
const PASTES = ["bog", "easy", "fibre", "gpaste", "pbond", "vbond", "ua", "mma", "fair"];

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
  return { status: $("status").textContent, status_cls: $("status").className, ratio: $("pct").textContent, cells,
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
  ["Easy Composites GP, 23 °C, 1%", { p: "ortho", h: "m50", t: 23, pct: 1 }, "Gel time", 20],
  ["Easy Composites GP, 23 °C, 1.25% (known outlier: Silpak gives 15 min here)", { p: "ortho", h: "m50", t: 23, pct: 1.25 }, "Gel time", 13, 0.3],
  ["Easy Composites GP, 23 °C, 1.5%", { p: "ortho", h: "m50", t: 23, pct: 1.5 }, "Gel time", 12],
  ["Easy Composites GP, 23 °C, 1.75%", { p: "ortho", h: "m50", t: 23, pct: 1.75 }, "Gel time", 11],
  ["Easy Composites GP, 23 °C, 2%", { p: "ortho", h: "m50", t: 23, pct: 2 }, "Gel time", 10],
  ["Silpak SLR-22, 25 °C, 1.25%", { p: "ortho", h: "m50", t: 25, pct: 1.25 }, "Gel time", 15],
  ["Easy Composites IP2, 20 °C, 1%", { p: "inf", h: "m50", t: 20, pct: 1 }, "Gel time", 85],
  ["Easy Composites IP2, 20 °C, 2%", { p: "inf", h: "m50", t: 20, pct: 2 }, "Gel time", 48],
  ["Crestomer 1152PA, 25 °C, 2%", { p: "ua", h: "m50", t: 25 }, "Gel time", 50],
  ["Mipa P50 filler, 20 °C, 2% (TDS 4 to 5 min)", { p: "bog", t: 20, pct: 2 }, "Gel time", 4.5],
  ["West 205, 22 °C (TDS 9 to 12 min)", { p: "epoxy", h: "w205", t: 22, b: 83 }, "Pot life in the cup", 10.5],
  ["West 209, 22 °C (TDS 40 to 50 min)", { p: "epoxy", h: "w209", t: 22, b: 75 }, "Pot life in the cup", 45],
  ["West 209, 35 °C (TDS 15 to 20 min)", { p: "epoxy", h: "w209", t: 35, b: 75 }, "Pot life in the cup", 17.5],
  ["Crestabond M1-05, 22 °C (TDS 4 to 7 min)", { p: "mma", h: "mma5", t: 22 }, "Working time", 5.5]
];
for (const [name, c, cell, val, tol = 0.2] of ref) {
  const r = run(c); within(name, minutes(r.cells[cell]), +(val * (1 - tol)).toFixed(1), +(val * (1 + tol)).toFixed(1));
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
