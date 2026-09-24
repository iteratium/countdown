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
  svg("ellipse", { cx: 0, cy: -8, rx: 10, ry: 9, fill: color, stroke: INK, "stroke-width": 1.5 }, body);
  svg("polygon", { points: "-9,-27 -8,-38 -1,-30", fill: color, stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" }, body);
  svg("polygon", { points: "9,-27 8,-38 1,-30", fill: color, stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" }, body);
  svg("circle", { cx: 0, cy: -22, r: 9, fill: color, stroke: INK, "stroke-width": 1.5 }, body);
  const eyeL = svg("ellipse", { cx: -3.5, cy: -22, rx: 1.5, ry: 1.5, fill: INK }, body);
  const eyeR = svg("ellipse", { cx: 3.5, cy: -22, rx: 1.5, ry: 1.5, fill: INK }, body);
  svg("path", { d: "M-1.5 -18.5 L1.5 -18.5 L0 -17 Z", fill: "#e07a5f" }, body);
  svg("path", {
    d: "M-3 -18 L-14 -20 M-3 -17 L-14 -16 M3 -18 L14 -20 M3 -17 L14 -16",
    fill: "none", stroke: INK, "stroke-width": 0.7, "stroke-linecap": "round",
  }, body);
  const pawL = svg("ellipse", { cx: -5, cy: -2, rx: 3.5, ry: 2.5, fill: "#fff", stroke: INK, "stroke-width": 1.2 }, body);
  const pawR = svg("ellipse", { cx: 5, cy: -2, rx: 3.5, ry: 2.5, fill: "#fff", stroke: INK, "stroke-width": 1.2 }, body);

  const bubble = makeBubble(root);

  return {
    x, y, tx: x, ty: y, color,
    state: "rest", timer: 1, place: null, bubble, phase: Math.random() * 10, age: 0,
    root, body, tail, eyeL, eyeR, pawL, pawR,
  };
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

function chooseNext(cat, afterWork) {
  leavePlace(cat);
  if (officeClosed()) return goHome(cat);
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
    squish = typing || cat.state === "meet" ? 0.92 : 1;
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

  updateBubble(cat, dt, t);

  const blink = Math.sin(t * 0.9 + cat.phase * 3) > 0.985 ? 0.3 : 1.5;
  cat.eyeL.setAttribute("ry", blink);
  cat.eyeR.setAttribute("ry", blink);
}

let lastClock = null;
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
