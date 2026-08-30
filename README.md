# countdown

A tiny page that counts down to 6 PM (local time) and shows a cat meme whose
mood tracks how close the workday is to being over — grumpy in the morning,
happy as 6 PM approaches.

Live at [TBD].

## Stack

- Plain HTML/CSS/JS, no build step
- Cat gifs were sourced once via the [Giphy API](https://developers.giphy.com/)
  (by mood-related search term) and downloaded into `images/` — the deployed
  site never calls Giphy itself, so there's no runtime rate limit to worry
  about. Classification lives in `memes.json`.
- Giphy's API terms require a "Powered by GIPHY" attribution when displaying
  content sourced through it — see the link at the bottom of the page.
- Some gifs are multi-MB; only the currently displayed one is ever fetched,
  but a mood switch can still pull a few MB over the wire.
- 60 gifs total (12 per mood stage), ~85MB in `images/` — repo clones are
  heavier than the page itself, since only one gif loads per visit.

## Structure

- `index.html` — page shell
- `style.css` — layout/styling, plus the Friday-night confetti animation
- `memes.json` — cat gifs classified by expression (`stage` 0–4 on the
  workday mood scale, `offClock` for outside-work-hours images)
- `images/` — the gif files themselves
- `script.js` — countdown/mood logic, meme picking, confetti trigger

## How the mood works

- **Workday (9 AM–6 PM local time):** mood scales from "Dreading It" at 9 AM
  to "Almost Free" as 6 PM approaches, in 5 stages. Each stage pulls from the
  matching pool of gifs in `memes.json`.
- **Off the clock (evenings, before 9 AM):** a distinct mood, pulling from
  the `offClock` pool, not part of the 9–6 scale.
- **Friday evening (Friday, 6 PM–midnight):** same off-the-clock pool, plus
  a "TGIF" label and a confetti effect.
- **Meme refresh rate:** every mood has its own pool of matching gifs. The
  refresh interval is `15 minutes ÷ pool size`, so moods with more gifs cycle
  faster (more variety), capped at 15 minutes for a pool of one.
- The countdown itself always targets the next 6 PM (today's if it hasn't
  passed yet, otherwise tomorrow's).

Assumption: every day uses the same 9 AM–6 PM window, weekends included —
say if you want weekends handled differently.

## Local development

Serve the directory with anything static (a plain `file://` open won't work
since `script.js` fetches `memes.json`):

```sh
python3 -m http.server -d . 8000
```

## Deployment

GitHub Pages, from this repo:

- Settings → Pages → Source: Deploy from a branch → `main`, folder `/ (root)`
- No build step — it's served as-is
