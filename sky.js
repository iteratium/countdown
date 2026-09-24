// The Tokyo sky outside the office window. Time of day follows Tokyo's sunrise and
// sunset; weather comes from Open-Meteo (free, no key, CORS-enabled). Sets data-sky
// (dawn/day/dusk/night) and data-weather on <body>; style.css does the rest.
// Preview any state with ?sky=dusk&weather=rain (weather: clear, partly, cloudy, fog,
// rain, snow, storm). svg() comes from office.js, which loads first.
const TOKYO_TZ = "Asia/Tokyo";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=35.6762&longitude=139.6503" +
  "&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=Asia%2FTokyo&forecast_days=1";
const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const TWILIGHT_MIN = 45;
const WIN = { x: 36, y: 8, w: 186, h: 76 };
const RAINBOW = ["#e07a5f", "#f4a259", "#f2cc8f", "#81b29a", "#7cc4e4", "#8e7dbe"];

const WEATHER_TEXT = {
  0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 56: "freezing drizzle", 57: "freezing drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
  80: "showers", 81: "showers", 82: "heavy showers", 85: "snow showers", 86: "snow showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with hail",
};

const preview = new URLSearchParams(location.search);
const PREVIEW_TEXT = {
  clear: "clear", partly: "partly cloudy", cloudy: "overcast", fog: "fog", rain: "rain", snow: "snow", storm: "thunderstorm",
};
const sunEl = document.getElementById("sky-sun");
const moonEl = document.getElementById("sky-moon");
const weatherEl = document.getElementById("weather");
const weatherTextEl = document.getElementById("weather-text");
const tokyoParts = new Intl.DateTimeFormat("en-US", { timeZone: TOKYO_TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" });
const tokyoTime = new Intl.DateTimeFormat([], { timeZone: TOKYO_TZ, hour: "numeric", minute: "2-digit" });

// until the forecast arrives, assume a 6am sunrise and 6pm sunset
let sunrise = 6 * 60;
let sunset = 18 * 60;
let weather = null;

function tokyoMinutes(date) {
  const parts = Object.fromEntries(tokyoParts.formatToParts(date).map((p) => [p.type, p.value]));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

// Open-Meteo returns Tokyo-local times like "2026-09-24T05:32"
function clockMinutes(iso) {
  return Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
}

function weatherKind(code) {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "rain";
}

function skyPhase(m) {
  if (m < sunrise - TWILIGHT_MIN || m > sunset + TWILIGHT_MIN) return "night";
  if (m < sunrise + TWILIGHT_MIN) return "dawn";
  if (m < sunset - TWILIGHT_MIN) return "day";
  return "dusk";
}

// f runs 0..1 from rising to setting; the body sinks behind the bay at either end
function placeOnArc(el, f) {
  const t = Math.min(1.05, Math.max(-0.05, f));
  const x = WIN.x + 12 + t * (WIN.w - 24);
  const y = 78 - Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 60;
  el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
}

const PREVIEW_ARC = { dawn: 0.04, day: 0.35, dusk: 0.96, night: 0.4 };

function update() {
  const now = new Date();
  const m = tokyoMinutes(now);
  const phase = PREVIEW_ARC[preview.get("sky")] !== undefined ? preview.get("sky") : skyPhase(m);
  const previewing = preview.has("sky");
  const day = sunset - sunrise;
  const night = 1440 - day;
  placeOnArc(sunEl, previewing ? PREVIEW_ARC[phase] : (m - sunrise) / day);
  placeOnArc(moonEl, previewing ? PREVIEW_ARC[phase] : ((m - sunset + 1440) % 1440) / night);

  const kind = preview.get("weather") || (weather ? weatherKind(weather.code) : "clear");
  document.body.dataset.sky = phase;
  document.body.dataset.weather = kind;

  // "Tokyo 29°C, clear" on the clock line, plus Tokyo's time when the viewer is elsewhere
  // a ?weather= preview describes the previewed weather, not the live reading
  if (weather) {
    const described = preview.has("weather") ? `${PREVIEW_TEXT[kind] || kind} (preview)` : WEATHER_TEXT[weather.code] || kind;
    let text = `Tokyo ${Math.round(weather.temp)}°C, ${described}`;
    if (tokyoMinutes(now) !== now.getHours() * 60 + now.getMinutes()) text += ` (${tokyoTime.format(now)} there)`;
    weatherTextEl.textContent = text;
    weatherEl.hidden = false;
  }
}

async function loadWeather() {
  try {
    const res = await fetch(WEATHER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    weather = { code: data.current.weather_code, temp: data.current.temperature_2m };
    sunrise = clockMinutes(data.daily.sunrise[0]);
    sunset = clockMinutes(data.daily.sunset[0]);
  } catch {
    // keep the last known weather; the sky still follows the clock
  }
  update();
}

const rand = (min, max) => min + Math.random() * (max - min);

function buildSky() {
  const stars = document.getElementById("sky-stars");
  for (let i = 0; i < 24; i++) {
    svg("circle", {
      class: "star", cx: rand(WIN.x + 2, WIN.x + WIN.w - 2).toFixed(1), cy: rand(WIN.y + 2, 46).toFixed(1),
      r: rand(0.35, 0.8).toFixed(2), style: `animation-delay: ${-rand(0, 4).toFixed(1)}s`,
    }, stars);
  }

  // each drop is drawn twice, one window-height apart, so the falling layer loops seamlessly
  const rain = document.querySelector(".rain-fall");
  for (let i = 0; i < 48; i++) {
    const x = rand(WIN.x, WIN.x + WIN.w + 6);
    const y = rand(WIN.y, WIN.y + WIN.h);
    for (const dy of [0, -WIN.h]) svg("path", { d: `M${x.toFixed(1)} ${(y + dy).toFixed(1)} l-1.4 4.5` }, rain);
  }
  const snow = document.querySelector(".snow-fall");
  for (let i = 0; i < 36; i++) {
    const x = rand(WIN.x, WIN.x + WIN.w);
    const y = rand(WIN.y, WIN.y + WIN.h);
    const r = rand(0.5, 1.1).toFixed(2);
    for (const dy of [0, -WIN.h]) svg("circle", { cx: x.toFixed(1), cy: (y + dy).toFixed(1), r }, snow);
  }

  const drops = document.getElementById("glass-drops");
  for (let i = 0; i < 14; i++) {
    svg("ellipse", {
      class: "glass-drop", cx: rand(WIN.x + 3, WIN.x + WIN.w - 3).toFixed(1), cy: rand(WIN.y + 4, WIN.y + WIN.h - 8).toFixed(1),
      rx: 0.7, ry: 1, style: `animation-delay: ${-rand(0, 5).toFixed(1)}s`,
    }, drops);
  }

  // points along the Rainbow Bridge's cables, then evenly along the deck
  const cable = [
    [119.9, 57.9], [127.5, 53.5], [134.9, 46.9], [146.8, 42.7], [154, 47.8], [166, 51],
    [178, 47.8], [185.2, 42.7], [197.4, 46.8], [205.5, 53], [214.4, 56.8],
  ];
  const lights = document.getElementById("bridge-lights");
  cable.forEach(([cx, cy], i) => svg("circle", {
    class: "bridge-light", cx, cy, r: 0.9, fill: RAINBOW[i % RAINBOW.length], style: `animation-delay: ${(-i * 0.25).toFixed(2)}s`,
  }, lights));
  for (let x = 114; x <= 222; x += 9) svg("circle", { class: "deck-light", cx: x, cy: 63.5, r: 0.6, fill: "#f2cc8f" }, lights);
}

buildSky();
update();
loadWeather();
setInterval(update, 60 * 1000);
setInterval(loadWeather, WEATHER_REFRESH_MS);
