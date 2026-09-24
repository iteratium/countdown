const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;
const REFRESH_CAP_MS = 15 * 60 * 1000;
const TITLE = "Cat Clock";

const catEl = document.getElementById("cat");
const memeImg = document.getElementById("meme");
const moodEl = document.getElementById("mood");
const countdownEl = document.getElementById("countdown");
const clockEl = document.getElementById("clock");
const confettiEl = document.getElementById("confetti");
const quoteEl = document.getElementById("quote");
const progressEl = document.getElementById("progress");
const sunEl = document.getElementById("sun");

const CONFETTI_COLORS = ["#f4a259", "#e07a5f", "#81b29a", "#f2cc8f", "#3d405b"];

const ACCENT_COLORS = {
  "stage-0": "#f4a259",
  "stage-1": "#e07a5f",
  "stage-2": "#81b29a",
  "stage-3": "#f2cc8f",
  "stage-4": "#3d405b",
  offclock: "#81b29a",
  "offclock-friday": "#f2cc8f",
  weekend: "#e07a5f",
};

let memes = null;
let quotes = null;
let currentKey = null;
let currentState = null;
let memeTimer = null;

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

function offClockMessage(now) {
  const next = nextWorkStart(now);
  if (next.toDateString() === now.toDateString()) return `See you at ${formatHour(next)}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (next.toDateString() === tomorrow.toDateString()) return "See you tomorrow";
  return `See you ${next.toLocaleDateString([], { weekday: "long" })}`;
}

function dayProgress(now, state) {
  if (state.weekend) return 0;
  const { start, end } = workBounds(now);
  const ratio = (now - start) / (end - start);
  return Math.min(100, Math.max(0, ratio * 100));
}

function computeState(now) {
  const { start, end } = workBounds(now);
  const stageCount = memes.stageLabels.length;
  const workday = isWorkday(now);

  if (workday && now >= start && now < end) {
    const progress = (now - start) / (end - start);
    const stage = Math.min(stageCount - 1, Math.floor(progress * stageCount));
    return {
      key: `stage-${stage}`,
      label: memes.stageLabels[stage],
      pool: memes.images.filter((img) => img.stage === stage),
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
    pool: memes.images.filter((img) => img.offClock),
    working: false,
    friday,
    weekend,
  };
}

function pickMeme(pool) {
  const choice = pool[Math.floor(Math.random() * pool.length)];
  memeImg.src = `images/${choice.file}`;
  memeImg.alt = choice.alt;
  memeImg.classList.remove("pop");
  void memeImg.offsetWidth;
  memeImg.classList.add("pop");
}

function pickQuote(key) {
  const pool = quotes[key] || quotes.offclock;
  quoteEl.textContent = pool[Math.floor(Math.random() * pool.length)];
}

function pickContent(state) {
  pickMeme(state.pool);
  pickQuote(state.key);
}

function scheduleMemeRefresh(state) {
  clearTimeout(memeTimer);
  const interval = REFRESH_CAP_MS / state.pool.length;
  memeTimer = setTimeout(() => {
    pickContent(state);
    scheduleMemeRefresh(state);
  }, interval);
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
  countdownEl.classList.toggle("off", !state.working);
  sunEl.textContent = state.working ? "☀️" : "\u{1F319}";
  document.documentElement.style.setProperty("--accent", ACCENT_COLORS[state.key]);
  if (state.friday) launchConfetti();
  else clearConfetti();
  pickContent(state);
  scheduleMemeRefresh(state);
}

function nextMeme() {
  if (!currentState) return;
  pickContent(currentState);
  scheduleMemeRefresh(currentState);
}

catEl.addEventListener("click", nextMeme);
catEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  nextMeme();
});

function tick() {
  const now = new Date();
  const state = computeState(now);
  applyState(state);

  if (state.working) {
    const remaining = formatCountdown(workBounds(now).end - now);
    countdownEl.textContent = remaining;
    document.title = `${remaining} · ${TITLE}`;
  } else {
    countdownEl.textContent = offClockMessage(now);
    document.title = `${state.label} · ${TITLE}`;
  }
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const hour = now.getHours();
  const lunch = state.working && hour >= LUNCH_START_HOUR && hour < LUNCH_END_HOUR;
  const lunchSoon = state.working && hour === LUNCH_START_HOUR - 1 && now.getMinutes() >= 30;
  document.body.dataset.lunch = lunch ? "on" : lunchSoon ? "soon" : "off";

  const percent = dayProgress(now, state);
  progressEl.setAttribute("aria-valuenow", Math.round(percent));
  progressEl.style.setProperty("--percent", percent);
  progressEl.style.setProperty("--sun-pos", state.working ? percent : 50);
  progressEl.style.setProperty("--sun-lift", state.working ? Math.sin((Math.PI * percent) / 100) : 1);
}

const { start: dayStart, end: dayEnd } = workBounds(new Date());
document.getElementById("label-start").textContent = formatHour(dayStart);
document.getElementById("label-end").textContent = formatHour(dayEnd);

Promise.all([
  fetch("memes.json").then((res) => res.json()),
  fetch("quotes.json").then((res) => res.json()),
]).then(([memesData, quotesData]) => {
  memes = memesData;
  quotes = quotesData;
  tick();
  setInterval(tick, 1000);
});
