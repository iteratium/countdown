const NS = "http://www.w3.org/2000/svg";
const INK = "#2e2b3f";
const MAX_CATS = 10;
const SPEED = 38;
const FLOOR = { minX: 18, maxX: 302, minY: 132, maxY: 172 };
const COFFEE_SPOT = { x: 240, y: 138 };
const EXIT_X = -24;
const CAT_COLORS = ["#f4a259", "#c9c1b8", "#8d8074", "#f2cc8f", "#e0d5c4", "#5b5670"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const officeEl = document.getElementById("office");
const sceneEl = document.getElementById("office-scene");
const catsLayer = document.getElementById("office-cats");
const deskLayer = document.getElementById("office-desks");

const desks = [48, 120, 192].map((x) => ({ x, seatY: 134, owner: null, screen: null }));
const seats = [
  { x: 262, y: 142, owner: null },
  { x: 308, y: 142, owner: null },
  { x: 285, y: 156, owner: null },
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
    svg("rect", { x: -34, y: 0, width: 68, height: 10, rx: 2, fill: "#c98f5a", stroke: INK, "stroke-width": 2 }, g);
    svg("rect", { x: -30, y: 10, width: 5, height: 14, fill: INK }, g);
    svg("rect", { x: 25, y: 10, width: 5, height: 14, fill: INK }, g);
  }
}

function makeCat(x, y) {
  const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
  const root = svg("g", {}, catsLayer);
  const body = svg("g", {}, root);
  const tail = svg("path", { d: "M-8 -6 Q-22 -6 -17 -22", fill: "none", stroke: INK, "stroke-width": 6, "stroke-linecap": "round" }, body);
  svg("path", { d: "M-8 -6 Q-22 -6 -17 -22", fill: "none", stroke: color, "stroke-width": 3, "stroke-linecap": "round" }, body);
  svg("ellipse", { cx: 0, cy: -7, rx: 9, ry: 8, fill: color, stroke: INK, "stroke-width": 1.5 }, body);
  const outline = { stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" };
  for (const s of [-1, 1]) {
    svg("path", { d: `M${s * 11} -25 L${s * 9} -36 Q${s * 8} -38.5 ${s * 6.2} -36.8 L${s * 1.5} -31 Z`, fill: color, ...outline }, body);
    svg("path", { d: `M${s * 8.6} -29 L${s * 7.9} -34 L${s * 4.6} -30.8 Z`, fill: "#f4b6a6" }, body);
  }
  svg("ellipse", { cx: 0, cy: -22, rx: 11.5, ry: 9.5, fill: color, ...outline }, body);
  svg("path", {
    d: "M-10 -19.5 L-14.5 -20.5 M-10 -17.5 L-14.5 -17 M10 -19.5 L14.5 -20.5 M10 -17.5 L14.5 -17",
    fill: "none", stroke: INK, "stroke-width": 0.7, "stroke-linecap": "round",
  }, body);
  svg("ellipse", { cx: -7, cy: -18.2, rx: 1.9, ry: 1, fill: "#f08a8a", opacity: 0.55 }, body);
  svg("ellipse", { cx: 7, cy: -18.2, rx: 1.9, ry: 1, fill: "#f08a8a", opacity: 0.55 }, body);
  const face = makeFace(body);
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

// Kawaii expressions, after a "how do you feel today" sheet: each one is its own group of
// eyes, brows, mouth and an optional mark beside the head, so it reads at small sizes.
const TEAR = "#7cc4e4";
const MOUTH = "#e07a5f";

function makeFace(body) {
  const g = svg("g", {}, body);
  const line = (w = 1.4) => ({ fill: "none", stroke: INK, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" });
  const looks = {};
  const look = (name) => (looks[name] = svg("g", { display: "none" }, g));

  const openEyes = (parent, rx = 2.1, ry = 2.6, shines = 1) => {
    const eyes = [-4.5, 4.5].map((cx) => svg("ellipse", { cx, cy: -22, rx, ry, fill: INK }, parent));
    for (const cx of [-4.5, 4.5]) {
      svg("circle", { cx: cx + 0.8, cy: -23, r: 0.85, fill: "#fff" }, parent);
      if (shines > 1) svg("circle", { cx: cx - 0.7, cy: -20.8, r: 0.45, fill: "#fff" }, parent);
    }
    return eyes;
  };
  const roundEyes = (parent) => {
    for (const cx of [-4.5, 4.5]) {
      svg("circle", { cx, cy: -22, r: 2.8, fill: "#fff", stroke: INK, "stroke-width": 1.1 }, parent);
      svg("circle", { cx, cy: -22, r: 1.1, fill: INK }, parent);
    }
  };
  const omega = (parent) => svg("path", { d: "M-2.6 -17.4 q1.3 1.6 2.6 0 q1.3 1.6 2.6 0", ...line(1.1) }, parent);
  const grin = (parent) => svg("path", { d: "M-2.8 -17.6 h5.6 q0 3.6 -2.8 3.6 q-2.8 0 -2.8 -3.6 Z", fill: MOUTH, ...line(1) }, parent);
  const frown = (parent) => svg("path", { d: "M-2.4 -15.6 q2.4 -2.6 4.8 0", ...line(1.2) }, parent);
  const drop = (parent, x, y, fill = TEAR) =>
    svg("path", { d: `M${x} ${y} q-1.6 2.4 0 3.4 q1.6 -1 0 -3.4 Z`, fill, stroke: INK, "stroke-width": 0.7 }, parent);
  const sparkle = (parent, x, y, r) =>
    svg("path", { d: `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`, fill: "#f2cc8f", stroke: INK, "stroke-width": 0.7 }, parent);

  let el = look("neutral");
  const blinkEyes = openEyes(el);
  omega(el);

  el = look("happy");
  svg("path", { d: "M-6.8 -21 q2.3 -3.4 4.6 0 M2.2 -21 q2.3 -3.4 4.6 0", ...line(1.5) }, el);
  grin(el);

  el = look("excited");
  openEyes(el, 2.5, 3, 2);
  grin(el);
  sparkle(el, 14.5, -34, 2.6);
  sparkle(el, -14.5, -31, 1.8);

  el = look("sleepy");
  svg("path", { d: "M-6.8 -22 q2.3 1.8 4.6 0 M2.2 -22 q2.3 1.8 4.6 0", ...line(1.5) }, el);
  svg("ellipse", { cx: 0, cy: -16.4, rx: 0.9, ry: 1.1, fill: MOUTH, stroke: INK, "stroke-width": 0.8 }, el);
  svg("path", { d: "M11.5 -35 h3.2 l-3.2 3.2 h3.2 M16 -39.5 h2.2 l-2.2 2.2 h2.2", ...line(1.1) }, el);

  el = look("surprised");
  roundEyes(el);
  svg("ellipse", { cx: 0, cy: -15.9, rx: 1.4, ry: 1.8, fill: MOUTH, stroke: INK, "stroke-width": 0.9 }, el);
  svg("path", { d: "M14 -39 V-34", ...line(1.6), stroke: MOUTH }, el);
  svg("circle", { cx: 14, cy: -31.8, r: 0.9, fill: MOUTH }, el);

  el = look("angry");
  svg("path", { d: "M-7.2 -26.6 L-2.4 -24.4 M7.2 -26.6 L2.4 -24.4", ...line(1.6) }, el);
  openEyes(el, 2, 1.8);
  frown(el);
  svg("path", { d: "M10.5 -34 Q12 -34 12 -35.5 M14 -35.5 Q14 -34 15.5 -34 M10.5 -32 Q12 -32 12 -30.5 M14 -30.5 Q14 -32 15.5 -32", ...line(1.3), stroke: "#e05a47" }, el);

  el = look("sad");
  svg("path", { d: "M-7 -25 L-2.8 -26.6 M7 -25 L2.8 -26.6", ...line(1.4) }, el);
  openEyes(el, 2, 2.4);
  frown(el);
  drop(el, -5, -19.8);

  el = look("scared");
  roundEyes(el);
  svg("path", { d: "M-3.2 -16.4 l1.6 -1.2 l1.6 1.2 l1.6 -1.2 l1.6 1.2", ...line(1.1) }, el);
  drop(el, 12.5, -33);
  svg("path", { d: "M-3 -30 v2.5 M0 -30.5 v3 M3 -30 v2.5", ...line(0.9), stroke: TEAR }, el);

  el = look("hungry");
  openEyes(el, 2.3, 2.8, 2);
  svg("path", { d: "M-2.8 -17.6 h5.6 q0 3.2 -2.8 3.2 q-2.8 0 -2.8 -3.2 Z", fill: MOUTH, ...line(1) }, el);
  drop(el, 2.4, -15.4);

  el = look("silly");
  svg("ellipse", { cx: -4.5, cy: -22, rx: 2.1, ry: 2.6, fill: INK }, el);
  svg("circle", { cx: -3.7, cy: -23, r: 0.85, fill: "#fff" }, el);
  svg("path", { d: "M2.4 -23.6 L6.4 -22 L2.4 -20.4", ...line(1.4) }, el);
  omega(el);
  svg("path", { d: "M-1.3 -16.6 h2.6 v1.6 a1.3 1.3 0 0 1 -2.6 0 Z", fill: "#f08a8a", stroke: INK, "stroke-width": 0.8 }, el);

  svg("path", { d: "M-1.3 -19.4 L1.3 -19.4 L0 -18.1 Z", fill: MOUTH }, g);
  looks.neutral.removeAttribute("display");
  return { looks, blinkEyes, current: "neutral" };
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

function randomFloorPoint() {
  return {
    x: FLOOR.minX + Math.random() * (FLOOR.maxX - FLOOR.minX),
    y: FLOOR.minY + Math.random() * (FLOOR.maxY - FLOOR.minY),
  };
}

function walkTo(cat, point, then) {
  cat.tx = point.x;
  cat.ty = point.y;
  cat.state = "walk";
  cat.then = then;
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
    cat.timer = 6 + Math.random() * 7;
  });
}

function goHome(cat) {
  leavePlace(cat);
  cat.leaving = true;
  walkTo(cat, { x: EXIT_X, y: cat.y }, () => removeCat(cat));
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
  if (officeClosed()) return goHome(cat);
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
  chooseNext(cat, cat.state === "work");
}

function addCat(x, y) {
  if (cats.length >= MAX_CATS) removeCat(cats[0]);
  const cat = makeCat(x, y);
  cats.push(cat);
  // after hours, cats only drop by for a quick look around
  if (officeClosed()) goWander(cat);
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

// At the desk the cats feel the same as the page's mood stage.
const WORK_MOODS = { "stage-0": "scared", "stage-1": "angry", "stage-2": "sad", "stage-3": "happy", "stage-4": "excited" };

function pickExpression(cat) {
  if (cat.age < 0.9) return "surprised";
  if (cat.leaving) return "excited";
  if (cat.state === "coffee" || cat.state === "lunch") return "happy";
  if (cat.state === "meet") return "sleepy";
  if (cat.state === "work") {
    if (document.body.dataset.lunch === "soon") return "hungry";
    return WORK_MOODS[document.body.dataset.mood] || "neutral";
  }
  if (cat.state === "rest" && cat.silly) return "silly";
  return "neutral";
}

function updateCat(cat, dt, t) {
  cat.age += dt;
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
  for (const eye of cat.face.blinkEyes) eye.setAttribute("ry", blink ? 0.3 : 2.6);
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
  if (clock === "on") addCat(FLOOR.minX, FLOOR.maxY);
  else if (!first) cats.filter((cat) => !cat.leaving).forEach(goHome);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  syncClock();
  syncLunch();
  for (const cat of [...cats]) updateCat(cat, dt, t);

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
  const x = ((event.clientX - rect.left) / rect.width) * 320;
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
