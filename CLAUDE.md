# countdown

Countdown-to-6PM page with an animated cat office whose mood tracks how close
the workday is to being over. Goal: simple and fast, like `profile`.

## Stack

- Plain HTML/CSS/JS, no framework, no build step — keep it that way, this is
  small enough not to need one
- Everything on the page is drawn in inline SVG/CSS (v3 dropped the Giphy
  gifs, so there is no Giphy attribution any more). `images/` and
  `memes.json` are leftovers from v2 and are not used.
- Weather: Open-Meteo, fixed to Tokyo, called straight from the browser (no
  key). The footer credit is required by its CC BY 4.0 licence — keep it.

## Structure

- `index.html` — page shell, plus the office SVG scene: a 2:1 room
  (`viewBox="-40 0 360 180"`) with the coffee corner on the far left, desks
  under the Tokyo skyline window, and a meeting room on the right behind a
  glass wall. Cats only cross that wall through its door (`walkTo` in
  `office.js` routes them via `MEETING_DOOR`). Also holds the "How it works"
  `<dialog>` (opened from the button under the office) that describes every
  feature for visitors: keep it in sync when features change.
- `style.css` — layout/styling, sky/weather states keyed off `data-sky` and
  `data-weather`, Friday-night confetti animation
- `quotes.json` — mood-matched quotes, keyed by mood stage
- `script.js` — countdown/mood logic (9am start, 6pm target, weekends,
  lunch 12–1, off-clock state, Friday-evening confetti), quote picking. Sets
  `data-clock`, `data-mood` and `data-lunch` on `<body>` for the office.
  Also drives the "loading" progress bar: fill percentage, the cat riding
  it, and the mood-matched caption ("Freedom loading… please wait").
- `office.js` — the cat office: cats walk between desks, coffee, meetings and
  lunch. Round-headed coloured cats with 20 doodle expressions (incl. three
  kinds of crying); each cat picks its own mood from a per-stage mix.
  `makeHead()` also draws the progress-bar walker. Defines the global `svg()` helper.
- `sky.js` — Tokyo sky: time of day from Tokyo sunrise/sunset, weather from
  Open-Meteo every 15 min. Sets `data-sky` and `data-weather` on `<body>`
  and writes "Tokyo 29°C, clear" into the clock line under the countdown;
  `?sky=…&weather=…` previews a state. Loads after `office.js` (uses `svg()`).
- `guard.js` — Keibi-kun, the security-guard robot. After 6 PM on workdays
  (`guardOnDuty()` in `office.js`) cats keep working late; the robot rolls in,
  sends each one home, then patrols (flashlight at night) and turns the office
  lights off once it is empty at night. Loads last; uses `office.js` globals.

## Deployment

GitHub Pages, deployed from `main`, root directory. No build step.
