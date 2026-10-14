# Web Experiments

An [Astro](https://astro.build) site for showing off small web experiments. Each experiment lives in its own folder. It gets a shared header (with a back button to the index) and a card on the homepage. The card shows a screenshot that is captured automatically at build time.

## Getting started

The quickest way is the included dev container: open the repo in VS Code and choose **Reopen in Container**, or start a GitHub Codespace. Dependencies and Chromium are installed for you. Then run `npm run dev`.

To set it up locally instead:

```sh
npm install
npx playwright install chromium   # needed for build-time screenshots
npm run dev                       # http://localhost:4321
```

| Command                         | What it does                                     |
| ------------------------------- | ------------------------------------------------ |
| `npm run dev`                   | Start the dev server                             |
| `npm run build`                 | Build to `dist/` and screenshot every experiment |
| `npm run preview`               | Serve the built site                             |
| `npm run new -- <slug> "Title"` | Scaffold a new experiment                        |
| `npm run check`                 | Type-check the project                           |
| `npm run format`                | Format with Prettier                             |

## Adding an experiment

```sh
npm run new -- my-idea "My Idea"
```

This creates `src/experiments/my-idea/` with two files:

- **`meta.ts`**: the title, description, date and tags shown in the header and on the homepage card.
- **`index.astro`**: the experiment itself. Use plain HTML/CSS, a `<script>` tag, canvas, WebGL, or whatever you like. Styles are scoped to the experiment.

The experiment is served at `/experiments/my-idea/` and appears on the homepage automatically. Experiments are sorted newest first by `date`. You can put any other files you need (shaders, modules, images) in the same folder and import them from `index.astro`.

The experiment renders inside `<main id="experiment">`. This element fills the viewport below the header and is `position: relative`, so `position: absolute; inset: 0` gives you a full-bleed stage.

## Screenshots

After `astro build`, the `integrations/screenshots.ts` integration serves `dist/`. It opens each experiment in headless Chromium at 1280×800 in dark mode and saves `dist/screenshots/<slug>.jpg`. The homepage cards use these images. When a screenshot is missing (for example in `astro dev`), the card shows a placeholder instead.

- Pages are loaded with `?screenshot`, which hides the shared header and sets `data-screenshot` on `<html>`. An experiment can check `document.documentElement.hasAttribute('data-screenshot')` to adjust itself, for example to skip an intro animation.
- Set `screenshotDelay` (ms) in `meta.ts` if the experiment needs longer to settle before capture.
- Set `SKIP_SCREENSHOTS=1` to skip capture. Set `CHROMIUM_PATH=/path/to/chrome` to use a specific browser binary.
