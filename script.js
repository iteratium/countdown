const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;
const QUOTE_REFRESH_MS = 5 * 60 * 1000;
const STAGE_LABELS = ["Dreading It", "Grumpy", "Hanging In There", "Winding Down", "Almost Free"];
const TITLE = "Cat Clock";

const moodEl = document.getElementById("mood");
const countdownEl = document.getElementById("countdown");
const untilEl = document.getElementById("until");
const clockEl = document.getElementById("clock");
const confettiEl = document.getElementById("confetti");
const quoteEl = document.getElementById("quote");
const progressEl = document.getElementById("progress");
const barPctEl = document.getElementById("bar-pct");
const barCaptionEl = document.getElementById("bar-caption");

const CONFETTI_COLORS = ["#f4a259", "#e07a5f", "#81b29a", "#f2cc8f", "#3d405b"];

const ACCENT_COLORS = {
  "stage-0": "#f4a259",
  "stage-1": "#e07a5f",
  "stage-2": "#81b29a",
  "stage-3": "#d99a2b",
  "stage-4": "#8e7dbe",
  offclock: "#81b29a",
  "offclock-friday": "#f2cc8f",
  weekend: "#e07a5f",
};

let quotes = null;
let currentKey = null;
let currentState = null;
let quoteTimer = null;

function workBounds(now) {
  const start = new Date(now);
  start.setHours(WORK_START_HOUR, 0, 0, 0);
  const end = new Date(now);
  end.setHours(WORK_END_HOUR, 0, 0, 0);
  return { start, end };
}

function isWorkday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function nextWorkStart(now) {
  const { start } = workBounds(now);
  if (now >= start) start.setDate(start.getDate() + 1);
  while (!isWorkday(start)) start.setDate(start.getDate() + 1);
  return start;
}

function formatHour(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Fredoka's digits are proportional, so wrap each one in a fixed-width slot
function countdownMarkup(text) {
  return text.replace(/\d/g, '<span class="digit">$&</span>');
}

function remainingText(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m || !h) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return `${parts.join(" ")} left`;
}

// "See you at 9:00 AM" / "See you tomorrow at 9:00 AM" / "See you Monday at 9:00 AM"
function offClockMessage(now, next) {
  const at = `at ${formatHour(next)}`;
  if (next.toDateString() === now.toDateString()) return `See you ${at}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (next.toDateString() === tomorrow.toDateString()) return `See you tomorrow ${at}`;
  return `See you ${next.toLocaleDateString([], { weekday: "long" })} ${at}`;
}

function dayProgress(now, state) {
  if (state.weekend) return 0;
  const { start, end } = workBounds(now);
  const ratio = (now - start) / (end - start);
  return Math.min(100, Math.max(0, ratio * 100));
}

function computeState(now) {
  const { start, end } = workBounds(now);
  const stageCount = STAGE_LABELS.length;
  const workday = isWorkday(now);

  if (workday && now >= start && now < end) {
    const progress = (now - start) / (end - start);
    const stage = Math.min(stageCount - 1, Math.floor(progress * stageCount));
    return {
      key: `stage-${stage}`,
      label: STAGE_LABELS[stage],
      working: true,
      friday: false,
      weekend: false,
    };
  }

  const friday = now.getDay() === 5 && now.getHours() >= WORK_END_HOUR;
  const weekend = !workday;
  return {
    key: friday ? "offclock-friday" : weekend ? "weekend" : "offclock",
    label: friday ? "TGIF" : weekend ? "Weekend" : "Off the Clock",
    working: false,
    friday,
    weekend,
  };
}

function pickQuote(key) {
  const pool = quotes[key] || quotes.offclock;
  quoteEl.textContent = pool[Math.floor(Math.random() * pool.length)];
}

function scheduleQuoteRefresh(state) {
  clearTimeout(quoteTimer);
  quoteTimer = setTimeout(() => {
    pickQuote(state.key);
    scheduleQuoteRefresh(state);
  }, QUOTE_REFRESH_MS);
}

function launchConfetti() {
  confettiEl.innerHTML = "";
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${3 + Math.random() * 3}s`;
    piece.style.animationDelay = `-${Math.random() * 6}s`;
    confettiEl.appendChild(piece);
  }
}

function clearConfetti() {
  confettiEl.innerHTML = "";
}

function applyState(state) {
  currentState = state;
  if (state.key === currentKey) return;
  currentKey = state.key;
  moodEl.textContent = state.label;
  document.body.classList.toggle("friday-night", state.friday);
  document.body.dataset.clock = state.working ? "on" : "off";
  document.body.dataset.mood = state.key;
  document.documentElement.style.setProperty("--accent", ACCENT_COLORS[state.key]);
  if (state.friday) launchConfetti();
  else clearConfetti();
  pickQuote(state.key);
  scheduleQuoteRefresh(state);
}

// the caption under the loading bar, in the spirit of "cat loading… please wait"
const BAR_CAPTIONS = {
  "stage-0": "Motivation loading… please wait",
  "stage-1": "Coffee loading… please wait",
  "stage-2": "Freedom loading… please wait",
  "stage-3": "Freedom loading… nearly there",
  "stage-4": "Freedom loading… almost done!",
};

function barCaption(state, now, lunch) {
  if (lunch) return "Lunch break: refuelling… 🍚";
  if (state.working) return BAR_CAPTIONS[state.key];
  if (state.weekend) return "Weekend mode: 100% ✓";
  if (state.friday) return "TGIF: 100% ✓";
  if (now.getHours() < WORK_START_HOUR) return `Workday starts loading at ${formatHour(workBounds(now).start)}`;
  return "Freedom: 100% ✓";
}

function tick() {
  const now = new Date();
  const state = computeState(now);
  applyState(state);

  // on the clock count down to 6 PM; off the clock count down to the next 9 AM
  if (state.working) {
    const end = workBounds(now).end;
    const remaining = formatCountdown(end - now);
    countdownEl.innerHTML = countdownMarkup(remaining);
    untilEl.textContent = `left until ${formatHour(end)}`;
    progressEl.setAttribute("aria-valuetext", remainingText(end - now));
    document.title = `${remaining} · ${TITLE}`;
  } else {
    const next = nextWorkStart(now);
    const message = offClockMessage(now, next);
    countdownEl.innerHTML = countdownMarkup(formatCountdown(next - now));
    untilEl.textContent = message;
    progressEl.setAttribute("aria-valuetext", `${state.label}. ${message}`);
    document.title = `${state.label} · ${TITLE}`;
  }
  clockEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const hour = now.getHours();
  const lunch = state.working && hour >= LUNCH_START_HOUR && hour < LUNCH_END_HOUR;
  const lunchSoon = state.working && hour === LUNCH_START_HOUR - 1 && now.getMinutes() >= 30;
  document.body.dataset.lunch = lunch ? "on" : lunchSoon ? "soon" : "off";

  const percent = dayProgress(now, state);
  progressEl.setAttribute("aria-valuenow", Math.round(percent));
  // the loading bar sits full after hours and at weekends, and empty before 9 AM
  const barPercent = state.working ? percent : now.getHours() < WORK_START_HOUR && !state.weekend ? 0 : 100;
  progressEl.style.setProperty("--bar-percent", barPercent);
  barPctEl.textContent = state.working ? `${Math.floor(barPercent)}%` : barPercent === 100 ? "100% ✓" : "0%";
  barCaptionEl.textContent = barCaption(state, now, lunch);
  // at lunch the walker stops at the rice bowl; the paw trail keeps real time
  const lunchMid = ((LUNCH_START_HOUR + LUNCH_END_HOUR) / 2 - WORK_START_HOUR) / (WORK_END_HOUR - WORK_START_HOUR) * 100;
  progressEl.style.setProperty("--walker-pos", lunch ? lunchMid : barPercent);
}

const { start: dayStart, end: dayEnd } = workBounds(new Date());
document.getElementById("label-start").textContent = formatHour(dayStart);
document.getElementById("label-end").textContent = formatHour(dayEnd);

const workHours = WORK_END_HOUR - WORK_START_HOUR;
progressEl.style.setProperty("--lunch-start", ((LUNCH_START_HOUR - WORK_START_HOUR) / workHours) * 100);
progressEl.style.setProperty("--lunch-end", ((LUNCH_END_HOUR - WORK_START_HOUR) / workHours) * 100);

// "How it works" pop-up: open from the button under the office; Esc, ✕ or a click outside closes it
const aboutEl = document.getElementById("about");
document.getElementById("about-open").addEventListener("click", () => aboutEl.showModal());
aboutEl.addEventListener("click", (event) => {
  if (event.target === aboutEl) aboutEl.close();
});

fetch("quotes.json").then((res) => res.json()).then((quotesData) => {
  quotes = quotesData;
  tick();
  setInterval(tick, 1000);
});
