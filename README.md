# countdown

A tiny page that counts down to 6 PM (local time) and shows an animated cat
office whose mood tracks how close the workday is to being over — dreading it
in the morning, excited as 6 PM approaches.

Live at [countdown.ketwork.in](https://countdown.ketwork.in).

## Stack

- Plain HTML/CSS/JS, no build step
- Everything is drawn in inline SVG/CSS — no images or gifs are loaded
  (v3 dropped the Giphy gifs, so the Giphy attribution is gone too).
- Live Tokyo weather from [Open-Meteo](https://open-meteo.com/) — free, no
  API key; its CC BY 4.0 licence needs the credit in the page footer.

## Structure

- `index.html` — page shell and the office SVG scene (Tokyo skyline window)
- `style.css` — layout/styling, sky and weather looks, Friday-night confetti
- `quotes.json` — quotes per mood stage
- `script.js` — countdown/mood logic and quote picking
- `office.js` — the animated cat office
- `sky.js` — the Tokyo sky outside the window: time of day and live weather
- `guard.js` — Keibi-kun, the security-guard robot that sends late workers home

## How the mood works

- **Workday (9 AM–6 PM local time):** mood scales from "Dreading It" at 9 AM
  to "Almost Free" as 6 PM approaches, in 5 stages. Each office cat picks its own
  mood when it sits down, from a mix that brightens through the day (sleepy
  and grumpy in the morning, happy and excited near 6), and they take a lunch
  break from 12 to 1.
- **Off the clock (evenings, weekends, before 9 AM):** a distinct mood, with
  a countdown to the next 9 AM. On weekday evenings the cats keep working
  late until Keibi-kun, the security-guard robot, rolls in and sends each one home; then
  it patrols (with a flashlight at night) and turns the office lights off
  once everyone has gone. At weekends cats only drop by briefly.
- **Friday evening (Friday, 6 PM–midnight):** same off-the-clock state, plus
  a "TGIF" label and a confetti effect.
- **Quote refresh:** a new mood-matched quote every 5 minutes.
- The countdown itself always targets the next 6 PM (today's if it hasn't
  passed yet, otherwise tomorrow's).

Weekends are treated as off the clock all day.

## The skyline

The window shows Tokyo as it is right now. Dawn, day, dusk and night follow
Tokyo's real sunrise and sunset, with the sun and moon crossing the sky. The
weather (clear, partly cloudy, cloudy, fog, rain, snow, thunderstorm) comes
from Open-Meteo every 15 minutes. After dusk the city windows, Tokyo Tower's
floodlights, the aircraft beacons and the Rainbow Bridge's lights come on.

Preview any combination with query parameters, e.g. `?sky=dusk&weather=rain`
(`sky`: dawn, day, dusk, night; `weather`: clear, partly, cloudy, fog, rain,
snow, storm).

## How it works (on the page)

The "ⓘ How it works" button under the office opens a pop-up that walks visitors
through everything above: the countdown, the loading bar, the office, the cat
moods, the Tokyo skyline and Keibi-kun, plus links that preview the sky in
different weather.

## Author

Designed, sketched and built by [Akanksha Vani](https://jp.linkedin.com/in/akanksha-vani).

## Local development

Serve the directory with anything static (a plain `file://` open won't work
since `script.js` fetches `quotes.json`):

```sh
python3 -m http.server -d . 8000
```

## Deployment

GitHub Pages, from this repo:

- Settings → Pages → Source: Deploy from a branch → `main`, folder `/ (root)`
- No build step — it's served as-is
- Custom domain: `countdown.ketwork.in` (see `CNAME`). Needs a DNS `CNAME`
  record for `countdown` pointing at `iteratium.github.io`, plus "Enforce
  HTTPS" ticked in Settings → Pages once DNS has propagated.
