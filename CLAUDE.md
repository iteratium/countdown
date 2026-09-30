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
- `cats.json` — the cats' personalities (`cats`: 12 names, each with a tagline and its
  own lines per situation) and `shared` lines that know the time of day (`work` is
  keyed by mood stage). A line may have two rows split by `\n`. `office.js` loads it
  (`talk()`, `pickLine()`); clicking a cat talks, clicking anywhere else hires a cat.
  Names come from the keys of `cats`, so keep at least `MAX_CATS` of them.
- `script.js` — countdown/mood logic (9am start, 6pm target, weekends,
  lunch 12–1, off-clock state, Friday-evening confetti), quote picking. Sets
  `data-clock`, `data-mood` and `data-lunch` on `<body>` for the office.
  Also drives the "loading" progress bar: fill percentage, the cat riding
  it, and the mood-matched caption ("Freedom loading… please wait").
- `office.js` — the cat office: cats walk between desks, coffee, meetings and
  lunch. Round-headed coloured cats with 20 doodle expressions (incl. three
  kinds of crying); each cat picks its own mood from a per-stage mix that its
  personality tilts. `PERSONAS` holds the 12 cats: coat colour, face lean, silliness
  (names must match the keys in `cats.json`).
  Cats spread out so faces stay readable: coffee has 4 standing slots
  (`coffeeSlots`), wandering and lunch spots come from `spreadPoint()` (furthest from
  other cats, by `crowding()`), and a resting cat stacked on another moves along
  (`moveIfCrowded()`). `makeHead()` also draws the progress-bar walker. Defines the global `svg()` helper.
- `sky.js` — Tokyo sky: time of day from Tokyo sunrise/sunset, weather from
  Open-Meteo every 15 min. Sets `data-sky` and `data-weather` on `<body>`
  and writes "Tokyo 29°C, clear" into the clock line under the countdown;
  `?sky=…&weather=…` previews a state. Loads after `office.js` (uses `svg()`).
- `season.js` — seasonal decor: sets `data-season` on `<body>` (`autumn` Sep–Nov,
  `halloween` Sep 25–Oct 31; `?season=…` previews) and draws the maple garland and
  falling leaves. The rest of the decor (cobwebs, pumpkins, bats, cat and Keibi-kun witch hats, and the meeting room
  bunting/ghosts/spider/candy) is
  in `index.html`/`office.js` and shown by `style.css` off `data-season`. Loads
  after `sky.js` (uses `svg()`, `WIN`, `rand`, `preview`). The maple leaf shape
  (`#maple`, `#maple-veins`) is defined once in `index.html`'s `<defs>`; the office
  plant (a potted maple), the garland and the falling leaves all `<use>` it.
- `guard.js` — Keibi-kun, the security-guard robot. After 6 PM on workdays
  (`guardOnDuty()` in `office.js`) cats keep working late; the robot rolls in,
  sends each one home, then patrols (flashlight at night) and turns the office
  lights off once it is empty at night. Loads last; uses `office.js` globals.

## Deployment

GitHub Pages, deployed from `main`, root directory. No build step.
