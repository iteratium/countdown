// Keibi-kun, the security-guard robot (keibi = "security guard"). After hours on workdays it rolls in from the left, sends any
// cats still working home, says goodbye, then patrols. At night it carries a flashlight,
// and once the office is empty it turns the lights off. Uses office.js globals (svg, INK,
// cats, catsLayer, goHome, FLOOR, inMeetingRoom, MEETING_DOOR, guardOnDuty, reduceMotion).
const GUARD_SCALE = 0.72;
const GUARD_SPEED = 26;
const GUARD_DOOR = { x: -64, y: 162 };
const ROBOT = {
  white: "#f8f8f5",
  joint: "#dcdde3",
  silver: "#c3c8d1",
  dark: "#3d405b",
  screen: "#1f2340",
  glow: "#9fe0ff",
  halo: "#7cc4e4",
  cap: "#2e3350",
  gold: "#f2cc8f",
};

// Drawn around the floor point under its base; about 84 units tall before scaling.
// Eyes: "patrol" (glowing ovals), "stern" (slanted, spotted someone), "happy" (^ ^).
function drawRobot(parent) {
  const o = { stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round", "stroke-linecap": "round" };
  const el = (tag, attrs, into = parent) => svg(tag, { ...o, ...attrs }, into);

  el("ellipse", { cx: 0, cy: 0.5, rx: 17, ry: 2.6, fill: INK, opacity: 0.15, stroke: "none" });

  // camera mast behind the head
  el("path", { d: "M7 -50 V-79", "stroke-width": 4 });
  el("path", { d: "M7 -50 V-79", stroke: ROBOT.silver, "stroke-width": 1.8 });
  el("rect", { x: 4.2, y: -83.5, width: 5.6, height: 3.6, rx: 1.2, fill: ROBOT.dark });

  // wheeled base with a dark bumper slot
  el("path", { d: "M-15 -2 Q-16 -14 -10 -17 H10 Q16 -14 15 -2 Q15 0 12 0 H-12 Q-15 0 -15 -2 Z", fill: ROBOT.white });
  el("path", { d: "M-6 -5.5 h12", stroke: ROBOT.dark, "stroke-width": 2 });
  el("circle", { cx: -10.5, cy: 0.4, r: 1.4, fill: INK, stroke: "none" });
  el("circle", { cx: 10.5, cy: 0.4, r: 1.4, fill: INK, stroke: "none" });

  // silver column with a dark panel and a status light, hugged by white shell panels
  el("rect", { x: -4, y: -52, width: 8, height: 36, rx: 1, fill: ROBOT.silver });
  el("rect", { x: -1.6, y: -49, width: 3.2, height: 26, rx: 1, fill: ROBOT.dark, "stroke-width": 0.8 });
  el("circle", { cx: 0, cy: -21, r: 1, fill: ROBOT.halo, stroke: "none" });
  el("path", { d: "M-4 -38 Q-10 -28 -7 -17 H-3 Q-5 -27 -4 -34 Z", fill: ROBOT.white });
  el("path", { d: "M4 -38 Q10 -28 7 -17 H3 Q5 -27 4 -34 Z", fill: ROBOT.white });

  // shoulders: a rounded capsule with grey joint caps and a sensor strip
  el("rect", { x: -11, y: -50.5, width: 22, height: 8.5, rx: 4.25, fill: ROBOT.white });
  el("circle", { cx: -11, cy: -46.2, r: 4.4, fill: ROBOT.joint });
  el("circle", { cx: 11, cy: -46.2, r: 4.4, fill: ROBOT.joint });
  el("rect", { x: -3.2, y: -47.6, width: 6.4, height: 2.4, rx: 1.2, fill: ROBOT.dark, "stroke-width": 0.8 });
  el("circle", { cx: -1.2, cy: -46.4, r: 0.45, fill: ROBOT.halo, stroke: "none" });
  el("circle", { cx: 1.2, cy: -46.4, r: 0.45, fill: ROBOT.halo, stroke: "none" });

  // jointed arms held forward
  for (const s of [-1, 1]) {
    const arm = `M${s * 12} -43 L${s * 13} -34 L${s * 5.5} -30.5`;
    el("path", { d: arm, fill: "none", "stroke-width": 6.4 });
    el("path", { d: arm, fill: "none", stroke: ROBOT.white, "stroke-width": 3.6 });
    el("circle", { cx: s * 13, cy: -34, r: 2.5, fill: ROBOT.joint });
    el("rect", { x: s * 5.5 - 2, y: -32.6, width: 4, height: 4, rx: 1.2, fill: ROBOT.joint });
  }

  // flashlight in the right hand, with a soft beam down to the floor
  const torch = svg("g", { display: "none" }, parent);
  svg("path", { d: "M-5 -30.5 L-40 2 L-18 4 Z", fill: "#fff3c4", opacity: 0.6 }, torch);
  el("rect", { x: -9.5, y: -32.4, width: 5.5, height: 3.4, rx: 1, fill: ROBOT.dark, transform: "rotate(-40 -6.7 -30.7)" }, torch);

  // neck and head: white shell, dark visor, glowing eyes
  el("rect", { x: -2, y: -54.5, width: 4, height: 4.5, fill: ROBOT.joint, "stroke-width": 1 });
  el("rect", { x: -10.5, y: -67, width: 21, height: 13.5, rx: 5.5, fill: ROBOT.white });
  el("rect", { x: -8.3, y: -65, width: 16.6, height: 9.6, rx: 4.2, fill: ROBOT.screen });
  const eyeSets = {};
  for (const name of ["patrol", "stern", "happy"]) {
    const set = (eyeSets[name] = svg("g", { display: name === "patrol" ? "inline" : "none" }, parent));
    for (const cx of [-3.6, 3.6]) {
      svg("circle", { cx, cy: -60.2, r: 3.6, fill: ROBOT.halo, opacity: 0.35 }, set);
      if (name === "happy") {
        svg("path", { d: `M${cx - 2} -59.4 q2 -2.8 4 0`, fill: "none", stroke: ROBOT.glow, "stroke-width": 1.4, "stroke-linecap": "round" }, set);
      } else if (name === "stern") {
        const [inner, outer] = cx < 0 ? [-61, -62] : [-62, -61];
        svg("path", { d: `M${cx - 2.2} ${outer} L${cx + 2.2} ${inner} V-58.6 H${cx - 2.2} Z`, fill: ROBOT.glow }, set);
      } else {
        svg("ellipse", { cx, cy: -60.2, rx: 2.1, ry: 2.6, fill: ROBOT.glow }, set);
        svg("circle", { cx: cx + 0.7, cy: -61.1, r: 0.6, fill: "#fff" }, set);
      }
    }
  }

  // peaked security cap with a gold badge
  el("path", { d: "M-10 -66 Q-11.5 -74 -3 -75 H3 Q11.5 -74 10 -66 Z", fill: ROBOT.cap });
  el("rect", { x: -10.2, y: -68.4, width: 20.4, height: 2.6, fill: ROBOT.dark, "stroke-width": 1 });
  el("path", { d: "M-9.5 -66 Q0 -63.4 9.5 -66 L10.5 -64.8 Q0 -61.2 -10.5 -64.8 Z", fill: INK });
  el("circle", { cx: 0, cy: -71, r: 1.5, fill: ROBOT.gold, "stroke-width": 0.8 });

  return {
    setEyes(name) {
      for (const [key, set] of Object.entries(eyeSets)) set.setAttribute("display", key === name ? "inline" : "none");
    },
    setFlashlight(on) {
      torch.setAttribute("display", on ? "inline" : "none");
    },
  };
}

// a speech bubble whose tail tip sits at (x, y)
function drawSpeech(parent, x, y, text) {
  const w = text.length * 3.1 + 8;
  const line = { stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" };
  svg("path", { d: `M${x - 2.4} ${y - 5} L${x} ${y} L${x + 2.4} ${y - 5} Z`, fill: "#fff", ...line }, parent);
  svg("rect", { x: x - w / 2, y: y - 17, width: w, height: 12.4, rx: 3.5, fill: "#fff", ...line }, parent);
  svg("rect", { x: x - 1.8, y: y - 5.6, width: 3.6, height: 1.4, fill: "#fff" }, parent);
  svg("text", {
    x, y: y - 8.9, "text-anchor": "middle", "font-size": 5.6, "font-weight": 700,
    "font-family": "Fredoka, system-ui, sans-serif", fill: INK,
  }, parent).textContent = text;
}

// Office lights: a dark wash over the room (but not the window), under the cats and the robot.
const lightsOff = svg("path", {
  class: "lights-off", d: "M-40 0 H320 V180 H-40 Z M36 8 V84 H222 V8 Z", "fill-rule": "evenodd", fill: "#1f2340",
});
catsLayer.parentNode.insertBefore(lightsOff, catsLayer);

const guard = {
  x: GUARD_DOOR.x, y: GUARD_DOOR.y, facing: 1, state: "away", timer: 0, noteTimer: 0,
  path: [], target: null, text: null, lightsOut: false,
};
guard.root = svg("g", { display: "none" }, catsLayer);
guard.body = svg("g", {}, guard.root);
guard.bot = drawRobot(guard.body);
guard.bubble = svg("g", { transform: `scale(${GUARD_SCALE})` }, guard.root);

function say(text, hold = 0) {
  guard.noteTimer = hold;
  if (text === guard.text) return;
  guard.text = text;
  guard.bubble.replaceChildren();
  if (text) drawSpeech(guard.bubble, 0, -88, text);
}

// Route to a point, going through the meeting-room door if it is on the other side of the glass.
function setGoal(point) {
  const from = inMeetingRoom(guard);
  if (from === inMeetingRoom(point)) guard.path = [point];
  else guard.path = from ? [MEETING_DOOR.in, MEETING_DOOR.out, point] : [MEETING_DOOR.out, MEETING_DOOR.in, point];
}

// While chasing, keep the route and just move its end, unless the goal crossed the glass.
function updateGoal(point) {
  const end = guard.path[guard.path.length - 1];
  if (!end || inMeetingRoom(end) !== inMeetingRoom(point)) setGoal(point);
  else guard.path[guard.path.length - 1] = point;
}

// Step along the route; true once the last point is reached.
function followPath(dt) {
  let step = GUARD_SPEED * dt;
  while (guard.path.length && step > 0) {
    const next = guard.path[0];
    const dx = next.x - guard.x;
    const dy = next.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) guard.facing = Math.sign(dx);
    if (dist <= step) {
      guard.x = next.x;
      guard.y = next.y;
      guard.path.shift();
      step -= dist;
    } else {
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      step = 0;
    }
  }
  return guard.path.length === 0;
}

// mostly the open office, sometimes a look round the meeting room
function patrolPoint() {
  if (Math.random() < 0.25) return { x: 250 + Math.random() * 50, y: 152 + Math.random() * 18 };
  return { x: -20 + Math.random() * 228, y: 150 + Math.random() * 20 };
}

function lateCats() {
  return cats.filter((cat) => !cat.leaving && cat.age > 1.2);
}

// stand just beside the cat, on whichever side has room, a little in front of it
function besideCat(cat) {
  const side = cat.x > 180 ? -1 : 1;
  return { x: cat.x + side * 26, y: Math.min(FLOOR.maxY, cat.y + 30), side };
}

function chase(cat) {
  guard.state = "chase";
  guard.target = cat;
  guard.bot.setEyes("stern");
  say(null);
  setGoal(besideCat(cat));
}

let guardLast = performance.now();
function guardFrame(now) {
  const dt = Math.min(0.1, (now - guardLast) / 1000);
  guardLast = now;
  const t = now / 1000;
  const onDuty = guardOnDuty();

  if (guard.state === "away" && onDuty) {
    guard.root.setAttribute("display", "inline");
    guard.x = GUARD_DOOR.x;
    guard.y = GUARD_DOOR.y;
    guard.state = "patrol";
    guard.bot.setEyes("patrol");
    setGoal(patrolPoint());
  } else if (guard.state !== "away" && guard.state !== "leave" && !onDuty) {
    guard.state = "leave";
    guard.bot.setEyes("happy");
    say(null);
    setGoal(GUARD_DOOR);
  }

  const late = lateCats();
  if ((guard.state === "patrol" || guard.state === "goodbye") && late.length) {
    late.sort((a, b) => Math.hypot(a.x - guard.x, a.y - guard.y) - Math.hypot(b.x - guard.x, b.y - guard.y));
    chase(late[0]);
  }

  let moving = false;
  if (guard.state === "chase") {
    const cat = guard.target;
    if (!cats.includes(cat) || cat.leaving) {
      guard.state = "patrol";
      guard.bot.setEyes("patrol");
      setGoal(patrolPoint());
    } else {
      const spot = besideCat(cat);
      updateGoal(spot);
      moving = !followPath(dt);
      if (!moving) {
        guard.facing = -spot.side;
        guard.state = "scold";
        guard.timer = 2.4;
        cat.scolded = true;
        say("Past 6 PM! Go home!");
      }
    }
  } else if (guard.state === "scold") {
    guard.timer -= dt;
    if (guard.timer <= 0) {
      const cat = guard.target;
      cat.scolded = false;
      if (cats.includes(cat)) goHome(cat);
      guard.target = null;
      const next = lateCats();
      if (next.length) chase(next[0]);
      else {
        guard.state = "goodbye";
        guard.timer = 2.6;
        guard.bot.setEyes("happy");
        say("Otsukaresama!");
      }
    }
  } else if (guard.state === "goodbye") {
    guard.timer -= dt;
    if (guard.timer <= 0) {
      guard.state = "patrol";
      guard.bot.setEyes("patrol");
      setGoal(patrolPoint());
    }
  } else if (guard.state === "patrol") {
    if (guard.noteTimer > 0) guard.noteTimer -= dt;
    else say(null);
    if (guard.timer > 0) guard.timer -= dt;
    else {
      moving = !followPath(dt);
      if (!moving) {
        setGoal(patrolPoint());
        guard.timer = 1 + Math.random() * 2;
      }
    }
  } else if (guard.state === "leave") {
    moving = !followPath(dt);
    if (!moving) {
      guard.state = "away";
      guard.root.setAttribute("display", "none");
    }
  }

  // lights out at night once the robot is patrolling an empty office; any cat turns them back on
  const night = document.body.dataset.sky === "night";
  const dark = night && guard.state === "patrol" && cats.length === 0;
  if (dark !== guard.lightsOut) {
    guard.lightsOut = dark;
    lightsOff.classList.toggle("on", dark);
    if (dark) say("Lights out!", 2);
  }

  guard.bot.setFlashlight(night && guard.state !== "away");
  const wobble = moving && !reduceMotion ? Math.sin(t * 9) * 1.2 : 0;
  guard.root.setAttribute("transform", `translate(${guard.x.toFixed(1)} ${guard.y.toFixed(1)})`);
  guard.body.setAttribute("transform", `rotate(${wobble.toFixed(2)}) scale(${-guard.facing * GUARD_SCALE} ${GUARD_SCALE})`);
  // keep the robot drawn above the cats
  if (catsLayer.lastChild !== guard.root) catsLayer.appendChild(guard.root);

  requestAnimationFrame(guardFrame);
}
requestAnimationFrame(guardFrame);
