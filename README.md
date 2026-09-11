# Ian Milkowski — creative portfolio

A static portfolio for GitHub Pages. The redesign preserves the original dark palette, Playfair Display / Instrument Sans typography, twelve projects, and their source artwork. Ciało and Milkplexity have dedicated identity pages, and The Training Room includes the supplied 2027 retreat artwork alongside its previous edition. The homepage presents original artwork in a moving composition and a curated project archive.

## Build and check

Requires Node.js 22 or newer. No packages need to be installed.

```sh
npm run build
npm run check
```

The generated `index.html` and `projects/*/index.html` are intended to be committed with the source and served directly by GitHub Pages from the repository root. The build is deterministic and does not contact a service. Run it after editing content or templates.

## Add a project or more photography

1. Add exported web images under `assets/projects/`. Keep the original full composition. Prefer descriptive filenames; do not crop text-bearing artwork to fill a fixed shape.
2. Add a record to `content/projects.json` using an existing record as the example. Use a unique lowercase `slug`, a truthful description, year, tools, category, and image width/height/alternative text. Categories are generated from the records.
3. Optional: add a `gallery` array to the record. Each item uses the same image fields (`src`, `width`, `height`, `alt`) and an optional `caption`. Images appear below the project story and open in the image viewer.
4. Run the build and check commands. Review desktop and mobile layouts before publishing.

Example gallery item:

```json
{
  "src": "assets/projects/example-detail.webp",
  "width": 1600,
  "height": 1000,
  "alt": "Describe the content and meaningful visual details",
  "caption": "Describe what this image demonstrates"
}
```

The Ciało, Milkplexity, and Training Room pages have custom sections in `scripts/build.mjs`. Shared layout lives in `assets/site.css`; the homepage art direction and Milkplexity layouts live in `assets/editorial.css`. Project sizing, offsets, and factual personal notes are keyed by slug in `content/presentation.json`; new projects default to a standard layout. Filter, image viewer, and color selection behavior lives in `assets/site.js`. Every project remains available without JavaScript. Image links fall back to their full-size files.

## Artwork and motion

- `content/milkplexity-assets.json` records the main logo, standalone icon, and Milkplexity Learn artwork supplied in this conversation. Original PNGs are unchanged; smaller WebP versions are used for display. New records appear in the Milkplexity gallery automatically.
- `assets/motion.js` controls gentle hero movement and once-only scroll entrances. It honors live reduced-motion preferences, pauses the hero offscreen or in a hidden tab, and exposes a pause control. Hovering or focusing the artwork freezes the composition so targets stay stable. Content is visible if JavaScript or animation APIs are unavailable. Motion uses no external animation library.

- `content/original-assets.json` records hashes for all twelve original JPEGs. These were extracted from the old embedded page without recompression.
- `content/cialo-assets.json` records eleven unique supplied stills. The duplicate supplied PNG is included once. Original PNGs are untouched; 480px and 960px WebP copies are used for display. The loose transparent header has rough cutout edges, so the clean wordmark from the animation ZIP is used prominently (`content/cialo-wordmark.json`); the header export remains available in a disclosure.
- `content/retreat-2027.json` records the new supplied retreat artwork and its display copies. “2027 edition” describes the year in the artwork, not a claimed creation date.
- `content/cialo-motion.json` records the original ZIP media and renderer hashes. The MP4 and GIF are unchanged. The interactive player uses the supplied renderer with an accessible replacement controller and no export endpoint.
- The interactive animation starts only after Play. There are pause, replay, and scrub controls, a static fallback, and reduced-motion handling. The video fallback has native controls and no autoplay; the GIF is a download rather than a continuously moving page element.

Optional WebP generation uses the `cwebp` command, outside the regular build:

```sh
cwebp -q 88 -m 6 -resize 960 0 assets/projects/example.png -o assets/projects/example-960.webp
```

Add generated sizes to an image record's `variants` array with `src` and `width`. Keep the original `src` for the enlarged view. Visually compare exports with the source before publishing.

## Privacy and maintenance

No analytics, cookies, forms, trackers, application backend, or external JavaScript. Public contact links use the original portfolio email, LinkedIn, and phone number. The original Google Fonts remain the only external style/font service. Content Security Policy limits other resource types to local files and disables network requests from application scripts.

No package dependencies or scheduled upgrades are required. Keep image exports reasonably sized, check links when adding work, and update project copy when dates or status change. Existing project descriptions were preserved; time-sensitive descriptions such as “upcoming” still need the owner's editorial review before publication.

## Validation status

Source checks cover local references, anchors, image dimensions and alternatives, original asset hashes, category wiring, and media defaults. Interaction checks exercise filters, image viewer state, dynamic color selection, motion pause/resume, offscreen suspension, and reduced-motion changes in a simulated DOM. These do not replace browser rendering, responsive review, keyboard/screen-reader checks, or field performance measurements.

The production target is https://ianmilkowski-eng.github.io/portfolio/. GitHub Pages publishes the repository root from the main branch. The build only generates files; committing and pushing are separate release steps. Confirm the deployed revision and review the live site after each release.
