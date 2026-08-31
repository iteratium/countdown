const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const REFRESH_CAP_MS = 15 * 60 * 1000;

const memeImg = document.getElementById("meme");
const moodEl = document.getElementById("mood");
const countdownEl = document.getElementById("countdown");
const clockEl = document.getElementById("clock");
const confettiEl = document.getElementById("confetti");
const quoteEl = document.getElementById("quote");

const CONFETTI_COLORS = ["#f4a259", "#e07a5f", "#81b29a", "#f2cc8f", "#3d405b"];

let memes = null;
let quotes = null;
let currentKey = null;
let memeTimer = null;

function workBounds(now) {
  const start = new Date(now);
  start.setHours(WORK_START_HOUR, 0, 0, 0);
  const end = new Date(now);
  end.setHours(WORK_END_HOUR, 0, 0, 0);
  return { start, end };
}

function nextWorkEnd(now) {
  const { end } = workBounds(now);
  if (now >= end) end.setDate(end.getDate() + 1);
  return end;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeState(now) {
  const { start, end } = workBounds(now);
  const stageCount = memes.stageLabels.length;

  if (now >= start && now < end) {
    const progress = (now - start) / (end - start);
    const stage = Math.min(stageCount - 1, Math.floor(progress * stageCount));
    return {
      key: `stage-${stage}`,
      label: memes.stageLabels[stage],
      pool: memes.images.filter((img) => img.stage === stage),
      friday: false,
    };
  }

  const friday = now.getDay() === 5 && now.getHours() >= WORK_END_HOUR;
  return {
    key: friday ? "offclock-friday" : "offclock",
    label: friday ? "TGIF" : "Off the Clock",
    pool: memes.images.filter((img) => img.offClock),
    friday,
  };
}

function pickMeme(pool) {
  const choice = pool[Math.floor(Math.random() * pool.length)];
  memeImg.src = `images/${choice.file}`;
  memeImg.alt = choice.alt;
}

function pickQuote(key) {
  const pool = quotes[key];
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
  if (state.key === currentKey) return;
  currentKey = state.key;
  moodEl.textContent = state.label;
  document.body.classList.toggle("friday-night", state.friday);
  if (state.friday) launchConfetti();
  else clearConfetti();
  pickContent(state);
  scheduleMemeRefresh(state);
}

function tick() {
  const now = new Date();
  countdownEl.textContent = formatCountdown(nextWorkEnd(now) - now);
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  applyState(computeState(now));
}

Promise.all([
  fetch("memes.json").then((res) => res.json()),
  fetch("quotes.json").then((res) => res.json()),
]).then(([memesData, quotesData]) => {
  memes = memesData;
  quotes = quotesData;
  tick();
  setInterval(tick, 1000);
});
