# countdown

Countdown-to-6PM page with a cat meme whose mood tracks how close the
workday is to being over. Goal: simple and fast, like `profile`.

## Stack

- Plain HTML/CSS/JS, no framework, no build step — keep it that way, this is
  small enough not to need one
- Cat gifs were sourced once via the [Giphy API](https://developers.giphy.com/)
  and downloaded into `images/` — the deployed site does not call Giphy at
  runtime. Classified by expression in `memes.json`. Giphy's API terms
  require a "Powered by GIPHY" attribution (in `index.html`) for content
  sourced this way.

## Structure

- `index.html` — page shell
- `style.css` — layout/styling, Friday-night confetti animation
- `memes.json` — gifs classified by expression (`stage` 0–4 across the
  9am–6pm workday, `offClock` for outside-work-hours)
- `images/` — the gif files
- `script.js` — countdown/mood logic (9am start, 6pm target, off-clock state,
  Friday-evening confetti), meme picking, refresh scheduling

## Deployment

GitHub Pages, deployed from `main`, root directory. No build step.
