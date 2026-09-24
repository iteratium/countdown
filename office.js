const NS = "http://www.w3.org/2000/svg";
const INK = "#2e2b3f";
const MAX_CATS = 10;
const SPEED = 38;
const FLOOR = { minX: -24, maxX: 302, minY: 132, maxY: 172 };
const COFFEE_SPOT = { x: -19, y: 138 };
const EXIT_X = -64;
const CAT_COLORS = ["#f4a259", "#c9c1b8", "#a8998b", "#f2cc8f", "#e0d5c4", "#a39dbb"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const officeEl = document.getElementById("office");
const sceneEl = document.getElementById("office-scene");
const catsLayer = document.getElementById("office-cats");
const deskLayer = document.getElementById("office-desks");
const hintEl = document.getElementById("hint");
let hintTimer = null;

const desks = [40, 108, 176].map((x) => ({ x, seatY: 134, owner: null, screen: null }));
const seats = [
  { x: 254, y: 142, owner: null },
  { x: 300, y: 142, owner: null },
  { x: 277, y: 156, owner: null },
];
const cats = [];

function svg(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
}

function buildDesks() {
  for (const desk of desks) {
    const g = svg("g", { transform: `translate(${desk.x} 100)` }, deskLayer);
    svg("rect", { x: -3, y: -6, width: 6, height: 6, fill: INK }, g);
    svg("rect", { x: -14, y: -24, width: 28, height: 19, rx: 2, fill: "#fff", stroke: INK, "stroke-width": 2 }, g);
    desk.screen = svg("rect", { x: -11, y: -21, width: 22, height: 13, rx: 1, fill: INK }, g);
    svg("rect", { x: -31, y: 0, width: 62, height: 10, rx: 2, fill: "#c98f5a", stroke: INK, "stroke-width": 2 }, g);
    svg("rect", { x: -27, y: 10, width: 5, height: 14, fill: INK }, g);
    svg("rect", { x: 22, y: 10, width: 5, height: 14, fill: INK }, g);
  }
}

function makeCat(x, y) {
  const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
  const root = svg("g", {}, catsLayer);
  const body = svg("g", {}, root);
  const tail = svg("path", { d: "M-8 -6 Q-22 -6 -17 -22", fill: "none", stroke: INK, "stroke-width": 6, "stroke-linecap": "round" }, body);
  svg("path", { d: "M-8 -6 Q-22 -6 -17 -22", fill: "none", stroke: color, "stroke-width": 3, "stroke-linecap": "round" }, body);
  svg("ellipse", { cx: 0, cy: -7, rx: 9, ry: 8, fill: color, stroke: INK, "stroke-width": 1.5 }, body);
  const face = makeHead(body, color);
  const pawL = svg("ellipse", { cx: -5, cy: -2, rx: 3.5, ry: 2.5, fill: "#fff", stroke: INK, "stroke-width": 1.2 }, body);
  const pawR = svg("ellipse", { cx: 5, cy: -2, rx: 3.5, ry: 2.5, fill: "#fff", stroke: INK, "stroke-width": 1.2 }, body);
  const lunch = makeLunch(body);

  const bubble = makeBubble(root);

  return {
    x, y, tx: x, ty: y, color,
    state: "rest", timer: 1, place: null, bubble, phase: Math.random() * 10, age: 0,
    root, body, tail, face, pawL, pawR, lunch, eating: false, silly: Math.random() < 0.4,
  };
}

// Round head with pointed ears, whiskers and pink cheeks, centred on (0, -22).
// Used by the office cats and the progress-bar walker; returns the face.
function makeHead(parent, color) {
  const outline = { stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" };
  for (const s of [-1, 1]) {
    svg("path", { d: `M${s * 11} -25 L${s * 9} -36 Q${s * 8} -38.5 ${s * 6.2} -36.8 L${s * 1.5} -31 Z`, fill: color, ...outline }, parent);
    svg("path", { d: `M${s * 8.6} -29 L${s * 7.9} -34 L${s * 4.6} -30.8 Z`, fill: "#f4b6a6" }, parent);
  }
  svg("ellipse", { cx: 0, cy: -22, rx: 11.5, ry: 9.5, fill: color, ...outline }, parent);
  svg("path", {
    d: "M-10 -19.5 L-14.5 -20.5 M-10 -17.5 L-14.5 -17 M10 -19.5 L14.5 -20.5 M10 -17.5 L14.5 -17",
    fill: "none", stroke: INK, "stroke-width": 0.7, "stroke-linecap": "round",
  }, parent);
  svg("ellipse", { cx: -7, cy: -18.2, rx: 1.9, ry: 1, fill: "#f08a8a", opacity: 0.55 }, parent);
  svg("ellipse", { cx: 7, cy: -18.2, rx: 1.9, ry: 1, fill: "#f08a8a", opacity: 0.55 }, parent);
  return makeFace(parent);
}

// Doodle expressions: each is its own group of a few bold strokes (eyes, mouth and small
// marks like blush hatching, sweat or tears). They are drawn for a wider head and scaled
// to 80% around the head's centre, so strokes are drawn 1.25x thicker to compensate.
const TEAR = "#bfe3f2";
const PINK = "#f6c3bd";
const EYE_RY = 1.8;

function makeFace(parent) {
  const g = svg("g", { transform: "translate(0 -22) scale(0.8) translate(0 22)" }, parent);
  const stroke = (w = 1.1) => ({ fill: "none", stroke: INK, "stroke-width": w * 1.25, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const looks = {};
  const look = (name) => (looks[name] = svg("g", { display: "none" }, g));
  const line = (el, d, w) => svg("path", { d, ...stroke(w) }, el);

  // eyes; open eyes sit in their own group so blinkFace can squash them shut
  const blinkEyes = [];
  const eyeGroup = (el, cy = -22) => {
    const eye = svg("g", {}, el);
    blinkEyes.push({ g: eye, cy });
    return eye;
  };
  const dotEyes = (el, { xs = [-6.5, 6.5], cy = -22, rx = 1.5, ry = EYE_RY, shine = false } = {}) => {
    for (const cx of xs) {
      const eye = eyeGroup(el, cy);
      svg("ellipse", { cx, cy, rx, ry, fill: INK }, eye);
      if (shine) svg("circle", { cx: cx + rx * 0.35, cy: cy - ry * 0.4, r: rx * 0.38, fill: "#fff" }, eye);
    }
  };
  const smileEyes = (el) => line(el, "M-8.8 -21.2 q2.3 -3.4 4.6 0 M4.2 -21.2 q2.3 -3.4 4.6 0", 1.3);
  const closedEyes = (el) => line(el, "M-8.8 -22.6 q2.3 2.8 4.6 0 M4.2 -22.6 q2.3 2.8 4.6 0", 1.3);
  const squint = (el) => line(el, "M-9 -24.2 L-4.6 -22 L-9 -19.8 M9 -24.2 L4.6 -22 L9 -19.8", 1.3);
  const sparkleEyes = (el, r = 2.9) => {
    for (const cx of [-6.5, 6.5]) {
      const eye = eyeGroup(el);
      svg("circle", { cx, cy: -22, r, fill: INK }, eye);
      svg("circle", { cx: cx + r * 0.35, cy: -22 - r * 0.38, r: r * 0.38, fill: "#fff" }, eye);
      svg("circle", { cx: cx - r * 0.35, cy: -22 + r * 0.4, r: r * 0.17, fill: "#fff" }, eye);
    }
  };
  // mouths
  const omega = (el, s = 1) => line(el, `M${-3.2 * s} -18.6 q${1.6 * s} ${2 * s} ${3.2 * s} 0 q${1.6 * s} ${2 * s} ${3.2 * s} 0`, 1.1);
  const tongue = (el) => svg("path", { d: "M-1.5 -17.8 v1.4 a1.5 1.5 0 0 0 3 0 v-1.4", ...stroke(0.9), fill: PINK }, el);
  const caret = (el) => line(el, "M-1.7 -17.2 L0 -18.9 L1.7 -17.2", 1.1);
  const openMouth = (el, w = 2.6, h = 3.8) =>
    svg("path", { d: `M${-w} -18.8 h${2 * w} q0 ${h} ${-w} ${h} q${-w} 0 ${-w} ${-h} Z`, ...stroke(1), fill: PINK }, el);
  const drool = (el) => line(el, "M2.4 -17.4 q0.6 2.8 0.1 4.4", 0.9);
  // marks
  const hatch = (el, n = 3) => {
    let d = "";
    for (let i = 0; i < n; i++) d += `M${-12.4 + i * 1.5} -16.8 l1.2 -2.4 M${8.4 + i * 1.5} -16.8 l1.2 -2.4 `;
    line(el, d, 0.8);
  };
  const drop = (el, x, y, s = 1) =>
    svg("path", { d: `M${x} ${y} q${-1.7 * s} ${2.6 * s} 0 ${3.6 * s} q${1.7 * s} -1 0 ${-3.6 * s} Z`, ...stroke(0.8), fill: TEAR }, el);
  // a big anime sweat drop on the side of the forehead, with a shine so it reads on any fur
  const sweat = (el, side) => {
    const x = side * 10.4;
    svg("path", { d: `M${x} -31 q-3.3 4.8 0 6.9 q3.3 -2.1 0 -6.9 Z`, ...stroke(0.8), fill: "#7cc4e4" }, el);
    svg("ellipse", { cx: x - 0.8, cy: -26.4, rx: 0.55, ry: 1, fill: "#fff" }, el);
  };
  // anime anger mark: four red corner curves around a centre point
  const vein = (el, cx, cy, r) => {
    const g = r * 0.35;
    const d = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
      .map(([sx, sy]) => `M${cx + sx * r} ${cy + sy * g} Q${cx + sx * g} ${cy + sy * g} ${cx + sx * g} ${cy + sy * r}`)
      .join(" ");
    line(el, d, 1.2).setAttribute("stroke", "#e05a47");
  };
  const sparkle = (el, x, y, r, fill = "none") =>
    svg("path", { d: `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`, ...stroke(0.8), fill }, el);
  const star = (el, cx, cy, R) => {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? R * 0.45 : R;
      d += `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
    }
    svg("path", { d: `${d}Z`, ...stroke(0.6), fill: "#f2cc8f" }, el);
  };
  // anime steam puffs blowing out of both sides of the head
  const steam = (el) => {
    for (const s of [-1, 1]) {
      for (const [dx, dy, r] of [[0, 0, 1.6], [1.8, -1.4, 1.9], [3.6, 0.2, 1.5]]) {
        svg("circle", { cx: s * (15 + dx), cy: -31 + dy, r, ...stroke(0.7), fill: "#fff" }, el);
      }
    }
  };

  let el = look("neutral");
  dotEyes(el);
  omega(el);

  el = look("happy");
  smileEyes(el);
  openMouth(el, 3.4, 4.6);

  el = look("calm");
  closedEyes(el);
  omega(el);

  // dozing: droopy closed eyes with lashes, a nose bubble that swells and shrinks, z z
  el = look("sleepy");
  line(el, "M-9 -21.8 q2.3 1.8 4.6 0 M4.4 -21.8 q2.3 1.8 4.6 0", 1.4);
  line(el, "M-8.4 -21.2 l-0.7 1.1 M-6.7 -20.4 v1.2 M-5 -21.2 l0.7 1.1 M5 -21.2 l-0.7 1.1 M6.7 -20.4 v1.2 M8.4 -21.2 l0.7 1.1", 0.7);
  line(el, "M-2.8 -17.4 q1.4 1.1 2.8 0", 1);
  const bubble = svg("g", { class: "snot-bubble" }, el);
  svg("circle", { cx: 3.6, cy: -17.2, r: 2.6, ...stroke(0.8), fill: "#e8f6fc" }, bubble);
  svg("circle", { cx: 2.8, cy: -18.1, r: 0.6, fill: "#fff" }, bubble);
  line(el, "M15.5 -33 h3 l-3 3 h3 M20 -37.4 h2 l-2 2 h2", 1);

  // laughing XD
  el = look("silly");
  squint(el);
  openMouth(el, 3.8, 5.4);
  line(el, "M-2 -15.2 q2 -1.8 4 0", 0.8);

  // idol wink with a little star
  el = look("wink");
  dotEyes(el, { xs: [-6.5] });
  line(el, "M8.8 -24.2 L4.4 -22 L8.8 -19.8", 1.3);
  omega(el);
  tongue(el);
  sparkle(el, 16.2, -30.4, 3, "#f2cc8f");

  el = look("shy");
  closedEyes(el);
  omega(el, 0.8);
  hatch(el, 5);

  // strained grin with clenched teeth
  el = look("nervous");
  dotEyes(el, { rx: 1.2, ry: 1.5 });
  svg("rect", { x: -3.8, y: -19.4, width: 7.6, height: 2.8, rx: 1, ...stroke(0.9), fill: "#fff" }, el);
  line(el, "M-1.3 -19.2 v2.4 M1.3 -19.2 v2.4", 0.6);
  sweat(el, 1);

  el = look("phew");
  closedEyes(el);
  svg("circle", { cx: 1.2, cy: -18, r: 1, ...stroke(0.9) }, el);
  for (const [cx, cy, r] of [[4.6, -17.2, 1.1], [7.4, -16.2, 1.5], [10.8, -15.4, 1.9]]) {
    svg("circle", { cx, cy, r, ...stroke(0.8), fill: "#fff" }, el);
  }
  sweat(el, -1);

  el = look("unimpressed");
  line(el, "M-9.2 -23 h5.2 M4 -23 h5.2", 1.4);
  svg("circle", { cx: -5.6, cy: -21.6, r: 1.1, fill: INK }, el);
  svg("circle", { cx: 7.4, cy: -21.6, r: 1.1, fill: INK }, el);
  caret(el);

  el = look("annoyed");
  line(el, "M-9.2 -26.2 L-4.4 -24.4 M9.2 -26.2 L4.4 -24.4", 1.3);
  line(el, "M-8.4 -21.8 h3.6 M4.8 -21.8 h3.6", 1.5);
  line(el, "M-2.2 -16.8 q2.2 -2.2 4.4 0", 1.1);
  vein(el, 8.6, -28.9, 2.4);

  // kawaii angry: steep brows, gritted teeth and steam blowing out of the head
  el = look("angry");
  line(el, "M-9.6 -26.6 L-4.2 -23.6 M9.6 -26.6 L4.2 -23.6", 1.5);
  svg("circle", { cx: -6.2, cy: -21.4, r: 1.2, fill: INK }, el);
  svg("circle", { cx: 6.2, cy: -21.4, r: 1.2, fill: INK }, el);
  svg("rect", { x: -4.8, y: -19.8, width: 9.6, height: 4.2, rx: 1.4, ...stroke(1), fill: "#fff" }, el);
  line(el, "M-4.6 -17.7 h9.2 M-2.4 -19.6 v3.8 M0 -19.6 v3.8 M2.4 -19.6 v3.8", 0.6);
  steam(el);

  el = look("amazed");
  sparkleEyes(el);
  line(el, "M-1.8 -18.4 L0 -16.6 L1.8 -18.4", 1.1);
  for (const cx of [-10.4, -8.8, 8.8, 10.4]) svg("circle", { cx, cy: -17.6, r: 0.45, fill: INK }, el);
  sparkle(el, 16.5, -32, 2.6);
  sparkle(el, -16.5, -29, 1.8);

  // hungry: eyes on a thought bubble with a fish, drooling
  el = look("hungry");
  dotEyes(el, { xs: [-5.6, 7.4], cy: -22.8, shine: true });
  openMouth(el);
  drool(el);
  svg("circle", { cx: 12.2, cy: -28.6, r: 0.8, ...stroke(0.6), fill: "#fff" }, el);
  svg("circle", { cx: 14.2, cy: -31.4, r: 1.2, ...stroke(0.6), fill: "#fff" }, el);
  svg("ellipse", { cx: 19, cy: -37, rx: 5.6, ry: 4.2, ...stroke(0.8), fill: "#fff" }, el);
  svg("ellipse", { cx: 19.6, cy: -37, rx: 2.6, ry: 1.5, ...stroke(0.6), fill: "#9fcfe0" }, el);
  svg("path", { d: "M17.1 -37 l-1.9 -1.5 v3 Z", ...stroke(0.6), fill: "#9fcfe0" }, el);
  svg("circle", { cx: 20.9, cy: -37.3, r: 0.35, fill: INK }, el);

  // dizzy: swirl eyes, wobbly mouth, stars circling overhead
  el = look("dizzy");
  // an even spiral (radius grows with angle) winding out from each eye's centre
  for (const cx of [-6.5, 6.5]) {
    const turns = 2;
    const steps = 60;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * turns * 2 * Math.PI;
      const r = (i / steps) * 2.9;
      d += `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(2)} ${(-22 + r * Math.sin(a)).toFixed(2)} `;
    }
    line(el, d, 1);
  }
  line(el, "M-3 -17 q0.75 -1 1.5 0 q0.75 1 1.5 0 q0.75 -1 1.5 0 q0.75 1 1.5 0", 1);
  // two tilted orbit rings circling above the ears, with stars riding on them
  for (const [cy, rx, ry, tilt] of [[-45, 14, 3.4, -6], [-49.5, 9, 2, 6]]) {
    svg("ellipse", {
      class: "dizzy-ring", cx: 0, cy, rx, ry, transform: `rotate(${tilt} 0 ${cy})`, ...stroke(0.7),
    }, el);
  }
  star(el, -13.9, -43.5, 2.1);
  star(el, 8.5, -43.1, 1.8);
  star(el, 8.9, -48.6, 1.4);

  // determined: confident brows, firm smile, a flame of fighting spirit
  el = look("determined");
  line(el, "M-9.4 -25.2 L-4.4 -24 M9.4 -25.2 L4.4 -24", 1.5);
  dotEyes(el, { cy: -21.6, rx: 2.2, ry: 2.2, shine: true });
  line(el, "M-2.4 -17.8 q2.4 1.6 4.8 0", 1.1);
  svg("path", { d: "M16 -28 q-4.4 -2.8 -1.2 -8.6 q0.4 3 2.4 3.2 q-0.6 -3.4 2.2 -5.8 q-0.2 4 2 6.4 q1.6 3.2 -1.2 4.8 Z", ...stroke(0.7), fill: "#f4a259" }, el);
  svg("path", { d: "M17.2 -28.6 q-1.8 -1.6 -0.2 -4.2 q0.6 1.8 1.8 2 q0.4 1.8 -0.6 2.2 Z", fill: "#f2cc8f" }, el);

  // smug: half-lidded side-glance with a cat smirk
  el = look("smug");
  line(el, "M-9.2 -23 h5 M4.2 -23 h5", 1.4);
  svg("path", { d: "M-8 -23 a1.4 1.4 0 0 0 2.8 0 Z M5.2 -23 a1.4 1.4 0 0 0 2.8 0 Z", fill: INK }, el);
  line(el, "M-3 -18.8 q1.5 1.8 3 0 q1.6 1.6 3.4 -1", 1.1);
  hatch(el, 2);

  // three kinds of crying: welling up, wailing, and happy tears
  el = look("teary");
  line(el, "M-9 -25.4 L-4.6 -27 M9 -25.4 L4.6 -27", 1.1);
  sparkleEyes(el, 3.1);
  for (const x of [-10, 3]) {
    svg("path", { d: `M${x} -19.6 q1.75 1.2 3.5 0 q1.75 1.2 3.5 0 v1.2 q-1.75 1.4 -3.5 0 q-1.75 1.4 -3.5 0 Z`, fill: TEAR }, el);
  }
  line(el, "M-3 -16.4 l1 -1.1 l1 1.1 l1 -1.1 l1 1.1 l1 -1.1 l1 1.1", 1);

  el = look("wailing");
  line(el, "M-9 -23.4 q2.2 1.8 4.4 0 M4.6 -23.4 q2.2 1.8 4.4 0", 1.4);
  for (const s of [-1, 1]) {
    svg("path", { d: `M${s * 8.4} -22 C${s * 9} -18 ${s * 9} -14 ${s * 8.6} -9.8 L${s * 4.8} -9.8 C${s * 4.6} -14 ${s * 4.6} -18 ${s * 5.2} -22 Z`, ...stroke(0.9), fill: TEAR }, el);
  }
  svg("path", { d: "M-3.2 -16.2 q3.2 -4.2 6.4 0 q-3.2 1.8 -6.4 0 Z", ...stroke(1), fill: PINK }, el);

  el = look("touched");
  smileEyes(el);
  drop(el, -10.2, -21.8);
  drop(el, 10.2, -21.8);
  omega(el, 1.2);
  hatch(el);

  looks.neutral.removeAttribute("display");
  return { looks, blinkEyes, current: "neutral", blinking: false };
}

// squash every open eye to a line and back; only touches the DOM when the state changes
function blinkFace(face, blink) {
  if (blink === face.blinking) return;
  face.blinking = blink;
  for (const { g, cy } of face.blinkEyes) {
    if (blink) g.setAttribute("transform", `translate(0 ${cy}) scale(1 0.12) translate(0 ${-cy})`);
    else g.removeAttribute("transform");
  }
}

function setExpression(cat, name) {
  const face = cat.face;
  if (face.current === name) return;
  face.looks[face.current].setAttribute("display", "none");
  face.looks[name].removeAttribute("display");
  face.current = name;
}

// Rice bowl held in the left paw, chopsticks in the right; swapped in for the paws at lunch.
function makeLunch(body) {
  const g = svg("g", { display: "none" }, body);
  const line = { stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" };
  [-13.5, -11, -8.5].forEach((x, i) => svg("path", {
    class: "rice-steam", style: `animation-delay: ${-i * 0.8}s`,
    d: `M${x} -9 q-1.3 -1.75 0 -3.5 q1.3 -1.75 0 -3.5`,
    fill: "none", stroke: INK, "stroke-width": 1.1, "stroke-linecap": "round",
  }, g));
  svg("path", { d: "M-12 -7 q5 -6 10 0 Z", fill: "#fff", ...line }, g);
  svg("path", { d: "M-13 -7 h12 q0 6 -6 6 q-6 0 -6 -6 Z", fill: "#e07a5f", ...line }, g);
  svg("ellipse", { cx: -13, cy: -4, rx: 3, ry: 2.5, fill: "#fff", ...line }, g);
  const hand = svg("g", {}, g);
  svg("path", { d: "M0 0 L-6 -5 M0.8 -0.8 L-5 -6", fill: "none", stroke: INK, "stroke-width": 0.9, "stroke-linecap": "round" }, hand);
  svg("ellipse", { cx: 0, cy: 0, rx: 3.5, ry: 2.5, fill: "#fff", ...line }, hand);
  return { g, hand };
}

// Flat icons shown above a cat's head, drawn around (0, 0) and popped in by updateCat.
function makeBubble(root) {
  const g = svg("g", {}, root);
  const line = { stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round", "stroke-linecap": "round" };

  const coffee = svg("g", { display: "none" }, g);
  svg("path", { class: "steam", d: "M-1.5 -5 q-1.5 -2 0 -4 M1.5 -5 q1.5 -2 0 -4", fill: "none", ...line }, coffee);
  svg("path", { d: "M4 -1 q3 0 3 2.5 t-3 2.5", fill: "none", ...line }, coffee);
  svg("rect", { x: -4, y: -3, width: 8, height: 8, rx: 1.5, fill: "#fdf6ec", ...line }, coffee);
  svg("rect", { x: -3.2, y: -2.2, width: 6.4, height: 1.6, fill: "#c98f5a" }, coffee);

  const meet = svg("g", { display: "none" }, g);
  svg("path", { d: "M-4 3 L-6 8 L0 3", fill: "#fff", ...line }, meet);
  svg("rect", { x: -8, y: -6, width: 16, height: 10, rx: 4, fill: "#fff", ...line }, meet);
  const dots = [-4, 0, 4].map((cx) => svg("circle", { cx, cy: -1, r: 1.1, fill: INK }, meet));

  const home = svg("g", { display: "none" }, g);
  svg("rect", { x: -5, y: -1, width: 10, height: 7, fill: "#fdf6ec", ...line }, home);
  svg("rect", { x: -1.5, y: 2, width: 3, height: 4, fill: "#c98f5a" }, home);
  svg("path", { d: "M-7 -1 L0 -7.5 L7 -1 Z", fill: "#e07a5f", ...line }, home);

  return { g, icons: { coffee, meet, home }, dots, key: "", age: 0 };
}

// wandering stays in the open office, out of the meeting room
function randomFloorPoint() {
  return {
    x: FLOOR.minX + Math.random() * (WANDER_MAX_X - FLOOR.minX),
    y: FLOOR.minY + Math.random() * (FLOOR.maxY - FLOOR.minY),
  };
}

// The meeting room's glass wall runs from (234, 88) at the back to (222, 178) at the front.
// Cats only cross it through the door gap, so walks in or out go via a point on each side.
const WANDER_MAX_X = 212;
const MEETING_DOOR = { out: { x: 218, y: 141 }, in: { x: 236, y: 141 } };

function inMeetingRoom(p) {
  return p.x > 234 - (12 * (p.y - 88)) / 90;
}

function walkStraight(cat, point, then) {
  cat.tx = point.x;
  cat.ty = point.y;
  cat.state = "walk";
  cat.then = then;
}

function walkTo(cat, point, then) {
  const from = inMeetingRoom(cat);
  if (from === inMeetingRoom(point)) return walkStraight(cat, point, then);
  const [first, second] = from ? [MEETING_DOOR.in, MEETING_DOOR.out] : [MEETING_DOOR.out, MEETING_DOOR.in];
  walkStraight(cat, first, () => walkStraight(cat, second, () => walkStraight(cat, point, then)));
}

function goWander(cat) {
  walkTo(cat, randomFloorPoint(), () => {
    cat.state = "rest";
    cat.timer = 2 + Math.random() * 3;
  });
}

function goToDesk(cat) {
  const desk = pickFree(desks);
  if (!desk) return goWander(cat);
  desk.owner = cat;
  cat.place = desk;
  walkTo(cat, { x: desk.x, y: desk.seatY }, () => {
    cat.state = "work";
    cat.workMood = pickWorkMood(cat);
    cat.timer = 8 + Math.random() * 12;
  });
}

function goToCoffee(cat) {
  const spot = {
    x: COFFEE_SPOT.x + (Math.random() - 0.5) * 14,
    y: COFFEE_SPOT.y + Math.random() * 10,
  };
  walkTo(cat, spot, () => {
    cat.state = "coffee";
    cat.timer = 3 + Math.random() * 3;
  });
}

function goToMeeting(cat) {
  const seat = pickFree(seats);
  if (!seat) return goToCoffee(cat);
  seat.owner = cat;
  cat.place = seat;
  walkTo(cat, seat, () => {
    cat.state = "meet";
    cat.meetMood = pickOne(MEETING_MOODS);
    cat.timer = 6 + Math.random() * 7;
  });
}

function goHome(cat) {
  leavePlace(cat);
  cat.leaving = true;
  cat.leaveMood = pickOne(LEAVING_MOODS);
  walkTo(cat, { x: EXIT_X, y: cat.y }, () => removeCat(cat));
}

// After 6 PM on workdays the guard robot is on duty: cats keep working late until it sends them home.
function guardOnDuty() {
  const { clock, mood } = document.body.dataset;
  return clock === "off" && mood !== "weekend";
}

function officeClosed() {
  return document.body.dataset.clock === "off";
}

function pickFree(list) {
  const free = list.filter((p) => !p.owner);
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function leavePlace(cat) {
  if (cat.place) cat.place.owner = null;
  cat.place = null;
}

function goToLunch(cat) {
  const spot = pickFree(desks) || pickFree(seats);
  let point = randomFloorPoint();
  if (spot) {
    spot.owner = cat;
    cat.place = spot;
    point = { x: spot.x, y: spot.seatY ?? spot.y };
  }
  walkTo(cat, point, () => {
    if (!lunchTime()) return chooseNext(cat, false);
    cat.state = "lunch";
    cat.timer = 20 + Math.random() * 20;
  });
}

function lunchTime() {
  return document.body.dataset.lunch === "on";
}

function chooseNext(cat, afterWork) {
  leavePlace(cat);
  if (officeClosed() && !guardOnDuty()) return goHome(cat);
  if (lunchTime()) return goToLunch(cat);
  const r = Math.random();
  if (afterWork) {
    if (r < 0.4) goToCoffee(cat);
    else if (r < 0.7) goToMeeting(cat);
    else goWander(cat);
  } else if (r < 0.6) goToDesk(cat);
  else if (r < 0.8) goToCoffee(cat);
  else if (r < 0.92) goToMeeting(cat);
  else goWander(cat);
}

function finishState(cat) {
  // half the cats stagger out of a meeting dizzy for a few seconds
  if (cat.state === "meet" && Math.random() < 0.5) cat.dizzy = 3 + Math.random() * 2;
  chooseNext(cat, cat.state === "work");
}

// tell the user why a cat just vanished when the office is at capacity
function flashFullHint() {
  hintEl.classList.add("full");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hintEl.classList.remove("full"), 2500);
}

function addCat(x, y) {
  if (cats.length >= MAX_CATS) {
    removeCat(cats[0]);
    flashFullHint();
  }
  const cat = makeCat(x, y);
  cats.push(cat);
  // at weekends cats only drop by for a quick look around; on weekday evenings they work late
  if (officeClosed() && !guardOnDuty()) goWander(cat);
  else chooseNext(cat, false);
}

function removeCat(cat) {
  leavePlace(cat);
  cat.root.remove();
  cats.splice(cats.indexOf(cat), 1);
}

function updateBubble(cat, dt, t) {
  const bubble = cat.bubble;
  let key = "";
  if (cat.leaving) key = "home";
  else if (cat.state === "coffee" || cat.state === "meet") key = cat.state;

  if (key !== bubble.key) {
    if (bubble.key) bubble.icons[bubble.key].setAttribute("display", "none");
    if (key) bubble.icons[key].removeAttribute("display");
    bubble.key = key;
    bubble.age = 0;
  }
  if (!key) return;

  bubble.age += dt;
  const p = reduceMotion ? 1 : Math.min(1, bubble.age / 0.25);
  const pop = 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2; // ease-out-back
  bubble.g.setAttribute("transform", `translate(0 -47) scale(${pop.toFixed(2)})`);

  if (key === "meet") {
    const active = Math.floor(t * 3 + cat.phase) % 3;
    bubble.dots.forEach((dot, i) => dot.setAttribute("opacity", reduceMotion || i === active ? 1 : 0.35));
  }
}

function updateLunch(cat, t) {
  const eating = cat.state === "lunch";
  if (eating !== cat.eating) {
    cat.eating = eating;
    cat.lunch.g.setAttribute("display", eating ? "inline" : "none");
    cat.pawL.setAttribute("display", eating ? "none" : "inline");
    cat.pawR.setAttribute("display", eating ? "none" : "inline");
  }
  if (!eating) return;
  // chopsticks travel from the bowl (2, -5) up to the mouth (4, -13) and back
  const bite = reduceMotion ? 0 : (1 - Math.cos(t * 4 + cat.phase)) / 2;
  cat.lunch.hand.setAttribute("transform", `translate(${(2 + 2 * bite).toFixed(2)} ${(-5 - 8 * bite).toFixed(2)})`);
}

// At the desk each cat has its own mood, drawn from a mix that brightens through the
// day, so the office is never all one face. Tears are rare.
const WORK_MOOD_MIX = {
  "stage-0": { sleepy: 3, unimpressed: 3, teary: 1, phew: 1, neutral: 1 },
  "stage-1": { annoyed: 3, angry: 2, unimpressed: 2, sleepy: 1, wailing: 0.5 },
  "stage-2": { neutral: 2, phew: 2, nervous: 2, calm: 1, amazed: 1, teary: 1 },
  "stage-3": { happy: 2, calm: 2, wink: 1, silly: 1, shy: 1, neutral: 1, smug: 1 },
  "stage-4": { amazed: 3, determined: 2, touched: 2, happy: 2, silly: 1, wink: 1, smug: 1 },
};
const MEETING_MOODS = ["sleepy", "unimpressed", "phew", "neutral", "calm"];
const LEAVING_MOODS = ["amazed", "touched", "happy", "wink"];
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// Picked when a cat sits down, favouring faces no other working cat is wearing.
function pickWorkMood(cat) {
  const mix = { ...(WORK_MOOD_MIX[document.body.dataset.mood] || { neutral: 1 }) };
  if (document.body.dataset.lunch === "soon") mix.hungry = 5;
  const taken = new Set(cats.filter((c) => c !== cat && c.state === "work").map((c) => c.workMood));
  const fresh = Object.entries(mix).filter(([name]) => !taken.has(name));
  const pool = fresh.length ? fresh : Object.entries(mix);
  let roll = Math.random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [name, weight] of pool) if ((roll -= weight) < 0) return name;
  return pool[0][0];
}

// The progress-bar walker wears the same faces: the page's mood in one face.
const WALKER_MOODS = { "stage-0": "sleepy", "stage-1": "annoyed", "stage-2": "neutral", "stage-3": "happy", "stage-4": "amazed" };
const walker = { face: makeHead(document.getElementById("walker-head"), "#f4a259") };

function walkerExpression() {
  const { clock, mood, lunch } = document.body.dataset;
  if (clock !== "on") return mood === "offclock-friday" ? "amazed" : mood === "weekend" ? "happy" : "sleepy";
  if (lunch === "on") return "happy";
  if (lunch === "soon") return "hungry";
  return WALKER_MOODS[mood] || "neutral";
}

function pickExpression(cat) {
  if (cat.age < 0.9) return "amazed";
  if (cat.scolded) return "nervous";
  if (cat.leaving) return cat.leaveMood;
  if (cat.dizzy > 0) return "dizzy";
  if (cat.state === "coffee") return "calm";
  if (cat.state === "lunch") return "happy";
  if (cat.state === "meet") return cat.meetMood;
  if (cat.state === "work") return cat.workMood || "neutral";
  if (cat.state === "rest" && cat.silly) return "silly";
  return "neutral";
}

function updateCat(cat, dt, t) {
  cat.age += dt;
  if (cat.dizzy > 0) cat.dizzy -= dt;
  let bob = 0;
  let squish = 1;
  let typing = false;

  if (cat.state === "walk") {
    const dx = cat.tx - cat.x;
    const dy = cat.ty - cat.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (dist <= step) {
      cat.x = cat.tx;
      cat.y = cat.ty;
      cat.then();
    } else {
      cat.x += (dx / dist) * step;
      cat.y += (dy / dist) * step;
      if (!reduceMotion) bob = -Math.abs(Math.sin(t * 12 + cat.phase)) * 2.5;
    }
  } else {
    cat.timer -= dt;
    typing = cat.state === "work";
    squish = typing || cat.state === "meet" || cat.state === "lunch" ? 0.92 : 1;
    if (cat.timer <= 0) finishState(cat);
  }

  const pop = Math.min(1, cat.age / 0.3);
  const scale = pop * pop * (3 - 2 * pop);
  cat.root.setAttribute("transform", `translate(${cat.x.toFixed(1)} ${(cat.y + bob).toFixed(1)}) scale(${scale.toFixed(2)})`);
  cat.body.setAttribute("transform", `scale(1 ${squish})`);

  const wag = reduceMotion ? 0 : Math.sin(t * 3 + cat.phase) * 8;
  cat.tail.setAttribute("transform", `rotate(${wag.toFixed(1)} -8 -6)`);

  const pawLift = typing && !reduceMotion ? Math.sin(t * 22 + cat.phase) * 2 : 0;
  const pawBase = typing ? -12 : -2;
  cat.pawL.setAttribute("cy", pawBase + pawLift);
  cat.pawR.setAttribute("cy", pawBase - pawLift);
  updateLunch(cat, t);

  updateBubble(cat, dt, t);

  setExpression(cat, pickExpression(cat));
  const blink = Math.sin(t * 0.9 + cat.phase * 3) > 0.985;
  blinkFace(cat.face, blink);
}

let lastClock = null;
let lastLunch = null;
function syncLunch() {
  const lunch = lunchTime();
  if (lunch === lastLunch) return;
  lastLunch = lunch;
  for (const cat of cats) {
    if (cat.leaving) continue;
    if (lunch && cat.state !== "lunch") chooseNext(cat, false);
    else if (!lunch && cat.state === "lunch") cat.timer = 0;
  }
}

function syncClock() {
  const clock = document.body.dataset.clock;
  if (!clock || clock === lastClock) return;
  const first = lastClock === null;
  lastClock = clock;
  // at 6 PM nobody leaves by themselves: the guard robot (guard.js) comes to send them home
  if (clock === "on") addCat(FLOOR.minX, FLOOR.maxY);
  else if (!first && !guardOnDuty()) cats.filter((cat) => !cat.leaving).forEach(goHome);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  syncClock();
  syncLunch();
  for (const cat of [...cats]) updateCat(cat, dt, t);

  setExpression(walker, walkerExpression());
  const walkerBlink = Math.sin(t * 0.9) > 0.985;
  blinkFace(walker.face, walkerBlink);

  for (const desk of desks) {
    const working = desk.owner && desk.owner.state === "work";
    desk.screen.setAttribute("fill", working ? "#9be3c4" : INK);
  }

  const sorted = [...cats].sort((a, b) => a.y - b.y);
  sorted.forEach((cat, i) => {
    if (catsLayer.children[i] !== cat.root) catsLayer.insertBefore(cat.root, catsLayer.children[i] || null);
  });

  requestAnimationFrame(frame);
}

function spawnFromEvent(event) {
  const rect = sceneEl.getBoundingClientRect();
  const x = -40 + ((event.clientX - rect.left) / rect.width) * 360;
  const y = ((event.clientY - rect.top) / rect.height) * 180;
  addCat(
    Math.min(FLOOR.maxX, Math.max(FLOOR.minX, x)),
    Math.min(FLOOR.maxY, Math.max(FLOOR.minY, y))
  );
}

officeEl.addEventListener("click", spawnFromEvent);
officeEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  const spot = randomFloorPoint();
  addCat(spot.x, spot.y);
});

buildDesks();
requestAnimationFrame(frame);
