// Seasonal decor. Sets data-season on <body> (autumn, halloween, winter, christmas); style.css
// shows or hides the decor by it. This file draws the bits that are generated: the maple-leaf
// garland and the string lights over the window, and the leaves drifting past outside.
// Preview with ?season=christmas (any other value, e.g. ?season=off, shows no decor).
// svg() and INK come from office.js, WIN, rand and preview from sky.js, which load first. The leaf shape (#maple) is defined in index.html.
const LEAF_COLORS = ["#e07a5f", "#f4a259", "#c8553d", "#f2cc8f"];
const LIGHT_COLORS = ["#e63946", "#f6c25e", "#6fcf97", "#6ab7ff"];

function currentSeason(now) {
  const month = now.getMonth() + 1;
  // Halloween decor starts in late September, as it does in Japan
  if ((month === 9 && now.getDate() >= 25) || month === 10) return "halloween";
  // Christmas decor comes down on the 26th; plain winter (just the lights) lasts to the end of February
  if (month === 12 && now.getDate() <= 25) return "christmas";
  if (month === 12 || month <= 2) return "winter";
  return month >= 9 && month <= 11 ? "autumn" : "";
}

function updateSeason() {
  const season = preview.get("season") ?? currentSeason(new Date());
  if (season) document.body.dataset.season = season;
  else delete document.body.dataset.season;
}

function buildSeason() {
  // the garland sags in a curve across the top of the window, a leaf every so often
  const garland = document.getElementById("garland");
  const [x0, y0, cx, cy, x1, y1] = [36, 10, 129, 27, 222, 10];
  svg("path", { d: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, fill: "none", stroke: INK, "stroke-width": 0.8 }, garland);
  const count = 11;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    // fill and stroke sit on the group so style.css can recolour the leaf for Halloween
    const leaf = svg("g", {
      class: "garland-leaf", fill: LEAF_COLORS[i % LEAF_COLORS.length], stroke: INK, "stroke-width": 0.35, "stroke-linejoin": "round",
      transform: `translate(${x.toFixed(1)} ${(y + 3).toFixed(1)}) rotate(${i % 2 ? 165 : 195}) scale(1.4)`,
    }, garland);
    svg("use", { href: "#maple" }, leaf);
    svg("use", { href: "#maple-veins" }, leaf);
  }

  // winter: string lights follow the same sagging curve as the garland, bulbs twinkling out of step
  const lights = document.getElementById("lights");
  svg("path", { d: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, fill: "none", stroke: INK, "stroke-width": 0.6 }, lights);
  const bulbs = 14;
  for (let i = 0; i < bulbs; i++) {
    const t = (i + 0.5) / bulbs;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const bulb = svg("g", { class: "light-bulb", style: `--d: ${(-(i * 0.37) % 1.8).toFixed(2)}s; --i: ${i}` }, lights);
    svg("path", { d: `M${x.toFixed(1)} ${y.toFixed(1)} v1.2`, stroke: INK, "stroke-width": 0.5 }, bulb);
    svg("ellipse", {
      cx: x.toFixed(1), cy: (y + 2.6).toFixed(1), rx: 1.1, ry: 1.5,
      fill: LIGHT_COLORS[i % LIGHT_COLORS.length], stroke: INK, "stroke-width": 0.35,
    }, bulb);
  }

  // each leaf is drawn twice, one window-height apart, so the falling layer loops seamlessly
  const fall = document.querySelector(".leaf-fall");
  for (let i = 0; i < 16; i++) {
    const x = rand(WIN.x, WIN.x + WIN.w);
    const y = rand(WIN.y, WIN.y + WIN.h);
    const turn = rand(0, 360).toFixed(0);
    const scale = rand(0.45, 0.85).toFixed(2);
    const fill = LEAF_COLORS[i % LEAF_COLORS.length];
    for (const dy of [0, -WIN.h]) {
      svg("use", { href: "#maple", fill, transform: `translate(${x.toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${turn}) scale(${scale})` }, fall);
    }
  }
}

buildSeason();
updateSeason();
setInterval(updateSeason, 10 * 60 * 1000);
