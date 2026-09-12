# Ian Milkowski — creative portfolio

The primary website is https://ianmilkowski.netlify.app/.

This version merges the original Netlify portfolio with the Ciało and Milkplexity project pages and the 2027 Training Room retreat artwork. It preserves the green identity, original strip-to-grid flight, all thirteen existing projects, and the personal Craft and FAQ writing. The GitHub Pages address is a mirror, not the primary site.

## Edit and build

Requires Node.js 22 or newer. No package installation or runtime framework is required.

- `npm run build` generates the home page, fifteen project pages, and sitemap.
- `npm run check` checks artwork hashes, page references, content coverage, and motion behavior.
- `npm run package` builds, checks, and prepares `dist/` for deployment.

Edit content in `content/projects.json` and personal home-page writing in `src/home.html`. The build creates project links, gallery previews, project counts, and navigation from this data. Add optional `gallery` assets to extend a project without changing its layout. Ciało and Milkplexity artwork is described in their dedicated content manifests; their individual presentations live in `scripts/build.mjs`.

## Featured work and archive

The homepage leads with Training Room Fitness Retreat 2027, Ciało, Milkplexity, Row for Hope 2026/27, and The American 250, in that order. Each has its own artwork composition in `scripts/home.mjs`. The remaining ten projects are preserved in the collapsed archive, with quick previews and full project pages. Supporting brand assets stay alongside their feature; only the five lead covers participate in desktop flight and the mobile strip.

## Motion and accessibility

`assets/flight-geometry.js` preserves the Netlify choreography. `assets/flight.js` owns desktop flight and mobile decorative-strip playback. The flight uses only the five featured artwork links, measures their nested editorial layouts, and lands at their own positions; it sleeps after landing and while hidden. Pause stops automatic movement while scrolling still controls the gallery transition. Reduced-motion preferences use the stationary editorial layout. Keyboard navigation into the moving showcase switches to a stationary layout, and explicit Play can restore the animation.

Real project links and native Craft/FAQ disclosures work without JavaScript. Native dialogs provide focus containment, Escape, and focus return. Artwork loads use request guards to avoid stale results after fast navigation. The contact form opens the visitor’s mail app and does not send messages or store submissions itself.

Ciało’s main homepage logo and its Watch link open an enlarged native dialog. The 4.4-second animation starts from that deliberate click, with pause, replay, and scrubbing controls. Closing the dialog removes the player. The project page retains the interactive player plus MP4 and GIF originals. Reduced-motion visitors see the finished logo.

The desktop photo loop spans at least the viewport plus two full offscreen margins, so recycling happens beyond the visible artwork and shadow. Lead images load eagerly, with only the first given high priority; unloaded artwork fades in after decoding.

## Publish to the existing site

The Netlify project is `ianmilkowski`, originally deployed with Netlify Drop. Upload the contents of `dist/` or a zip with `index.html` at its root to that existing project. Do not create a second Netlify site. A locked production deploy lets a new version be checked at its unique deploy URL before publication; restore normal auto publishing after the verified release.

The deploy package contains public site assets only. `_headers` applies security headers and allows only the resources used by the portfolio. Canonical URLs and the sitemap point to the primary Netlify domain. Keep HTML revalidation enabled; asset filenames are not content-hashed.

## Preserved artwork

All twelve original GitHub artwork files match their Netlify counterparts byte for byte. The American 250 cover and its two additional views are included. Original Ciało, Milkplexity, and retreat imports are retained alongside smaller display copies. Source-image hashes are recorded in `content/*assets.json` and checked before release. Row for Hope’s original 2026 artwork explicitly retains the event’s postponement to 2027.
