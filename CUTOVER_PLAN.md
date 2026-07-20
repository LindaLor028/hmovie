# Cutover Plan: Going Live on Astro

How we move Hmovie from Jekyll to Astro while the site stays live, and how we
flip the switch at the end. Companion to the six-phase migration plan and
`transition-ci.yml` (the dual-build PR checks — to be authored).

> **This is a living document.** Check boxes as items are completed, add notes
> in the `<!-- NOTES: -->` comments, and update dates in the timeline section.

---

## 1. The setup during transition

- **One repo.** Astro is built inside an `astro/` directory on `main`, merged
  in small PRs like any other work. Jekyll keeps serving production from the
  root the whole time.
- **Dual CI.** Every PR runs the Jekyll build check (for changes outside
  `astro/`) and the Astro build + `astro check` (for changes inside it). See
  `transition-ci.yml` (to be created).
- **Staging preview.** Cloudflare Pages (or Netlify) free tier pointed at the
  repo, build directory `astro/`. This gives the team a real URL for the Astro
  site and per-PR preview deploys, with zero effect on production.
- **Content changes go through the Sheet.** Once the Apps Script generator
  exists, new movies are added in Google Sheets and regenerated — never
  hand-edited — so the Astro content can be refreshed with one script run and
  drift can't accumulate.
- **Branch conventions unchanged.** Migration work uses normal branches
  (`feat/astro-movie-layout`, `chore/astro-ci`), rebased on `main`,
  force-pushed with `--force-with-lease`, merged via PR.

---

## 2. Pre-migration actions

These must be done *before* migration work begins. They fix gaps found during
the local plan review on 2026-07-09.

- [x] **Add `jekyll-sitemap` to the Gemfile.**
  The current site has no `sitemap.xml` — only `jekyll-feed` is installed. The
  sitemap parity check in section 5 depends on having a production sitemap to
  diff against. Add the plugin now so it ships with the live Jekyll site before
  any Astro work starts.
  <!-- NOTES: Done 2026-07-09. Added jekyll-sitemap ~> 1.4 to Gemfile and
  _config.yml plugins list. Build verified locally — sitemap.xml generated
  with 436 URLs (393 movies + 36 actors + 7 static pages). -->

- [x] **Create `transition-ci.yml`.**
  The dual-CI workflow referenced in section 1 does not exist yet. Author it
  before Phase 0 work begins.
  <!-- NOTES: Done 2026-07-09. Created .github/workflows/transition-ci.yml.
  Uses gh pr diff to detect which files changed: runs Jekyll build for
  non-astro/ changes, runs astro check + build for astro/ changes.
  Both jobs skip gracefully when their file set isn't touched. -->

- [x] **Create the migration plan file (`hmovie-migration-plan.md`).**
  The six-phase migration plan referenced by this document. Store in repo root
  or `docs/`.
  <!-- NOTES: Done 2026-07-09. Created hmovie-migration-plan.md in repo root.
  Six phases: 0 (data cleanup), 1 (Astro scaffold), 2 (content pipeline),
  3 (layouts & components), 4 (feeds/sitemap/redirects), 5 (QA & cutover prep). -->

- [x] **Document actor slug mapping in `renamed-slugs.txt`.**
  ~~Current slugs use `Name_Surname` format under `/cast/`. Only one collision
  exists today: `Cua_Yaj` vs `Cua_Yaj_(Pog_Nplaum)`.~~ Actor slug convention
  issue is resolved. Record the final old-slug → new-slug pairs in
  `renamed-slugs.txt` if not already done.
  <!-- NOTES: Actor slug convention resolved per team. -->

- [x] **Inventory custom analytics events.**
  The following GA4 events must be replicated exactly in Astro:
  - `search_submit` (params: `form_name`, `search_term`) — in `analytics-events.js:8,18`
  - `explore_filter_apply` (params: `filter_year`, `filter_release`,
    `filter_genre`, `results_count`) — in `explore-filters.js:167`
  - `explore_filter_clear` — in `explore-filters.js:134`
  - `contribute_form_click` (params: `form_type`, `link_url`) — in `analytics-events.js:27`
  - GA4 init: `analytics.html` loads gtag.js and configures `G-XCK7DWWLFC`
  - GA4 is gated behind `jekyll.environment == 'production'` in `head.html`
  <!-- NOTES: Verified 2026-07-09. Grep for gtag() across all .html/.js
  files confirmed these 4 custom events are the complete set. No events
  in layouts or other includes. -->

---

## 3. Readiness gate

**Do not schedule a cutover date until every item here is checked.**

- [x] **Phase 0 done:** actor slugs finalized (numeric suffix convention),
  Sheets is the source of truth, `#VALUE!` errors resolved.
  <!-- STATUS: DONE. Actor slug convention resolved. -->

- [ ] **Apps Script generator** produces Astro-format markdown that passes
  `astro check` cleanly.
  <!-- STATUS: NOT STARTED. No Apps Script or Sheets integration in repo yet. -->

- [ ] **`astro build` succeeds** with the full content set (all 393 movies, all
  36 actors).
  <!-- STATUS: NOT STARTED. No astro/ directory exists. -->

- [ ] **URL parity verified:** generated sitemap diffed against the live
  production sitemap — every diff line is an expected rename with a working
  redirect stub, zero unexplained URLs (script in section 5).
  <!-- STATUS: BLOCKED — jekyll-sitemap not yet installed (see pre-migration action). -->

- [ ] **Redirect stubs exist** for all renamed actor slugs (Astro redirects
  config) and were spot-checked on staging.
  <!-- STATUS: BLOCKED — depends on Phase 0 slug decisions. -->

- [ ] **Staging site excluded from search indexing** (Cloudflare/Netlify header
  or `noindex` meta gated to staging) so Google never indexes the duplicate.
  <!-- STATUS: NOT STARTED. -->

- [ ] **Visual QA on staging:** homepage, explore page (filter-based browsing),
  a movie detail page, an actor page, a renamed-actor page, 404 page — checked
  on desktop and mobile.
  <!-- STATUS: NOT STARTED. -->

- [ ] **RSS feed on staging validates** (W3C feed validator) and matches the
  current feed URL path (`/feed.xml`).
  <!-- STATUS: feed.xml generated by jekyll-feed. Must replicate in Astro. -->

- [ ] **GA4 verified** with a temporary staging check, then disabled on staging.
  Gate on the production URL or an env var, not `PROD` alone — an always-on
  guard would count staging visits in real analytics.
  GA4 ID: `G-XCK7DWWLFC`.
  <!-- STATUS: NOT STARTED. -->

- [ ] **Video popup behavior** QA'd against the live site. (The only popup is
  the video player overlay on movie pages — `movie-video-data.html`.)
  <!-- STATUS: NOT STARTED. -->

- [ ] **Astro deploy workflow** written and tested against staging.
  <!-- STATUS: NOT STARTED. -->

- [ ] **Both developers** have walked the staging site independently and signed
  off.
  <!-- STATUS: NOT STARTED. -->

- [ ] **Rollback steps** (section 8) read and understood by both developers.
  <!-- STATUS: NOT STARTED. -->

---

## 4. Content and feature inventory (baseline)

Captured from the live Jekyll build on 2026-07-09. Use this as the checklist
when verifying Astro parity.

| Category | Count / Detail |
|----------|---------------|
| Movies | 393 markdown posts |
| Actors | 36 markdown posts |
| Movie thumbnails | 409 JPEGs in `assets/images/movie_thumbnails/` |
| Cast thumbnails | 38 images (37 actors + 1 placeholder) in `assets/images/cast_thumbnails/` |
| Layouts to port | 9: `hmovie-home`, `movie-video-data`, `cast`, `explore`, `new-search`, `contribute`, `about`, `404-error`, `markdown-base` |
| JS files to port | 3: `search-query.js`, `explore-filters.js`, `analytics-events.js` |
| Static pages | Privacy Policy, Terms of Use, Contribute, About, Search, Explore, 404 |
| RSS feed | `/feed.xml` via `jekyll-feed` |
| Sitemap | **MISSING** — `jekyll-sitemap` not installed (see pre-migration action) |
| CNAME | **NONE** — domain likely configured in GitHub repo Settings |
| GA4 custom events | 4 events (see analytics inventory in section 2) |
| Browse behavior | Filter-and-show on explore page (no infinite scroll, no pagination) |
| Video popup | iframe overlay on movie pages (`closePopUp()` / `triggerPopUp()`) |

---

## 5. Sitemap parity check script

Run this after `jekyll-sitemap` is installed and the Astro staging build has the
full content set.

```bash
# Old site (live)
curl -s https://www.hmovie.org/sitemap.xml \
  | grep -o '<loc>[^<]*' | sed 's/<loc>//' | sort > old-urls.txt

# New site (staging build)
curl -s https://<STAGING_URL>/sitemap.xml \
  | grep -o '<loc>[^<]*' \
  | sed 's|<STAGING_URL>|www.hmovie.org|' \
  | sort > new-urls.txt

# URLs only in old site — must all be expected renames:
comm -23 old-urls.txt new-urls.txt

# Every old slug must return a redirect on staging, not a 404:
while IFS=$'\t' read -r old_slug new_slug; do
  status=$(curl -sI "https://<STAGING_URL>${old_slug}" | head -1)
  echo "${old_slug} → ${status}"
done < renamed-slugs.txt
```

**Alternative (no sitemap yet):** generate URLs from the built `_site/`
directory:

```bash
find _site -name "*.html" -not -path "*/_site/assets/*" \
  | sed 's|^_site||; s|/index\.html$|/|; s|\.html$||' \
  | sort > old-urls.txt
```

---

## 6. Cutover week timeline

Fill in actual dates when scheduling.

| Day | Action | Date | Done |
|-----|--------|------|------|
| T-2 | Announce content freeze in team channel | | [ ] |
| T-1 | Final Apps Script generate, commit content to `astro/` | | [ ] |
| T-1 | Re-run sitemap parity check against final content | | [ ] |
| T-1 | Confirm staging deploy is green, spot-check newest movies | | [ ] |
| T-1 | Prepare cutover PR (`chore/astro-cutover`) — author, don't merge | | [ ] |
| T-0 | **Cutover day** (low-traffic time, both devs available for 2 hrs) | | [ ] |

---

## 7. The cutover PR (`chore/astro-cutover`)

One reviewable change, merged as a single commit (squash or pre-squash before
rebase-merge) so rollback is a one-command `git revert`.

- [ ] Move Astro project from `astro/` to repo root
- [ ] Delete Jekyll files: `Gemfile`, `Gemfile.lock`, `_config.yml`,
  `_layouts/`, `_includes/`, `_sass/`, `_posts/`, and any Jekyll plugin config
  (everything stays in git history)
- [ ] Replace `transition-ci.yml` with permanent workflows:
  - **PR check:** Node 22 → `npm ci && npx astro check && npm run build`
  - **Deploy on main:** `withastro/action` → GitHub Pages
- [ ] Update `README.md` and `CONTRIBUTING.md`: setup instructions now
  Node 22 + npm, not Ruby + Bundler
- [ ] If a `CNAME` file exists, carry it into `public/` in the Astro project.
  (**Current status: no CNAME file — domain is configured in repo Settings.
  Verify the Pages source switch won't drop the custom domain binding.**)
- [ ] Update repo Settings → Pages if the publishing source changes
  (Actions-based deploys recommended)
- [ ] Second developer reviews the PR
- [ ] Merge

---

## 8. Post-merge verification (both developers)

Run immediately after the cutover PR merges.

- [ ] Deploy workflow green in Actions
- [ ] Homepage loads at `https://www.hmovie.org`
- [ ] Explore page: filters work (year, release type, genre, availability);
  results update correctly
- [ ] Open 3 movie pages (one old, one recently added, one with a long cast
  list)
- [ ] Open 2 actor pages, including one renamed to the numeric-suffix
  convention
- [ ] Hit 3 URLs from `old-urls.txt` directly (deep links) — no 404s
- [ ] Hit 2 old renamed-actor URLs — redirect lands on the new page
- [ ] RSS feed URL (`/feed.xml`) loads and validates
- [ ] GA4 realtime view shows the visit
- [ ] 404 page renders for a garbage URL (e.g., `/asdfghjkl`)
- [ ] Check the site on a phone (homepage + one movie page minimum)
- [ ] **All green →** post the all-clear, lift the content freeze

---

## 9. Rollback

If verification fails and the fix isn't obvious within ~30 minutes:

```bash
# Revert the cutover merge commit (restores all Jekyll files + old workflow)
git revert <cutover-commit-sha>
git push origin main

# Confirm the Jekyll deploy workflow runs and the site is back
# Keep the freeze in place
# Fix the issue in astro/ on a branch, re-verify on staging
# Schedule a new cutover day
```

Rollback is cheap and shame-free — the whole design exists so that trying again
costs a day, not a rebuild.

---

## 10. After cutover (first two weeks)

- [ ] Watch GA4 for a traffic dip or a spike in 404 behavior (landing-page
  anomalies suggesting broken inbound links)
- [ ] If Google Search Console is set up, check crawl errors; if not, add it
  now
- [ ] Retire the staging project or repoint it at `main` as a permanent preview
  environment
- [ ] Delete leftover `astro/` path references from any docs
- [ ] Onboarding debrief: what confused the newer developer during the
  migration → feed into `CONTRIBUTING.md`
- [ ] Schedule the v6 → v7 Astro upgrade as a normal chore for a later sprint

---

## Appendix: Changes from original plan

Documented here so both developers know what was updated and why.

| Change | Reason |
|--------|--------|
| Added "Pre-migration actions" section (section 2) | Local review found missing prerequisites: no sitemap plugin, no transition CI, no slug mapping file, no analytics inventory |
| Added content/feature inventory table (section 4) | Provides a concrete baseline for Astro parity checks instead of relying on memory |
| Replaced "infinite scroll" with "filter-based browsing" in all verification steps | The explore page uses client-side show/hide with filters — there is no infinite scroll, pagination, or lazy loading |
| Replaced "custom popup" with "video popup" | The only popup is the iframe video player overlay on movie pages; no notification or modal popups exist |
| Added alternative URL-list script for pre-sitemap state (section 5) | `jekyll-sitemap` isn't installed yet, so the original `curl sitemap.xml` command would fail |
| Noted CNAME is absent; flagged domain-binding risk | No `CNAME` file in repo — custom domain is configured in GitHub Settings; switching Pages source could drop it |
| Added actor collision detail | Only one name collision exists today: `Cua_Yaj` / `Cua_Yaj_(Pog_Nplaum)` — both need redirects under the new convention |
| Added `renamed-slugs.txt` as a pre-migration deliverable | The original plan referenced it but never said to create it before cutover prep |
