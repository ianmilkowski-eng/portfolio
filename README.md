# Ian Milkowski — creative portfolio

The primary website is https://ianmilkowski.netlify.app/.

This version merges the original Netlify portfolio with the Ciało and Milkplexity project pages and the 2027 Training Room retreat artwork. It preserves the green identity, original strip-to-grid flight, all thirteen existing projects, and the personal Craft and FAQ writing. The GitHub Pages address is a mirror, not the primary site.

## Edit and build

Requires Node.js 22 or newer. No package installation or runtime framework is required.

- `npm run build` generates the home page, fifteen project pages, and sitemap.
- `npm run check` checks artwork hashes, page references, content coverage, and motion behavior.
- `npm run package` builds, checks, and prepares `dist/` for deployment.

Edit content in `content/projects.json` and personal home-page writing in `src/home.html`. The build creates project links, gallery previews, project counts, and navigation from this data. Add optional `gallery` assets to extend a project without changing its layout. Ciało and Milkplexity artwork is described in their dedicated content manifests; their individual presentations live in `scripts/build.mjs`.

## Motion and accessibility

`assets/flight-geometry.js` preserves the Netlify choreography. `assets/flight.js` owns desktop flight and mobile decorative-strip playback. The flight uses the actual grid links and lands at their own layout positions; it sleeps after landing and while hidden. Pause stops automatic movement while scrolling still controls the gallery transition. Reduced-motion preferences use a stationary grid. Keyboard navigation into the moving grid switches to a stationary layout, and explicit Play can restore the animation.

Real project links and native Craft/FAQ disclosures work without JavaScript. Native dialogs provide focus containment, Escape, and focus return. Artwork loads use request guards to avoid stale results after fast navigation. The contact form opens the visitor’s mail app and does not send messages or store submissions itself.

Ciało’s original 4.4-second animation has explicit playback, replay, and scrubbing controls, plus MP4 and GIF originals. No media autoplays.

## Publish to the existing site

The Netlify project is `ianmilkowski`, originally deployed with Netlify Drop. Upload the contents of `dist/` or a zip with `index.html` at its root to that existing project. Do not create a second Netlify site. A locked production deploy lets a new version be checked at its unique deploy URL before publication; restore normal auto publishing after the verified release.

The deploy package contains public site assets only. `_headers` applies security headers and allows only the resources used by the portfolio. Canonical URLs and the sitemap point to the primary Netlify domain. Keep HTML revalidation enabled; asset filenames are not content-hashed.

## Preserved artwork

All twelve original GitHub artwork files match their Netlify counterparts byte for byte. The American 250 cover and its two additional views are included. Original Ciało, Milkplexity, and retreat imports are retained alongside smaller display copies. Source-image hashes are recorded in `content/*assets.json` and checked before release. Row for Hope’s original 2026 artwork explicitly retains the event’s postponement to 2027.
