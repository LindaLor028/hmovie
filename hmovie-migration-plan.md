# Hmovie Migration Plan: Jekyll → Astro

Six-phase plan for migrating hmovie.org from Jekyll 4 to Astro. Each phase is
a set of PRs that can be merged independently. The site stays live on Jekyll
throughout; the switch happens in a single cutover PR described in
`CUTOVER_PLAN.md`.

> **Living document.** Check boxes as work is completed. Add notes inline.

---

## Phase 0 — Source of truth & data cleanup

**Goal:** Lock down the content pipeline so Astro can consume clean, consistent
data from day one. No code is written in `astro/` yet.

- [x] Finalize actor slug convention (numeric suffix for collisions).
- [ ] Resolve any `#VALUE!` errors in the Google Sheet.
- [ ] Confirm every movie row in the Sheet produces valid frontmatter when
  pasted into a markdown file (no stray quotes, no broken YAML arrays in the
  `cast` field, no empty required fields).
- [ ] Audit the `sequel` / `base_movie` / `total_parts` fields for
  consistency. Current schema:
  ```yaml
  base_movie: "Movie Title"   # title of Part 1 (self-ref if this IS Part 1)
  total_parts: 2               # integer, blank if standalone
  sequel: "Movie Title Part 2" # title of the next part, blank if last
  ```
  Every multi-part chain must be walkable from base → sequel → sequel without
  dead ends or cycles.
- [ ] Produce `renamed-slugs.txt` mapping every old actor slug to its new slug
  (even if most are unchanged — the file is the redirect source of truth).
- [ ] Add `jekyll-sitemap` to the live site so there's a production baseline
  for the URL parity check. *(Done — see CUTOVER_PLAN.md.)*

**Exit criteria:** The Sheet is the single source of truth. A developer can
export all rows, generate markdown files, and the existing Jekyll site builds
cleanly with that output.

---

## Phase 1 — Astro project scaffold

**Goal:** A bare Astro project lives in `astro/` and builds successfully. No
content yet — just the skeleton.

- [x] Initialize Astro project in `astro/` (use `npm create astro@latest`).
  Target Astro v5 (latest stable at time of migration).
- [x] Configure `astro.config.mjs`:
  - Output: `static` (same as Jekyll — pure SSG).
  - Site URL: `https://www.hmovie.org`.
  - Integrations: none initially (add as needed in later phases).
- [x] Set up the directory structure:
  ```
  astro/
  ├── src/
  │   ├── layouts/        # BaseLayout.astro (replaces head.html + footer)
  │   ├── pages/          # Static routes: index, explore, search, about, etc.
  │   ├── components/     # Reusable UI pieces
  │   └── content/        # Content collections (movies, actors)
  │       ├── movies/     # .md files (generated from Sheet)
  │       └── actors/     # .md files (generated from Sheet)
  ├── public/             # Static assets (images, fonts, favicon)
  ├── package.json
  └── tsconfig.json
  ```
- [x] Define content collection schemas in `src/content.config.ts` (or
  `src/content/config.ts` for older Astro versions):
  ```ts
  // Movies collection schema
  {
    title: z.string(),
    permalink: z.string(),
    synopsis: z.string().optional(),
    producer: z.string().optional(),
    director: z.string().optional(),
    writer: z.string().optional(),
    video_link: z.string().optional(),
    genre: z.string(),
    year: z.string(),
    release_type: z.string(),
    storage: z.string().optional(),
    thumbnail: z.string(),
    publishing_company: z.string().optional(),
    base_movie: z.string().optional(),
    total_parts: z.number().optional(),
    sequel: z.string().optional(),
    cast: z.array(z.object({ name: z.string() })).optional(),
  }

  // Actors collection schema
  {
    title: z.string(),
    permalink: z.string(),
    thumbnail: z.string(),
    biography: z.string().optional(),
  }
  ```
- [ ] Copy static assets into `public/` (deferred to Phase 3):
  - `assets/images/` → `public/assets/images/`
  - `assets/fonts/` → `public/assets/fonts/`
  - Favicon (`fav-icon.png`)
- [x] Verify `astro build` succeeds (empty content, no pages yet — just the
  scaffold).
- [x] Verify `astro check` passes with zero errors.
- [ ] Confirm `transition-ci.yml` runs both Jekyll and Astro checks on a test
  PR. *(Workflow already authored — see CUTOVER_PLAN.md.)*

**Exit criteria:** `npm run build` inside `astro/` succeeds. CI runs both
builds on PRs that touch `astro/`.

---

## Phase 2 — Content pipeline (Apps Script generator)

**Goal:** A single script run exports the Google Sheet into Astro-compatible
markdown files, ready to drop into `astro/src/content/`.

- [ ] Write the Apps Script (or standalone Node script) that:
  1. Reads all movie rows from the Sheet.
  2. Generates one `.md` file per movie with Astro-compatible frontmatter
     (matching the Zod schema from Phase 1).
  3. Reads all actor rows and generates one `.md` file per actor.
  4. Uses the finalized slug convention for filenames.
- [ ] Validate the output:
  - Drop generated files into `astro/src/content/movies/` and
    `astro/src/content/actors/`.
  - Run `astro check` — zero errors.
  - Run `astro build` — succeeds with the full content set (393 movies, 36
    actors).
- [ ] Document the generation workflow in `CONTRIBUTING.md`:
  - How to run the script.
  - Where generated files go.
  - Rule: never hand-edit generated content files.

**Exit criteria:** The generator produces markdown that passes `astro check`
for the full dataset. Both developers have run it successfully.

---

## Phase 3 — Layouts & components

**Goal:** Every page type renders in Astro with visual and functional parity to
the Jekyll site. This is the bulk of the migration work.

### 3a — Base layout & shared components

Port the shell that wraps every page.

| Jekyll file | Astro equivalent | Notes |
|-------------|-----------------|-------|
| `_includes/head.html` | `BaseLayout.astro` `<head>` | Meta tags, favicon, stylesheet link, tracking-param removal script |
| `_includes/meta.html` | Folded into `BaseLayout.astro` | viewport, charset |
| `_includes/analytics.html` | `Analytics.astro` component | Gate on `import.meta.env.PROD` (replaces `jekyll.environment == 'production'`) |
| `_includes/site_header.html` | `Header.astro` | Nav links: Home, Search, About, Explore, Contribute |
| `_includes/header_nosearch.html` | `Header.astro` with prop `showSearch={false}` | Used only on homepage |
| `_includes/site_footer.html` | `Footer.astro` | Sponsor logos, links, contact, Facebook |

- [ ] Create `BaseLayout.astro` with `<head>` (meta, title, CSS, favicon,
  analytics, tracking-param script) and `<body>` wrapper (header slot + footer).
- [ ] Create `Header.astro` (with `showSearch` prop).
- [ ] Create `Footer.astro`.
- [ ] Create `Analytics.astro` — GA4 init gated on `import.meta.env.PROD`.
- [ ] Port `styles.scss` / `main.scss` into `astro/src/styles/`. Astro
  supports SCSS natively. Bring the font files along.

### 3b — Homepage

| Jekyll file | Astro equivalent |
|-------------|-----------------|
| `_layouts/hmovie-home.html` | `src/pages/index.astro` |

- [ ] Hero section with background image, title, subtitle, search form.
- [ ] Featured movies grid (`site.categories.front` → query the movies
  collection filtered by a `featured` or `front` category/tag).
- [ ] "See More Movies" link to `/explore`.

### 3c — Movie detail page

| Jekyll file | Astro equivalent |
|-------------|-----------------|
| `_layouts/movie-video-data.html` | `src/pages/movie/[slug].astro` |
| `_includes/display_play_movie_button.html` | `PlayButton.astro` |
| `_includes/display_page_cast.html` | `CastList.astro` |
| `_includes/display_page_movie_parts.html` | `MovieParts.astro` |

- [ ] Dynamic route `[slug].astro` using `getStaticPaths()` from the movies
  collection.
- [ ] Two-column layout: poster + metadata (left), synopsis + cast + parts
  (right).
- [ ] Video popup overlay (`triggerPopUp()` / `closePopUp()`). Port the inline
  JS or extract to a `<script>` block in the component.
- [ ] `PlayButton.astro`: "WATCH MOVIE" if `video_link` exists, "NOT AVAILABLE
  ONLINE" disabled button otherwise.
- [ ] `CastList.astro`: grid of actor thumbnails, linked to actor pages when
  the actor exists in the actors collection (fallback to placeholder image
  `no_cast_image.png` when not).
- [ ] `MovieParts.astro`: renders the sequel chain by walking `base_movie` →
  `sequel` → `sequel`. Highlight current part, link to others.

### 3d — Actor page

| Jekyll file | Astro equivalent |
|-------------|-----------------|
| `_layouts/cast.html` | `src/pages/cast/[slug].astro` |
| `_includes/display_cast_information.html` | Inline in the page or `ActorBio.astro` |
| `_includes/display_cast_movies.html` | `ActorFilmography.astro` |

- [ ] Dynamic route from the actors collection.
- [ ] Two-column layout: photo + bio (left), featured works grid (right).
- [ ] `ActorFilmography.astro`: query all movies where `cast` array includes
  this actor's name. Sort alphabetically.

### 3e — Explore page

| Jekyll file | Astro equivalent |
|-------------|-----------------|
| `_layouts/explore.html` | `src/pages/explore.astro` (or `explore/index.astro`) |
| `assets/js/explore-filters.js` | `<script>` in explore page or standalone `.js` |

- [ ] Movie grid with all 393 movies rendered server-side (same as Jekyll —
  all items in the DOM, filtered client-side).
- [ ] Filter sidebar: Availability, Year (1990s/2000s/2010s/2020s), Release
  Type (VHS/DVD), Genre (7 types).
- [ ] Port `explore-filters.js` — it's vanilla JS, no framework dependency.
  Works as-is in a `<script>` tag or imported file.
- [ ] Movie count display (`total_displayed`).

### 3f — Search page

| Jekyll file | Astro equivalent |
|-------------|-----------------|
| `_layouts/new-search.html` | `src/pages/search.astro` (or `search/index.astro`) |
| `assets/js/search-query.js` | `<script>` in search page or standalone `.js` |

- [ ] All actors and movies rendered into the DOM (same as Jekyll).
- [ ] Client-side filtering via query param `?q=`. Port `search-query.js`
  as-is.
- [ ] Actors section and movies section, each hidden when no matches.
- [ ] "No Results" message when both empty.

### 3g — Static pages

| Page | Jekyll layout | Astro page |
|------|--------------|------------|
| About | `about.html` | `src/pages/about.astro` |
| Contribute | `contribute.html` | `src/pages/contribute.astro` |
| Privacy Policy | `markdown-base.html` | `src/pages/privacy_policy.astro` |
| Terms of Use | `markdown-base.html` | `src/pages/terms_of_use.astro` |
| 404 | `404-error.html` | `src/pages/404.astro` |

- [ ] Port each page. Content is short and mostly static HTML.
- [ ] About: mission statement, sponsor logos, team profiles.
- [ ] Contribute: three Google Form links with `data-contribute` attributes
  for analytics.
- [ ] 404: custom "4{0H Y0!}4" design.

### 3h — Analytics events

- [ ] Wire up `analytics-events.js` (search submit + contribute click events)
  in the base layout or relevant pages.
- [ ] Wire up explore filter events (already in `explore-filters.js`).
- [ ] Ensure all 4 custom events fire with the same parameter names and values
  as the Jekyll site (see inventory in `CUTOVER_PLAN.md`).

**Exit criteria:** Every page type renders. Visual diff against the live site
shows no regressions. All client-side interactions (search, filters, video
popup) work on the staging preview.

---

## Phase 4 — Feeds, sitemap & redirects

**Goal:** SEO and syndication parity. No broken links for existing visitors or
search engines.

- [ ] **RSS feed:** Use `@astrojs/rss` integration to generate `/feed.xml`.
  Match the existing feed's structure (title, description, items). Validate
  with the W3C Feed Validator.
- [ ] **Sitemap:** Use `@astrojs/sitemap` integration. Verify output matches
  the Jekyll sitemap (436 URLs). Run the parity check script from
  `CUTOVER_PLAN.md`.
- [ ] **Redirects for renamed actor slugs:** Configure in `astro.config.mjs`
  `redirects` object using `renamed-slugs.txt` as the source. Each old slug
  should return a 301 to the new slug.
  ```js
  // Example
  redirects: {
    '/cast/Cua_Yaj_(Pog_Nplaum)': '/cast/cua-yaj-2',
  }
  ```
- [ ] **Trailing slash consistency:** Decide on trailing slashes (Jekyll uses
  them for directory-style permalinks). Configure `trailingSlash` in
  `astro.config.mjs` to match.
- [ ] **robots.txt:** If not already present, add one to `public/`. The Jekyll
  site doesn't have one — this is a good time to add a basic one that allows
  all crawlers and points to the sitemap.
- [ ] **Canonical URLs:** Ensure `<link rel="canonical">` is present in the
  base layout for each page, matching the production URL.

**Exit criteria:** Sitemap parity check passes (zero unexplained diff lines).
All old actor URLs redirect. RSS feed validates.

---

## Phase 5 — QA, staging & cutover prep

**Goal:** Everything is verified on the staging environment. The cutover PR is
ready to merge.

### Staging setup

- [ ] Deploy staging site on Cloudflare Pages or Netlify free tier, pointed at
  the `astro/` directory on `main`.
- [ ] Add `noindex` meta tag or HTTP header gated to the staging URL (not
  production) to prevent Google from indexing the duplicate.
- [ ] Verify per-PR preview deploys work.

### QA checklist (both developers independently)

- [ ] **Homepage:** hero image, search form submits to `/search/?q=...`,
  featured movies grid, "See More Movies" link.
- [ ] **Explore:** all 393 movies render, each filter combination works, count
  updates, "Clear Filters" resets.
- [ ] **Search:** query param filtering works for both movies and actors, cast
  name search finds movies, "No Results" shows when appropriate.
- [ ] **Movie detail (3 pages):** metadata renders, poster image loads, video
  popup opens/closes (for a movie with a link), "NOT AVAILABLE ONLINE" shows
  (for a movie without), cast thumbnails link correctly, multi-part navigation
  works.
- [ ] **Actor page (2 pages, including one renamed slug):** photo, featured
  works grid, filmography is complete.
- [ ] **Redirects:** hit 3+ old actor URLs on staging, confirm they redirect.
- [ ] **Static pages:** About, Contribute, Privacy, Terms, 404.
- [ ] **RSS feed:** loads at `/feed.xml`, validates.
- [ ] **GA4:** enable temporarily on staging, confirm realtime view registers a
  visit and custom events fire. Then disable.
- [ ] **Mobile:** homepage + movie detail + explore on a phone.
- [ ] **Tracking param removal:** append `?fbclid=test` to a URL, confirm it's
  stripped from the address bar.
- [ ] **Accessibility spot check:** keyboard navigation through header links,
  screen reader on one movie page.

### Cutover PR prep

- [ ] Author the `chore/astro-cutover` PR (see `CUTOVER_PLAN.md` section 7 for
  the full checklist). Do not merge yet.
- [ ] Verify the cutover PR is a single squashable commit.
- [ ] Confirm both developers understand the rollback procedure.

**Exit criteria:** Both developers have independently walked the staging site
and signed off. The cutover PR is authored and reviewed. The cutover date is
scheduled.

---

## Summary table

| Phase | Description | Depends on | Key deliverable |
|-------|-------------|------------|-----------------|
| 0 | Data cleanup & source of truth | — | Clean Sheet, `renamed-slugs.txt` |
| 1 | Astro scaffold | Phase 0 | `astro/` builds, CI green |
| 2 | Content pipeline | Phase 1 | Generator script, full content builds |
| 3 | Layouts & components | Phase 2 | All page types render with parity |
| 4 | Feeds, sitemap & redirects | Phase 3 | SEO parity, no broken links |
| 5 | QA, staging & cutover prep | Phase 4 | Staging sign-off, cutover PR ready |

After Phase 5, follow the cutover-day procedure in `CUTOVER_PLAN.md`.
