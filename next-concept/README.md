# Next Concept — local Technical Artist portfolio

## Scope

- Address: http://127.0.0.1:4174/next-concept/
- This redesign remains separate from the original site at `/`.
- No Git remote, credentials, commits, uploads, or deployment were changed.
- Pre-improvement snapshot: `Q:\Codex\portfolio-backups\20261027-ux-improvements\next-concept`.

## Sources

| File | Responsibility |
| --- | --- |
| `catalog.js` | Authoritative 17-project catalog: stable `id`, `groups`, `featuredOrder`, `archive`, titles, descriptions, media, contribution, objective, result, relevance |
| `profile.js` | Career, tool Usage tiers, actual contact email, optional `resumeUrl` |
| `app.js` | Cards, filters, hash navigation, project viewer, image zoom, reel, tool icon motion |
| `styles.css` | One consolidated responsive stylesheet; shared tokens and current components only |
| `image-manifest.js` | Generated original-path-to-WebP mapping |
| `scripts/optimize-images.py` | Rebuild web image derivatives after replacing original PNGs |

The original site still uses `../projects.js`. Next Concept now owns `catalog.js`; editing project titles cannot break category assignment or navigation. When adding a project, assign a unique URL-safe id and groups directly. `featuredOrder` is 0/1/2 for featured entries and null for ordinary entries. `archive` groups older projects at the end while preserving filtering.

## Design and content improvements — 2026-10-27

- Existing off-white, olive, peach and dark-surface direction retained. Header now includes the full readable name.
- Normal text, filters, technical notes and controls enlarged; mobile body copy remains readable without relying on 8px labels.
- Headline retains four aligned dense rows and heavier artistic/technical words. Mobile leading is more open. Artistic uses a deeper peach #9b6345 for contrast; reel years retain #DDA988.
- Featured projects: Cinematic Workflow Toolkit and Production Breakdown. CinematicShading is the first Selected Project. Earlier Work groups the three archive films. All four combined discipline filters apply across all groups, with no duplicated project cards.
- Titles, thumbnails and View Project buttons open the same detail. Release links remain external.
- Detail presentation uses Objective, My Contribution, Implementation and Result, supplemented by existing technical information in an always-visible Technical Breakdown. Technical projects include Related TA Skills derived from supplied work, not unverified runtime or performance claims.
- Existing contribution descriptions were reorganized; no invented time savings, adoption counts, solo authorship or team credits were added. Prior source claims about models, engine versions and reported timings remain subject to the owner's factual confirmation.
- Contact links use the user-supplied `cho_seunghyun@krafton.com`. `resumeUrl` remains null until a PDF is supplied; no dead resume link is shown.
- Mobile filters wrap rather than hiding offscreen choices. Sticky header/anchor offsets are aligned. Skip navigation, focus styles, meaningful button names and reduced-motion behavior are retained.

## Project and media interaction

- Project addresses: `#project=cinematic-workflow-toolkit&filter=tool-pipeline`. Direct entry and refresh reopen the project. Closing a project opened within the page restores the previous browser history entry. Previous/Next replace the active detail entry and follow the active filter order.
- Copy Project Link uses the clipboard when available and otherwise exposes a selectable URL. Links remain local while using localhost; public sharing requires deployment to the final host.
- Every YouTube project includes a Watch on YouTube fallback. Video thumbnails select playback; image thumbnails show images without video overlays.
- Thumbnail images crop; selected images use contain. Click the selected image or Expand Image for an original-resolution viewer with 100–400% zoom, reset, scrolling and original-file link. Escape closes the topmost viewer first.
- Main reel loops Dednet through ANA, supports pause/play with the compact thin circular control, resets progress per video, and pauses while offscreen, document-hidden or a project is open. Playback intent is preserved across temporary pauses. Reduced motion starts the reel paused.
- Local video loading errors provide feedback instead of failing silently. YouTube embedding restrictions cannot be overridden by this site; the external fallback remains available.

## Tools & Expertise

- Four Usage tiers, sizes and relative speeds are preserved: Unreal/Maya/Python 4; Houdini/Marvelous/Photoshop 3; ComfyUI/Substance Painter 2; C++/Blender 1. Unreal and Maya retain their extra size increase.
- Dot grid remains Cartesian and circular with soft edges, #29342b base color, proximity enlargement and a brightness gradient toward #bddc6b.
- Hover pauses icon travel, individual hover/focus/tap displays logo/name/Usage. Selected icons gain a subtle glow without frames.
- Small visuals have at least 44px button targets. Touching the circle freezes icons; a touch-only pause/resume control allows motion to resume. Motion stops offscreen, when hidden or behind a project modal; reduced motion leaves a static layout.
- Position changes use transforms. Pairwise soft separation reduces icon overlaps while preserving tier speeds and circular containment.

## Image delivery

35 PNG originals totaling about 79.2 MB have preserved originals plus 480/960/2000 maximum-dimension WebP variants totaling about 7.5 MB combined. This is derivative storage size, not a measured initial-page transfer. Dednet's 960px card derivative is approximately 63 KiB, compared with its roughly 5.8 MB original. Responsive card sources, lazy-loaded images and lightweight gallery previews are used; originals load on demand for image zoom.

After replacing an original image, regenerate derivatives and the manifest with the bundled Python, which includes Pillow:

```powershell
& 'C:\Users\cho_seunghyun\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' next-concept/scripts/optimize-images.py
```

The script changes only `next-concept/assets/` and `image-manifest.js`. It also creates `assets/social-preview.jpg` using existing artwork. The originals and original site are preserved.

## Still requiring input or external confirmation

1. **Resume PDF**: provide the file and desired public filename/path; set `profile.resumeUrl` when available.
2. **Final public URL**: set absolute Open Graph/Twitter image URLs and canonical URL after confirming the deployment path. Local relative preview metadata and the image exist already.
3. **Measured outcomes**: actual time savings, shot/asset counts and adoption scope require evidence; none were fabricated.
4. **Per-shot attribution / collaboration credits**: detailed image annotations require the owner's shot-by-shot responsibility information.
5. **Employment status / public company names**: the user's existing 2021–2026 period and industry-descriptor company names are preserved. Change to Present or real names only if confirmed.
6. **Technical factual review**: confirm exact engine/model versions, rights claims and benchmark conditions against the actual tools and source material before publication.
7. **Device and playback QA**: live browser, real touch devices, 200% zoom, network performance and actual YouTube playback were not exercised in this editing pass. No test suite was added or run. Source changes do not confirm third-party playback availability or rendering on every device.

This is local work only. Future deployment to GitHub must be performed separately on the user's approved personal PC.

## Korean typography — 2026-10-27

Korean text now uses locally hosted Pretendard Variable 1.3.9, replacing the Malgun Gothic fallback as the primary Korean font. The complete font is available through @font-face. Font stacks assign Manrope to display headings, DM Mono to technical labels, and Pretendard to descriptive copy including Latin and digits. Variable weights 45–920 and font-display: swap are declared; normal body text uses 400 and secondary technical headings use 600. Font and upstream SIL OFL license are stored in assets/fonts/. No operating-system font installation is required.

Upstream: https://github.com/orioncactus/pretendard
Font source resolved from the official v1.3.9 CSS: https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2

Project-card software logos use compact 19px boxes, 3px inset, 45% saturation and 70% opacity to keep attention on the artwork. The animated Tools & Expertise icons retain their original branded colors and Usage-tier sizes.

The main reel overlay displays year, project title and role only; the TOOLS label and software icons have been removed. Project-card logos and Tools & Expertise remain available.

The main reel has no page count or previous/next navigation beneath it. The extra navigation space is removed. The pause/play control uses the former 38px thin circular treatment and small SVG pause bars to avoid font-dependent glyph changes. Project-detail previous/next navigation is retained.

Project-card footer spacing is compact: 3px below the divider and 28px visible action rows. Invisible vertical hit-area extensions preserve a 44px pointer target without adding visible whitespace.

Detail typography: summaries, case paragraphs, sidebar copy and technical notes explicitly use Pretendard for Korean, Latin and digits. Numbered case headings now separate a small olive mono index from an 18px/700 dark title (17px on mobile); paragraphs remain 15px/400 muted text with a readable measure. Technical note headings use 16px/600 for clearer hierarchy. CSS and script versions are refreshed together. Font configuration and local file presence were inspected; live browser font rendering was not measured in this pass.

Description font unification: --body starts with Pretendard. Main introduction, expertise summary values, project-card descriptions, project summary and case-study body, Notes values, technical lists, career copy, profile/approach text and explanatory hints use it. The former Hangul-only unicode-range restriction was removed so English and numbers in those sentences also use Pretendard. Display headings and technical labels retain their Manrope and DM Mono stacks.

Project detail proportions: the desktop Notes column uses the midpoint between the original and reduced widths (192px between 230px and 154px; 175px between 210px and 140px at the intermediate breakpoint), with 14px inner left padding. The main video/image and copy column receive the remaining width. Mobile keeps the existing stacked layout.

Technical Breakdown renders as a static section with a heading and all technical notes visible. The former details/summary disclosure and toggle indicator have been removed.

## Cinematic Workflow Toolkit collaboration and impact — 2026-10-27

The owner supplied an improvement claim of more than 100x over the previous manual workflow and described cross-discipline source coordination. The project overview, objective, contribution, implementation, result and Related TA Skills now emphasize source-management consistency across modeling/animation/rigging/FX/rendering, conflict/omission reduction, DCC–engine integration and artist-tool development. The 100x claim is placed in Result and scoped to automated source-processing/shot-setup tasks, not total production or render time. It is owner-reported and was not independently benchmarked; before publication the owner should confirm a representative baseline, task scope and timing evidence. No zero-conflict guarantee or additional measured figures were introduced. A collaboration/standardization subsection was added using the already described ShotGrid/SVN/Sequencer/MRQ workflow.

The editorial presentation experiment was reverted at the owner's request. The site was restored from the pre-editorial snapshot; only cache version strings were refreshed so the previous presentation loads immediately.

Project card descriptions are clamped to a maximum of two lines at all breakpoints, with two-line reserved height on desktop. Full descriptions remain in the detail viewer.

Detail copy scale: the opening project description is 15px (the former case-body size). Numbered case headings are 16px/600, matching Technical Breakdown subsection headings; their paragraphs are 14px with 1.8 leading, matching the technical lists. These sizes apply on desktop and mobile. Pretendard remains the font for full body sentences, including English and digits. Project-title and Notes typography are unchanged.

The right-hand Notes values use the same 14px size and 1.8 line height as the case-study body; their Pretendard font is retained. Notes labels remain unchanged.

The three hero expertise summaries are visually subdued: 9px muted-gray labels and 11px regular-weight gray values, with a lighter divider. This applies across breakpoints and retains the existing three-part layout and Pretendard description font.

The main headline block is reduced to 85% of the copy-column width, with a proportionally smaller base font (17cqw vs 20cqw). The existing line fitting keeps the four rows aligned inside that narrower block. Weight, colors, leading and hero/video columns are unchanged. The introduction beneath it uses 14px instead of 15px.

The hero Explore Selected Work link is visually subdued with 10px muted text, a smaller 14px arrow, lighter underline and reduced internal gap. Its existing click target and section-jump behavior are retained.

Featured projects, Selected projects and Earlier work collection headings retain their existing 20px size and now match the in production. heading accent: #6b8035 and font weight 600.

Project collection headings are displayed in uppercase (FEATURED PROJECTS, SELECTED PROJECTS, EARLIER WORK) while retaining their current size, weight and olive color.

CinematicShading has featuredOrder null and selectedOrder 0. It appears first under SELECTED PROJECTS, ahead of normal date sorting, with no FEATURED badge. Other project ordering and categories remain unchanged.

The local-ai-3d project is titled Local AI 3D Generator in the card and detail viewer. Its stable id, categories and media are unchanged.

The hero eyebrow reads VISUAL ART · TECHNICAL DEVELOPMENT · PRODUCTION PIPELINES.

The horizontal divider above EARLIER WORK is removed; section spacing is retained.

EARLIER WORK has no extra wrapper margin or padding above it; its heading uses the same 32px top margin as the other project collection headings.

Earlier Work is now consistently dated 2015–2021 across all three titles, year metadata, descriptions and text thumbnails. Rig Breakdown lists Maya; Tools & Pipeline and Production Showreel list Maya, Unity and Unreal Engine. The user-supplied unity_logo.png is copied to ../assets/tools/unity.png. Card logos keep the existing small muted treatment, with black Unreal on the light background. Video ids and stable project ids are unchanged.

Cinematic Workflow Toolkit card software logos include Unreal Engine, Maya, Python and C++, retaining the current small, muted styling.

The Copy Project Link button, clipboard handler and copy-feedback UI were removed at the owner's request. Project URL routing and browser history behavior remain in place for navigation.

All project-card View Project footer buttons are removed. Release links remain when a release URL exists; thumbnails and titles still open the project detail viewer.

Cinematic Workflow Toolkit uses the updated YouTube video https://youtu.be/zBuRQKSIXgI, including the JavaScript-disabled fallback link. Module cache versions were refreshed to load the updated media data.

Production Breakdown uses the updated YouTube video https://youtu.be/R-7Lavq2Sdk. Its existing poster assets/thumbnails/production-makefilm.png is preserved. The fallback video link and module cache versions are updated.

## Thumbnail hover previews

## Project-collection hover disclosure (2026-10-28)

## Thumbnail-only scroll choreography (2026-10-28)

Replay is now armed when scrolling back above the projects far enough that the entire collection is below the viewport. A persistent viewport observer resets the global trigger, clears active animation timers and restores pending entrance states. Returning downward in non-hover mode replays the existing whole-grid cascade. Scrolling past the grid into Experience, or moving between project rows, does not reset it. Touch/reduced-motion behavior is unchanged. No ZIP was rebuilt or browser test run.

Latest trigger revision: the entire thumbnail grid now shares one viewport trigger. When the collection top reaches 72% of viewport height in non-hover mode, all visible-category cards start the same timed cascade, including cards below the fold. The existing 560 ms motion and 65 ms stagger (390 ms cap) remain. Further scrolling does not trigger individual rows; the observer disconnects after the single global trigger. Filter-hidden cards are finalized without animation so switching filters later does not introduce delayed entrances. This supersedes the per-row trigger behavior below.

Latest behavior replaces scroll-progress positioning with a timed entrance. In thumbnail-only mode, crossing a trigger at 72% viewport height starts a 560 ms upward settle with 65 ms left-to-right delays (capped at 390 ms per batch). Once triggered, the animation runs automatically even if scrolling stops; later rows trigger when they reach the same line. Each card plays once. The compact gap stays 5.5 px with no animated row margins. Hover entry immediately cancels active entrances and restores the full detail layout. Reduced motion, touch, keyboard focus and print retain visible cards. IntersectionObserver handles scroll triggering; there is no continuous scroll handler. This supersedes the former scrubbing, column taper and row-spacing notes below. No package or browser test was produced.

Latest column taper: extra inter-row spacing is reduced to 12 px. In the three-column layout the initial rise offsets now taper left to right at 158 / 79 / 0 px; the third column has no individual rise transform. At two columns the right column is the fixed reference; a single column has no rise transform. Shared grid reflow can still move later rows as the small extra row spacing closes. The existing trigger, hover behavior and 5.5 px resting gap remain. This supersedes earlier stair-offset notes.

Latest spacing adjustment: extra spacing between rows is reduced to 48 px, while the initial within-row stair offsets increase to 54 / 106 / 158 px (52 px height difference between columns). The 72% viewport trigger and final 5.5 px grid gap remain unchanged. This supersedes the earlier spacing values below.

Visibility tuning: row motion now starts when the untransformed row top reaches 72% of viewport height rather than 96%, keeping more of the animation on screen. Reveal travel is 36% of viewport height (200–360 px). The extra initial row spacing is doubled from 64 to 128 px; the final base gap remains 5.5 px.

`compact-scroll.js` runs only on fine-pointer devices, with reduced motion off, while the pointer and keyboard-visible focus are outside the collection region. Thumbnails rise from 54/78/102 px offsets in left-to-right phases per row. Later rows initially have up to 64 px of additional top spacing; scroll progress closes this actual spacing to the base 5.5 px grid gap. Row progress is driven by the viewport, eases out and never rewinds once seen. Filters and responsive column changes are accounted for.

Hovering/focusing the region disables the card transforms and extra margins in CSS immediately, restoring the existing sectioned detail layout. Touch and reduced-motion users retain static layouts. An observer gates offscreen work; passive scroll/resize handlers schedule a single animation frame, with geometry reads before writes and compensation for the applied margin and translation. No continuous animation timer is used. No archive was rebuilt or browser test performed.

In the non-hover thumbnail-only state, arrow icons, category labels, featured badges, the discipline bottom line and thumbnail gradient are hidden. A small white 11 px single-line project title appears at the lower left instead, with text shadow for contrast. Hover or keyboard-visible focus restores the normal overlays and hides the compact title; touch retains the normal expanded view. Original artwork is not modified.

The non-hover thumbnail-only grid uses a 5.5 px gap in both directions, halving the previous 11 px spacing and allocating the recovered width to larger thumbnails. The expanded hover layout retains its existing spacing.

Correction to the continuous-grid trial: hovering the shared collection region (or keyboard-visible focus inside it) now restores Featured Projects, Selected Projects and Earlier Work headers, their right-side descriptions and their separate original grids. Outside the region, headers disappear and thumbnails flow continuously without empty section slots. The fast metadata drawer transitions remain, and headings ease in over 220 ms. Touch devices and print retain section headers and descriptions. This supersedes the permanently hidden section-header behavior below.

Latest revision: collection headings and their right-side descriptions are hidden, and collection/grid wrappers use display:contents so all cards flow into one continuous 3-column desktop grid without empty featured slots or section gaps. The card sequence and category filtering remain intact, with two columns below 1100 px and one below 600 px. Metadata now has an intrinsic-height grid drawer: pointer entry expands over 340 ms with a fast eased slide; pointer exit collapses over 240 ms and closes the space below thumbnails. Keyboard-visible focus opens the region and touch displays full metadata. Reduced motion disables transitions. This supersedes the earlier static display:none disclosure and per-section layout below. No package was rebuilt or browser tests performed.

A shared `.project-collections` container wraps Featured, Selected and Earlier Work below the category toolbar. On desktop hover-capable devices, entering any part of this region displays all card information in the normal layout. Leaving the entire region hides work-card-info with display:none, removing its height and tightening thumbnail rows to 22 px. Moving between individual cards does not collapse the layout. Section headings and thumbnail controls remain visible. Keyboard-visible focus also opens the region; touch/coarse-pointer devices and print retain the full descriptions. The first featured card keeps a stacked shape at desktop/tablet widths to prevent hover-driven thumbnail resizing. This is a CSS-only interaction with no scroll entrance animation. No package was rebuilt or browser test run.

## Card entrance animations removed (2026-10-28)

The card reveal/unfold experiment is disabled: `card-reveal.js` is no longer imported or initialized, and `card-reveal.css` is no longer loaded. Cards show their thumbnail, year, discipline, title, description and tool icons immediately, using the original grid spacing with no animated information drawers. Existing thumbnail hover video previews, color accents and hero scroll-arrow animation remain. This supersedes all card entrance/unfold trial notes below. No transfer package was rebuilt.

## Project card scroll entrances (2026-10-28)

`card-reveal.js` and `card-reveal.css` add one-time entrances to Featured, Selected and Earlier Work cards. At the first viewport entry, each card fades in over 650 ms and rises 20 px over 850 ms using a restrained ease-out; columns stagger by 75 ms with a 150 ms maximum. IntersectionObserver is used instead of continuous scroll listeners. Only opacity and transform animate, with no layout or image-color changes. Completed cards restore their ordinary styling and are unobserved; filtering does not replay already-seen cards, and previously hidden/unseen cards reveal when they become visible.

Reduced-motion preference, printing and unsupported observers show static cards. Keyboard focus reveals a pending card immediately. The current three-column layout, discipline accents, media previews and project navigation remain in place. No archive was rebuilt and no browser tests were run in this pass.

## Project discipline color accents (2026-10-28)

Compact thumbnail titles return to white. A small 9 px category label is placed at the thumbnail's bottom right, with the title slightly above its baseline to prevent overlap. When the open-project arrow is visible, the category text reserves space beside it. Expanded information titles revert to their original dark text with discipline-colored hover feedback; year-adjacent categories keep their olive/peach colors. This supersedes the always-colored title styling below. No package was rebuilt.

Project titles now consistently use discipline colors: technical cards use olive, production cards use peach. Compact titles on thumbnails use the lighter card-accent token; expanded titles on the light information panel use the darker card-accent-ink token for readability. Main hero typography is unchanged. No package was rebuilt.

Hovering a project's thumbnail also colors its title with the same production peach or tech olive used by direct title hover. Keyboard-visible focus on the thumbnail gives the same feedback.

All project cards, including Earlier Work, label their discipline TECHNICAL (technical development) or ART (production art). The existing olive/peach classification is reused. In Earlier Work, Tools & Pipeline is TECHNICAL; Rig Breakdown and Production Showreel are ART. The Earlier Work section heading remains unchanged.

The folded-ticket corner experiment was removed at the owner's request. The existing discipline-colored bottom line, metadata and hover outline remain.

`card-colors.css` distinguishes production cards with peach accents and technical cards with olive accents. The thumbnail bottom edge has a 2 px accent; the discipline metadata uses a darker readable tone; hover and keyboard focus add a subtle outline without changing card dimensions. Featured badges follow the same palette. Card imagery, description colors, three-column layout and existing ordering are retained. Classification uses `kind=tool` or tool/pipeline tags, including Earlier Work Tools & Pipeline. No archive was rebuilt and no browser tests were run in this pass.

The Featured Projects two-column enlargement was reverted at the owner's request. `featured-layout.css` is no longer loaded; all project collections again use their original responsive grid styles. No transfer archive was rebuilt.

## Project columns trial (2026-10-28)

Latest layout revision: each Selected Projects discipline now has one card per row, producing two columns overall with the same card widths and 22 px center gap as Featured Projects. Earlier Work also uses two cards per row. Card typography returns to the standard project-card scale. Independent newest-first ordering remains. Below 600 px the sections stack into single columns; a filter leaving one discipline displays its cards in two columns on larger screens. This revision supersedes the earlier four-column trial description below.

Featured projects use two equal cards: Cinematic Workflow Toolkit then Production Breakdown. Selected Projects is split into Tools & Pipelines on the left (`kind=tool`) and Cinematic Production on the right (other current entries), with two card columns within each half on wide screens. Each discipline sorts independently by latest year descending (ranges use their end year); equal-year entries keep catalog order. The former selectedOrder pin does not override chronological order. Earlier Work retains its existing grid.

Filters hide matching cards and empty discipline headings; when only one discipline remains, it occupies the available width. Detail previous/next navigation and card numbering follow the displayed featured → tools → production → archive sequence. Hover previews continue using the same card markup. At 901–1100 px each discipline has one card column, at 601–900 px the two disciplines stack with two cards per row, and narrow phones use one card per row. `project-columns-preview.css` holds the visual overrides. The pre-trial HTML, JS and README are saved in `Q:/Codex/portfolio-backups/20261028-before-project-columns`. No ZIP was rebuilt and no browser tests were run in this pass.

## Full-screen hero trial (2026-10-28)

The three expertise description blocks (Worlds / Shaders / DCC workflows) use white (#fff); their small section labels retain their current treatment.

The text-based Explore Selected Work link is replaced by a large white SVG arrow at the lower left of the full-screen hero. It links to #work and uses a slow 3.6-second downward stretch and eased return. It has an accessible link label, visible keyboard focus and a static reduced-motion alternative. On narrow screens, the project metadata reserves space for the arrow to avoid overlap. No package was regenerated.

The two-line Korean introduction beneath the main headline uses white (#fff), retaining its current typography and text shadow.

My Role typography matches the hero expertise summary: the label uses 9 px DM Mono and the role description uses 11 px Pretendard, weight 400, line-height 1.6. Colors are restored to the original metadata palette: label #efc6ad, role copy #fff and project title #fff. Placement beside the play/pause control is retained.

The full-screen hero hides project year/category and places the project title and My Role at the lower right, immediately to the left of the play/pause button with a 16 px gap and the same bottom alignment. Type remains reduced by 30%. The dark overlay is only a left-to-right gradient, reaching zero opacity at 70% of the viewport width; the rightmost 30% has no dark overlay. The former full-width bottom gradient is removed. These overrides apply only to the full-screen trial.

`fullscreen-hero-preview.css` makes the current hero video an edge-to-edge background occupying at least the first viewport below the existing header. The headline, introduction, expertise summary and work link stay on the left, with project metadata and the playback control at the lower right. Dark directional gradients and lighter hero text maintain readability over changing footage. Narrow screens stack the copy above the project metadata while retaining the video background. Project thumbnails retain their agreed 6 px corners; the edge-to-edge hero has square outer edges. Remove only the fullscreen stylesheet link from index.html to restore the existing split hero. No archive was rebuilt and no browser/UI test was performed in this pass.

An optional `rounded-preview.css` stylesheet gives the main hero video and all project thumbnails subtle 6 px corners, including hover video clipping. Layout, colors and detail-view media styling remain unchanged. Remove its link in index.html to restore square media corners. This visual trial is applied only to the working site; no transfer archive was rebuilt.

The Selected Work section date range is 2015–2026, covering the earlier work as well as recent projects.

The project-section introduction now describes experience in high-quality real-time visuals through Unreal Engine cinematic production, inviting visitors to explore the technical artist's approach and results across art, tool development and pipeline design. This copy update was applied to the working site only; the existing transfer package was not rebuilt.

The lower approach contact area uses compact Outlook and Slack SVG icons, without text-button frames. Icons have muted brand colors, 44 px clickable targets, accessible labels and hover titles. The header retains its text links. The Outlook icon retains the existing mailto behavior (opens the visitor's configured mail app); it does not force Outlook. Slack retains the Enterprise profile destination.

Slack contact buttons appear beside LET’S TALK in the header and approach section. The owner supplied the KRAFTON Enterprise domain and member ID; `profile.slackProfileUrl` points to `https://krafton.enterprise.slack.com/user/@U022E9ULBT3`, using Slack's documented Enterprise profile link format. This opens the member profile for accessible organization members, from which they can message the owner. Direct native DM deep links require a workspace team ID, which has not been supplied. Links open a new tab; no messages are sent automatically. Authenticated Slack navigation has not been tested.

Desktop mouse hover immediately creates a muted preview for either local video (`entry.video` or `media.type=video`) or YouTube media, with no intentional delay. Only one card preview exists at a time. Local video loops with cover sizing; YouTube uses its privacy-enhanced embedded player and the IFrame API to mute before playback and reveal only after the playing event. Original posters remain visible during loading or playback errors. YouTube branding/loading and embedding restrictions are controlled by YouTube; no remote video is downloaded.

YouTube API and connection prewarming begins when the project section is within 600 px of the viewport on eligible desktop devices. Iframe and API requests also run in parallel on hover, eliminating the previous serial loading delay. Actual YouTube media startup still depends on the remote player and network; short locally supplied preview MP4s are the next option for consistently faster previews.

Pointer leave/down, project opening, category changes, page hiding, window blur, or scrolling the card out of view destroys the preview and restores the original thumbnail. Preview media is loaded on hover; the YouTube API is warmed near the project section. Touch devices and reduced-motion preferences retain static thumbnails. Thumbnail clicks still open project details. This implementation was not browser-tested in this pass.

Earlier Work uses the owner-supplied 2015_rig.png, 2015_tool.png and 2015_project.png for Rig Breakdown, Tools & Pipeline and Production Showreel respectively. Originals are copied into assets/thumbnails and small/card/detail WebP derivatives are included in the image manifest. Video links are retained. The transfer ZIP has not been rebuilt.

## Project layout restored (2026-10-28)

The two-discipline column trial has been reverted. The original Featured / combined Selected / Earlier Work markup, ordering, filtering and desktop three-column grids are restored from the pre-trial snapshot. project-columns-preview.css is no longer loaded. Full-screen hero styling, contact icons, current text, thumbnails and hover previews are retained. No transfer package was rebuilt. This supersedes the project-column trial notes above.

## Revised card information reveal (2026-10-28)

Latest correction: hidden information now lives inside a zero-height drawer rather than reserving its full height. Unopened thumbnail rows sit together with a 22 px row gap. Scroll progress increases the drawer's real height and pushes later rows down; normal grid rows remain aligned to their tallest card. Drawer position is the reveal anchor, while ResizeObserver updates measured content height after fonts or responsive width changes. Scroll anchoring is disabled for this animated grid to prevent compensating scroll jumps. Keyboard focus, reduced motion and print expand drawers immediately. This supersedes the reserved-space behavior described below. The card-info wrapper remains in place after reveal. No package or browser test was produced.

This supersedes the earlier whole-card fade/rise. Thumbnails are always visible and stationary. Only work-card-info (year, discipline, title, description, tools and release link) starts clipped and unfolds downward as scrolling brings its original top above 78% of viewport height. Full disclosure takes another 24% of viewport height (clamped to 120–220 px). Information translates down from -18 px to its resting position while the clip opens top-to-bottom. Progress is driven by scroll distance, not a fixed-duration entrance or stagger, and never decreases after being revealed.

Existing card dimensions are reserved to prevent the thumbnail grid from jumping. The nearby-card observer limits geometry work; passive scroll events schedule one requestAnimationFrame, with batched reads/writes and compensation for the information transform. Keyboard focus opens information immediately, reduced-motion/print show static content, and filter changes update nearby cards. No ZIP was rebuilt or browser test performed.

Compact thumbnail titles now match the hero video project-title typography: Manrope (Pretendard Korean fallback), weight 500, letter-spacing -0.045em, line-height 1.15 and the same single subtle text shadow. Compact titles retain their 11 px size and white color. No package was rebuilt.

Compact thumbnail title size is now 33 px (three times the previous 11 px), retaining the hero title font treatment and white color. This supersedes previous compact title size notes.

Compact thumbnail titles are set to 14 px at the owner's request, superseding the 33 px trial. Font, weight, letter spacing and white color remain unchanged.

## Stable transition into Experience & Expertise (2026-10-28)

`collection-layout.js` holds the expanded collection state through pointer exit so the pre-collapse geometry can be captured. When the next Experience section is near the viewport and the grid has already scrolled upward, collapse preserves that section's screen position. It first compensates the immediate section-to-grid reflow, then compensates document-position changes for 420 ms while metadata drawers finish closing. Wheel/trackpad movement is not locked: only layout-induced movement is offset. Native scroll anchoring and smooth scrolling are temporarily overridden during correction and restored afterward. Other pointer exits retain normal compact behavior, and reentry cancels correction. Modal-open state defers closing. Compact cascade selectors recognize the held expanded state. No package was rebuilt and this fix has not been browser-tested.

## Individual-card hover trial (2026-10-28)

## Project heading revision (2026-10-28)

The work-section heading reads “Art, engineered.” / “For production.” in Manrope, with a responsive 34–64 px size, line-height 1 and letter-spacing -0.05em. “Art,” uses dark peach #9b6345 at weight 700, “engineered.” uses ink #171b18 at weight 500 and the second line uses olive #6b8035 at weight 600. The Selected Work date, introduction, layout and card behavior remain unchanged. No package was rebuilt.

## Wider project detail (2026-10-28)

The project dialog maximum width increases from 1320 to 1760 px, still fitting the viewport with 16 px outer gutters. Desktop shell side padding reduces from a maximum 38 to 28 px and the media/notes gap reduces from a maximum 48 to 32 px. The 192 px desktop notes column and all text sizes remain unchanged, allocating the extra width to the main video/image column. Existing tablet/mobile overrides and contain image fitting are retained. No package was rebuilt.

## Refined card spacing (2026-10-28)

Diagonal refinement: the gap between a same-row neighboring thumbnail and its next thumbnail now resolves to 16 px. Its column still inherits the 12 px same-row shift, while the selected card's own lower gap stays 24 px. The 8 / 12 / 16 / 24 px hierarchy is centralized in CARD_SPACING and included in reserved-height calculation. This supersedes the previous 24 px adjacent lower-column gap.

Using ui-ux-pro-max guidance on consistent spacing, hierarchy and interruptible movement, hover displacement is now organized around 4 px increments: earlier cards in the same column lift 8 px; immediate same-row neighbors and their column tails shift down 12 px; the opened card's lower gap and adjacent lower-column gaps resolve to 24 px. These are design choices for this layout, not universal pixel prescriptions from the skill. The owner-approved compact 5.5 px gap, drawer easing/duration and fixed reserved page height remain. Values are centralized in CARD_SPACING and used by both live positioning and the maximum-height planner. Global Expand mode still disables individual neighbor shifts. This supersedes the previous 10/10/20 px tuning. No package was rebuilt and no browser tests performed.

Opening a card now lifts earlier cards in the same column by 10 px at full expansion, including the immediately preceding thumbnail. The prefix moves together to avoid overlap with the card above it; the selected card itself is not lifted by its own expansion. The offset follows drawer progress, is disabled in global Expand mode, and uses the same reserved-height planner. Existing 10 px adjacent-side movement and 20 px lower gaps remain. No package was rebuilt.

The 10 px same-row nudge now applies symmetrically to both immediately adjacent cards, left and right. At an outer column only the existing neighbor moves; there is no row wrapping. Their column tails follow to maintain spacing. The 20 px lower gaps and reserved page height remain. This supersedes the right-only wording below.

Latest spacing: the neighboring-column gap below an opened card is restored to 20 px (14.5 px added to the 5.5 px base). Additionally, the card immediately to the right in the same row shifts down by 10 px at full expansion; this shift carries through that column's subsequent cards so they do not overlap. No wrap to the next row occurs when opening the rightmost card. Both shifts follow drawer progress, are disabled in global Expand mode, and are included in the reserved-height planner. This supersedes the 2.75 px trial. No package was rebuilt.

Latest neighbor adjustment: adjacent columns shift by only half of the 5.5 px base gap (2.75 px) at full expansion. Their total gap becomes 8.25 px, while the space directly below the opened card stays 20 px. The small movement follows drawer progress and is included in the reserved-height planner. This supersedes the matched 20 px neighboring-gap trial.

Neighbor gaps now match the 20 px gap directly below the opened card. Instead of a fixed 40 px nudge, adjacent columns add (20 - 5.5) px multiplied by the drawer's open progress, yielding a 20 px total gap at full expansion. Only rows below the source card move; closed/resting spacing remains 5.5 px. The reserved-height planner uses the same calculation. This supersedes previous neighbor-nudge values. No package was rebuilt.

When a card opens on hover/keyboard focus, its thumbnail category overlay is hidden; the category beside the year in the information panel remains visible. The overlay is also hidden in global EXPAND mode. Compact closed cards keep the title/category two-line treatment; featured badges and other thumbnail controls are unchanged. No package was rebuilt.

The project section no longer uses a fixed 60% width on all window sizes. It uses available window width minus responsive gutters, capped by clamp(1290px,60vw,1920px). This preserves the original 1290 px desktop content width as the reference cap on ordinary windows, retains the enlarged 60vw treatment on very wide displays, and fits smaller windows only when necessary. Below 600 px, side gutters remain 22 px. The introduction retains a 460 px reading width, compact thumbnail titles remain 16 px, and existing 3/2/1-column breakpoints and interactions remain intact. ResizeObserver updates card geometry and reserved height automatically. No package was rebuilt.

FEATURED / 01 and FEATURED / 02 badges remain visible on the two featured projects in both compact and expanded states, regardless of pointer position. Other compact-overlay behavior is retained.

Thumbnail hover now fades out the dark gradient over 180 ms; idle thumbnails keep the existing gradient. Keyboard-visible focus gives the same bright preview. Category labels are removed from the thumbnail overlay and instead appear beside the year, replacing TECHNICAL / ART with the actual project tags (for example WORLDS · RENDER · FX or TOOL · PIPELINE). The metadata retains its discipline-specific olive/peach text colors and can wrap within the card. Project classification and filtering are unchanged. No archive was rebuilt.

Default compact thumbnails now retain the same dark lower gradient as hovered thumbnails, avoiding a brightness change when a card is opened. Compact mode still shows only the project title; category labels, arrows, featured badges and discipline bottom lines retain their existing hover-only behavior. The overlay is linear-gradient(transparent 55%, rgba(6,11,8,.5)).

## Reserved project-region height (2026-10-28)

The desktop collection reserves enough height for its largest single-card expanded layout by default. The estimate uses closed thumbnail-column heights, each card's full natural information height, the 20 px gap below an opened card and the 40 px neighboring-column nudge. Collapsing a card leaves the reserved room below the thumbnails rather than changing the next section's position. The reservation updates for responsive widths, category filtering, fonts and content sizes, not hover progress. Info elements are observed even while clipped to catch font-height changes. Touch continues using its static fully open layout. The old collection-layout.js scroll-correction module is no longer imported or initialized because it is no longer needed. Existing independent-column movement, card styling and cascade remain. No package was rebuilt and no browser tests were run.

The category toolbar's bottom divider is removed; toolbar spacing and all thumbnail/card behavior are retained.

The gap directly below an expanded card now opens to 20 px, interpolating from the normal 5.5 px gap with the measured drawer expansion. Other resting gaps remain 5.5 px. The neighboring-column nudge remains capped at 40 px. No package was rebuilt.

## Active-card contrast (2026-10-28)

The shallow active-card shadow alone has been restored in card-colors.css: hover or keyboard-visible focus adds 0 2px 6px rgba(23,27,24,.12), with a 220 ms transition. Neighboring thumbnails retain their normal brightness, saturation and title opacity.

The active-card contrast experiment was removed at the owner's request. `card-focus.css` is no longer loaded, restoring normal thumbnail brightness, saturation and title opacity and removing the added shadow. Individual-card expansion, the thin border and independent-column behavior remain.

Expanded-card framing now uses a 1 px internal border instead of the former 7 px offset outline. Its top and side edges exactly match the thumbnail width and its bottom encloses the metadata/footer within the measured card height, leaving the 5.5 px gap to the next thumbnail clear. Information has 12 px side/bottom padding. Expanded thumbnails keep only their top corners rounded so thumbnail and information form a single card. The existing production/tech border tones, independent-column movement and neighbor nudge are retained. No outward shadow is used.

Adjacent-column refinement: an opened card still pushes its own column by the full information height, but cards in the following rows of immediately adjacent columns now move down by 24% of that expansion, capped at 40 px per open card. Same-row neighbors and nonadjacent columns remain in place. The small offset follows measured drawer height so it eases back as the card closes. Touch layouts retain independent columns without neighbor nudges. Overall collection height includes these offsets.

Latest adjustment: `independent-card-layout.js` positions cards in independent columns, preserving the original left-to-right project sequence in the DOM and the initial compact arrangement. Opening one card pushes only later cards in that same column; neighboring columns retain their positions. ResizeObserver follows the drawer height during its existing transition, batches layout in requestAnimationFrame and updates the overall collection height. Filters redistribute visible cards in the existing order, and responsive widths retain 3/2/1 columns with 5.5 px gaps. No shortest-column resorting is used, preserving chronological reading order in the initial grid. Browsers without ResizeObserver fall back to the regular grid. Print returns to static grid positioning. No package or browser tests were produced.

The compact, continuous 3-column grid with 5.5 px gaps is now the default across the whole collection, including while the pointer is inside it. Section headings stay hidden in this trial. Only the hovered or keyboard-focused card opens its own year, discipline, title, description and tool/release footer below the thumbnail; keeping the pointer on those details keeps that card open. Other cards retain only their thumbnail and 14 px overlay title. The hovered card restores its normal thumbnail overlays. Grid rows expand to their tallest card, so later rows move down while the other cards in the same row keep their information closed.

Video previews remain. The whole-grid cascade now runs independently of region hover, but hovering/focusing a specific card immediately settles only that card. Returning fully above the collection still rearms the cascade. Lower-section scroll correction is scoped to individual card collapse. Touch users get all card information without requiring hover. Pre-trial files are backed up in Q:/Codex/portfolio-backups/20261028-before-individual-hover. This supersedes the shared-region hover notes. No ZIP or browser tests were produced.

## Large featured-pair trial (2026-10-28)

The large featured-pair trial was reverted at the owner's request. data-featured-pair is removed, so every project again uses the same-size three-column desktop layout. Reserved region height and the other existing card interactions remain intact.

The optional data-featured-pair attribute creates a wide top band containing Cinematic Workflow Toolkit and Production Breakdown, two equal-width cards side by side. Remaining projects retain the existing 3/2/1-column independent layout beneath it. On phones the featured pair stacks. Hover disclosure, thin borders, shadows, 20 px space below expanded cards, neighbor movement and the global/replay cascade are retained. Expanding a featured card shifts the lower band below the larger featured band, while the other featured card stays in place. A pure layout planner reserves the maximum fully opened-card height across both bands so Experience remains stationary during hover. Filters are supported. Remove data-featured-pair to restore the previous all-card grid. Pre-trial files are saved in Q:/Codex/portfolio-backups/20261028-before-featured-pair. No ZIP or browser tests were produced.

## All-card Details toggle (2026-10-28)

The ON/OFF switch presentation is replaced by an EXPAND ALL / COLLAPSE ALL disclosure button with a down/up chevron. It uses aria-expanded and aria-controls, with a stable label width to avoid toolbar movement. The underlying global detail-mode behavior is unchanged. This supersedes the switch presentation described below.

A compact DETAILS ON/OFF control sits beside the project count in the category toolbar. OFF (default) retains thumbnail-only cards with individual hover/focus disclosure. ON opens all years, titles, descriptions, software and release links, with each card's thin frame. Switching categories retains the current Details mode. In full-details mode the planner reserves the fully open layout and disables the neighbor nudge, while switching back restores the individual-card reserved height. A temporary min-height holds the collection for 400 ms during drawer transition to prevent content overlap. Changing mode explicitly changes the layout height; ordinary hover still uses its stable reservation. A native button with aria-pressed, aria-controls, visible ON/OFF status and screen-reader feedback supports keyboard access. The switch is hidden on touch/coarse-pointer devices where details already remain open. The cascade is finalized when Details is ON and can be rearmed by returning above the collection. No persistent preference is saved. No ZIP or browser tests were produced.

## UI/UX skill preference and card-view control (2026-10-28)

For UI/UX work in this conversation, the owner requests ui-ux-pro-max as the default skill. The skill's UX search on compact-control semantics, keyboard operation, cancellable transitions and selected states informed this component revision.

The global card-view control is now a two-option COLLAPSE / EXPAND segmented control. Compact-grid and detailed-card SVG icons distinguish the options; a dark sliding indicator and pale olive selected icon match the existing filter styling. Both choices remain visible, active state uses aria-pressed, and native buttons provide Enter/Space operation with visible focus and 44 px minimum targets. Selecting the already active mode does nothing. Rapid changes replace the pending layout-settle timer. Reduced motion disables indicator movement. Touch devices retain the full-details view and hide this desktop-only control. Existing card behavior and category selection remain unchanged. This supersedes the earlier ON/OFF and alternating-button presentations. No ZIP was rebuilt or browser tests performed.

Compact thumbnail titles are enlarged from 14 px to 18 px. Existing Manrope typography, white text, position and single-line overflow behavior are retained. This supersedes earlier title-size notes. No package was rebuilt.

Compact thumbnail titles are returned to 14 px to suit the narrower 50% project region. Font, color and placement remain unchanged. This supersedes the 18 px size note. No package was rebuilt.

Local AI 3D Generator card thumbnail now uses its last gallery image, assets/technical/local-ai-3d/3D_AI_Asset_tool_render06.png. Gallery order, video link and video poster are unchanged; existing WebP derivatives are reused. No package was rebuilt.

Local AI Moodboard Image Tool card thumbnail now uses its fourth gallery image: ./assets/technical/ai-moodboard/ai_moodboard04.png. Gallery order, video poster and video link are retained. No package was rebuilt.

Thumbnail overlays are now left-aligned in two lines: the 16 px white project title above the 9 px category label. Categories use the light discipline accent (olive for technical work, peach for production). The category retains clearance from the open-project arrow. No package was rebuilt.

Career organization hierarchy is normalized: Animation / VFX Studio now uses the same career-studio style as KRAFTON · Cinematic Production (Pretendard, 14 px, weight 400, color #c2cbbd). The grouped organization retains its semantic h4 while its role titles and grouped career structure remain intact. No package was rebuilt.

The ROLE PROGRESSION label is removed from the grouped Animation / VFX Studio career entry. Company and role grouping remain unchanged. No package was rebuilt.


## Abstract brain toolkit profile (2026-10-28)

The Tools & Expertise dot field now follows a softly lobed brain side silhouette instead of a circle. Cartesian dot spacing, muted olive colors, pointer brightness/size response, usage tiers, hover/focus pause and reduced-motion behavior are retained. A shared smoothed contour masks the dots and provides inward normals for icon reflections, with clearance based on each icon size. No anatomical outlines or internal folds are drawn. The square responsive field remains unchanged. This is a local design trial; the previously delivered ZIP has not been rebuilt. Browser appearance has not been visually verified.


## Illustrated cumulus toolkit profile (2026-10-28)

Supersedes the brain silhouette trial: the dot mask now forms a wide illustrated cumulus cloud, with large rounded upper lobes, smaller side lobes and a gently rounded base. The same contour controls icon reflection and size clearance. Cartesian dots, colors, pointer interaction, icon usage sizes/speeds and motion accessibility remain unchanged. No realistic cloud texture or outline is used. Existing ZIP is unchanged.


## Cloud / brain hybrid toolkit silhouette (2026-10-28)

Replaces the cumulus-only trial with a cloud-soft brain side profile. Broad rounded upper lobes and a gently asymmetric lower contour suggest the brain without anatomical folds. The descending stem is removed entirely; only a shallow lower scallop remains. Dot masking and icon reflection still share the same contour. Existing interaction, grid, palette and usage tiers remain unchanged. Previous ZIP is not updated.


Toolkit cloud-brain field enlarged 20% on desktop: width 120%, maximum 672px (previously 560px), centered in its existing column. Icon size bounds also increased 20%, retaining container-relative proportions and usage hierarchy. On single-column screens the field stays within available width, with maximum 624px (previously 520px), to avoid horizontal scrolling. ZIP unchanged.


Toolkit icons reduced to 80% of the preceding size across all usage tiers, including container-relative sizing. The enlarged cloud-brain background stays unchanged. Collision clearance continues to derive from actual button size; minimum 44px interaction targets remain available. This gives icons more room while retaining tier hierarchy. ZIP unchanged.


Cloud-brain silhouette softened: recessed anchor points filled halfway (50%) toward the convex envelope and horizontal shape widened by 2.5%, capped inside the canvas. Smooth interpolation retains broad cloud lobes with shallower indentations. Shared dot mask and icon boundary both use the revised contour. Field and icon sizes unchanged. ZIP unchanged.


## Balanced career and toolkit columns (2026-10-28)

Career and toolkit panels now use equal minmax(0,1fr) columns within a centered 1120px maximum, retaining the single-column breakpoint. Toolkit width returns to 100% of its panel (560px cap). Its stem-free cloud-brain contour is vertically extended, with a rectangular canvas and matching icon coordinates/collision clearance; Cartesian dots stay evenly spaced. The usage-frequency hint moves immediately after the field, before the hover inspector, eliminating the previous empty inspector gap above the hint. Previously supplied ZIP is unchanged.


Toolkit footer order adjusted: dot field → selected tool / Usage inspector → usage-frequency hint. Inspector retains reserved height when inactive so the hint stays stable while hovering different tools. This supersedes the previous hint-before-inspector placement. ZIP unchanged.


## CinematicShading image replacement (2026-10-30)

Replaced cinematicshading01–04.png with the four revised files supplied from the portfolio source folder. Regenerated only these images at small/card/detail WebP sizes (480/960/2000px maximum), with dated filenames and refreshed module cache keys. Existing order, first-image poster and video are retained. Previously delivered ZIP is unchanged.


## Moodboard image replacement (2026-10-30)

Updated ai_moodboard01–05.png from the supplied revised source files and regenerated their 480/960/2000px maximum WebP derivatives with dated filenames. Refreshed module cache keys. Existing image order, sixth gallery image, fourth-image thumbnail, third-image poster and video are retained. Previously delivered ZIP is unchanged.


Erangel Subzero Lore Film thumbnail replaced from the supplied portfolio/subzero.png (2026-10-30). Regenerated small/card/detail WebP sizes with dated filenames and refreshed asset/module cache versions. Video remains unchanged. Previous ZIP not rebuilt.


Compact project thumbnails now include the project year above the title (10px DM Mono, muted white), followed by the existing title and discipline category. Year follows the same visibility rule as the compact title: hidden when card details are open, where year is already shown in metadata. No card dimensions changed. ZIP unchanged. (2026-10-30)


Battleground Intro & Collabo Showreel renamed to Battleground Showreel in the project catalog, updating cards and detail views. Cache versions refreshed. ZIP unchanged. (2026-10-30)


Local AI 3D Generator thumbnail switched from gallery image 06 to the revised 3D_AI_Asset_tool_render_th.png supplied by the owner. Original copied and 480/960/2000px maximum WebP derivatives regenerated with dated filenames; catalog and module cache versions updated. Gallery sequence unchanged. The existing poster references the same refreshed thumbnail source. ZIP unchanged. (2026-10-30)


ML Deform Simulation Procedural Workflow thumbnail/poster replaced from the supplied ml_deform/ browser-independent source PNG. Copied to existing assets/technical/ml-deform/ML_deform_Th.png and regenerated small/card/detail WebP derivatives, with refreshed cache versions. Gallery and video unchanged. ZIP unchanged. (2026-10-30)


Procedural Batch CFX Simulation Workflow thumbnail updated from the provided houdnini_simul source PNG. Added dedicated houdini_batch_thumbnail.png and optimized 480/960/2000px WebP sizes. Catalog uses the new card thumbnail, preserving the two existing gallery images and video. Cache versions refreshed. ZIP unchanged. (2026-10-30)


## Dedicated Cinematic Workflow Toolkit thumbnail (2026-10-30)

Added workflow-thumbnail.png (1674x1080) and an editable, self-contained SVG source. Large three-line title, Unreal Engine logo focal point and Maya → Unreal → Render stage cards replace the dense six-stage diagram only on the project thumbnail. Dark green/olive palette and a bottom overlay safe area match the site. Generated 480/960/2000px maximum WebP variants and refreshed module caches. Existing overview poster, detail gallery, YouTube and project text remain unchanged. Previous ZIP is not rebuilt. Design informed by ui-ux-pro-max hierarchy/contrast guidance.


Working Principle closing copy updated (2026-10-30): “Craft the visual. / Build the systems behind it.” Supporting Korean copy connects art production experience, visual goals, technical systems and shared tools/pipelines. Existing styling and contact links retained. ZIP unchanged.


## Equal EXPAND card height (2026-10-30)

EXPAND uses a fixed text budget equivalent to a one-line title plus two description lines. Wrapped titles (maximum two lines) borrow their additional height from the description. Paragraph spacing can shrink slightly to retain a whole description line, and overflow is truncated. Budget recalculates on layout, font readiness and resize; returning to COLLAPSE clears overrides. Individual hover behavior remains unchanged. Cache versions refreshed. ZIP unchanged. JavaScript syntax checked; browser appearance not verified.


## EXPAND footer and row alignment correction (2026-10-30)

Additional height mismatch came from RELEASE links (28px minimum) versus logo-only footers (19px), accumulating through independent columns. EXPAND now reserves a consistent 32px border-box footer including padding/border and prevents footer group wrapping. The layout planner synchronizes column cursors to the maximum after each EXPAND row, removing cumulative drift and keeping next-row thumbnail starts aligned. COLLAPSE hover offsets remain unchanged. Existing title/description budget retained; module caches refreshed. JavaScript syntax checked. ZIP unchanged.


EXPAND disables the thumbnail black gradient scrim for every project card, regardless of hover. COLLAPSE keeps its existing gradient/hover behavior. CSS cache version refreshed. ZIP unchanged. (2026-10-30)


Compact thumbnail overlay typography reduced one step: year 10→9px, title 16→15px, category 9→8px. Fonts, weights, colors and positioning retained. CSS cache refreshed; ZIP unchanged. (2026-10-30)


Compact overlay vertical spacing tightened: year bottom offset 51→42px and title 27→23px; category remains 10px from the bottom. At current type sizes this leaves approximately 2px between line boxes. Existing fonts and sizes retained. CSS cache refreshed; ZIP unchanged. (2026-10-30)


Thumbnail category increased from 8px to 10px. Title/year moved up 3px to preserve roughly 2px between line boxes. Year remains 9px and title 15px. CSS cache refreshed; ZIP unchanged. (2026-10-30)


## EXPAND return-scroll visibility fix (2026-10-30)

Root cause: returning above the collection re-added compact-enter-pending in EXPAND, while the entrance check intentionally skipped EXPAND, leaving cards hidden. Reset/observer scheduling and has-compact-cascade now require compact mode. Noncompact sync clears every card state and timer. CSS pending/running effects also explicitly exclude show-all-card-info. Mode changes resynchronize observers. Verified with a Node DOM/IntersectionObserver fixture: three EXPAND upward/downward cycles stay visible, COLLAPSE replay still runs, and expanding mid-cascade clears all pending/running states. Browser rendering not automated. ZIP unchanged.


Thumbnail dark gradient now begins at 65% height (bottom 35% only, previously bottom 45%). Bottom opacity remains 50%. Existing hover and EXPAND removal rules retained. CSS cache refreshed; ZIP unchanged. (2026-10-30)


CinematicShading images 01–04 replaced again with latest supplied revisions (2026-10-30). Regenerated 480/960/2000px maximum WebP variants using content-hashed filenames to avoid stale browser caches across repeated same-day updates. Gallery order, first-image poster, project video and other content retained. Module cache versions refreshed. ZIP unchanged.


## CinematicShading version-independent presentation (2026-11-02)

Removed UE 5.8 and Substrate wording from project summary, implementation description and integration bullet; category now reads UNREAL ENGINE · SHADING. Copy describes direct lighting, Profile SSS, ambient response and cinematic look controls without implying a particular engine version or shading framework. Technical capabilities remain unchanged; this wording does not assert support for every engine version. Cache keys refreshed. Existing ZIP unchanged.


## Mobile thumbnail overlays removed (2026-11-02)

Touch/no-hover layouts now hide the thumbnail category label and remove the black gradient pseudo-element. Category metadata beneath each thumbnail stays visible. Desktop COLLAPSE/EXPAND, featured badges and open-project arrows are retained. CSS cache version refreshed. Existing ZIP unchanged.


Cinematic Workflow Toolkit result wording changed from “기존 수작업 대비 100배 이상” to “기존 수작업 대비 수십 배” per owner request (2026-11-02). Catalog/module cache keys refreshed. Existing ZIP unchanged.


Added owner-supplied timing context to Cinematic Workflow Toolkit result: per-shot manual work approximately five minutes versus tool-assisted approximately ten seconds, excluding import/export duration. Presented in parentheses after the speed improvement statement. These approximate figures are supplied by the owner; no new benchmark was run. Cache versions refreshed; ZIP unchanged. (2026-11-02)


Production Breakdown technical section heading renamed from Rig & Tech to Rig & Material. Section items retained; cache keys refreshed. ZIP unchanged. (2026-11-02)


Featured project titles changed to KRAFTON Cinematic Workflow Toolkit and KRAFTON Production Breakdown, replacing the year prefix only. Year metadata remains 2021–2026. Catalog/cache versions refreshed. ZIP unchanged. (2026-11-02)


Dednet FX attribution removed (2026-11-02): role/contribution, summary, objective and result now describe environment development and rendering only; blood FX/modeling wording removed. Existing groups were already worlds/render. Updated initial hero role fallback as well. Other projects and media remain unchanged; ZIP unchanged.


KRAFTON Cinematic Workflow Toolkit introduction now frames ongoing 2021–2026 development around high-quality Unreal Engine cinematic production, replacing the production-demand wording. Remaining description unchanged; caches refreshed; ZIP unchanged. (2026-11-02)

## Transparent Sumi Chick companion (2026-11-03)

Adapted the owner's `Q:/Codex/threejs/sumi-chick.html` into the existing portfolio as a page-wide transparent WebGL layer. The source HTML remains unchanged. This addition does not change project data, layouts, typography, thumbnails or the tool cloud.

- `sumi-chick-scene.js` retains the chick geometry and 26 fur shells, procedural behaviour and leg IK, butterfly cursor tracking, idle motion, soft contact shadow, footprints, dissolving ink and blank-space click response.
- Removed paper, mountain, circular brushstroke, plum blossom scenery and autonomous edge smoke. Interaction ink is composited separately with transparency. Fur now writes source-over alpha instead of preserving the standalone page's opaque destination alpha.
- `sumi-chick.js` loads the scene on idle, observes pointer events passively, and suspends rendering when hidden, during project/image dialogs, or when switched off. The canvas is `pointer-events:none`; the page cursor, links, cards and scrolling retain their existing behaviour. Click ink is omitted on interactive controls so normal navigation does not start the effect.
- A small chick button at the upper right toggles the companion; on narrow screens the control sits at the lower right. Desktop fine-pointer devices start enabled. Touch devices and reduced-motion users start disabled and can explicitly enable it.
- `assets/vendor/three-r186/` contains the original Three.js 0.186.0 version and MIT license, served locally. The minified core file uses the `three.core.js` filename expected by the bundled module. No CDN or original Q: path is needed at runtime. Added runtime assets total approximately 0.83 MiB before HTTP compression; no external models or textures are needed.
- Drawing-buffer pixels are capped at 2.4 million on desktop / 1.1 million on coarse-pointer devices; feedback simulation is half-resolution with a maximum 960px long side. Mobile rendering is limited to 30fps. These are workload limits, not a guarantee of frame rate on every device.

Verification: JavaScript syntax; headless Chromium/WebGL2 shader compilation and transparent pixel readback; pointer-follow movement measured from visible chick pixels; 17 cards still present; canvas does not capture hit testing; toggle, project open/close suspension, resize and reduced-motion behavior; touch defaults to disabled without loading the scene and renders when explicitly enabled. No GUI automation or screenshots. GPU/device visual performance should still be judged on the actual viewing device. Existing ZIP unchanged.

### Document-attached scrolling / constant character size (2026-11-03)

The companion's canvas remains fixed only as a transparent rendering surface. The chick, its contact shadow and footprints now occupy document-relative ground coordinates. `sumi-chick-camera.js` uses a 30-degree orthographic camera calibrated to the previous view scale. Camera and target translate together along the ground in proportion to `window.scrollY`, so stationary world points move up exactly one CSS pixel per scrolled pixel without depth-dependent size changes. Resizing preserves world units per CSS pixel; initialization at a scrolled/deep-linked location starts the chick in that viewport.

The butterfly remains associated with the viewport cursor. Its target is raycast again after scrolling, including when the pointer has not moved, and the chick follows toward the new visible ground area with its existing gait. It is not teleported or clamped back into the viewport. Therefore a rapid long scroll can temporarily move the chick offscreen while it catches up. The ink feedback buffer is reprojected by the same scroll delta; pixels outside the previous buffer are cleared instead of edge-clamped. Click ink stores its document Y coordinate until rendered.

Checks: 15 camera projection scenarios across desktop/mobile dimensions, reversed scroll and deep-link offsets verify 1:1 scroll displacement, constant projected size and correct raycast targets. Headless WebGL checks confirm actual upward motion, cursor reacquisition after scrolling, transparency, resize, modal suspension, touch opt-in and reduced-motion behavior without shader/runtime errors. Existing layout, source HTML and ZIP remain unchanged.

### Randomized chase rhythm and offscreen recovery (2026-11-03)

`sumi-chick-chase.js` replaces the mandatory run/pause cycle with randomized pause opportunities and durations. A time-integrated probability keeps the rhythm independent of frame rate. As butterfly distance increases, pauses become less frequent and shorter, existing pauses can end early, and the chick's running speed increases.

The scene checks the chick's projected position against the viewport. While offscreen, it immediately cancels pauses, settling and hops, increases movement and turning speed, and follows the butterfly back without teleporting. Recovery continues slightly inside the viewport (84% of each half-extent) to avoid oscillating at the boundary. Acceleration eases out after re-entry, and arrival braking prevents overshoot. Gait frequency and body tilt are capped separately from travel speed so fast recovery does not produce excessive leg motion or leaning.

Verification: seeded rhythm simulations confirm irregular intervals, fewer pauses at greater distances, matching pause counts at 30/60fps, and no pauses during recovery. Headless WebGL integration verifies an actual 1400px scroll recovery with no intermediate pauses and subsequent deceleration, plus pointer following, transparency, modal/toggle suspension, resize, touch opt-in and reduced-motion defaults. JavaScript syntax checked. Module cache versions refreshed; original standalone HTML and existing ZIP unchanged.

### Calmer pursuit with visible hesitations (2026-11-03)

Retuned after owner feedback that pursuit was too fast and pauses were barely noticeable. Normal speed limits now range from 1.65 to 3.15 world units/second (approximately 31–58% of the preceding in-view maximum). Offscreen recovery is capped at that previous in-view maximum, 5.4, instead of the earlier distance-driven cap of 40. Normal acceleration is gentler; recovery still cancels pauses and smoothly returns to ordinary speed after re-entry.

In-view pauses now last approximately 0.27–0.9 seconds, sampled irregularly, with a nonzero pause frequency even at maximum distance. Distance reduces their frequency and duration without cancelling them. Stronger braking during a pause makes the brief stop visible instead of coasting through it. Seeded cadence checks cover near/middle/far pursuit and 30/60fps; WebGL checks cover normal cursor-follow pauses and capped, pause-free recovery after scrolling. Cache versions refreshed; standalone source and ZIP unchanged.

### Reference-inspired butterfly wing colors (2026-11-03)

Repainted the two existing procedural 512px CanvasTextures using the owner's reference: cyan/turquoise fields, cobalt-blue wing roots, dark margins and veins, and wine-red forewing tips. Removed the previous ochre wash, pale spots and hindwing eyespot. The existing tail is painted dark. Textures retain sRGB tagging and are drawn once without external image downloads.

Only `wingTexture()` painting changed. Wing silhouette paths, plane geometry, UVs, body, antennae, scale, wing-flap animation and cursor/chick movement remain identical. Headless WebGL verification confirms the color regions, transparency and no shader/runtime errors; exported texture previews were visually inspected. Source comparison verifies unchanged geometry, silhouettes and movement code. Cache versions refreshed; standalone source and ZIP unchanged.

Blue/cyan wing gradient stops received a further 14% relative HSL saturation increase (2026-11-03), preserving hue and lightness within 8-bit rounding. Red tips, dark veins/margins and all geometry/motion retain their preceding values. Cache versions refreshed.

### Idle cursor butterfly flight (2026-11-03)

After seven seconds without pointer activity, the butterfly follows smooth, randomized waypoints inside a 100 CSS-pixel radius around the cursor. Waypoint radii are 48–96px, leaving a little margin for the wing center. Each leg takes 1.7–3.1 seconds; interpolation stays inside the disk and target coordinates are constrained to the viewport. The idle offset is applied in screen coordinates before raycasting, preserving the radius through scroll and different viewport scales. Pointer movement clears wandering immediately and resumes ordinary cursor tracking with the existing eased follow.

Wandering uses active wing beats. The chick's start/stop following distances are reduced only during idle flight so it continues chasing these smaller movements. Normal chase speed and hesitation settings remain intact. Headless WebGL verification confirms the seven-second threshold, bounded/random movement, chick pursuit, radius after scrolling, pointer-move recovery and no runtime errors. JavaScript syntax checked; cache keys refreshed. Standalone source and ZIP unchanged.

Idle flight radius increased from 100px to 300px (2026-11-03). Random waypoint radii scale from 48–96px to 144–288px, retaining the existing seven-second delay, flight timing and viewport bounds. Cache keys refreshed.

Idle flight retuned to match the outside-cursor motion (2026-11-03): replaced waypoint arrivals/departures with continuous superimposed sine curves using the outside flight's .31/.83/.23 frequencies and the same 2.2 damping response. A 2.4-second smooth entry blends into the flight without an initial jump. Component amplitudes mathematically bound the path below the 300px radius. Seven-second activation, viewport constraints, immediate pointer-move exit and chick pursuit remain active. Syntax and headless WebGL idle-flight checks cover timing, radius, pursuit, scrolling and cursor reacquisition. Cache keys refreshed.

### Butterfly steering and pursuit spacing correction (2026-11-03)

Diagnosed the reported tail-first turns: below 0.4 world units/second, butterfly yaw previously ignored travel direction and drifted independently. Yaw now follows actual X/Z velocity down to a small numerical tolerance, takes the shortest angular path with frame-rate-independent damping, and holds its direction when stationary. The model's antennae face local +Z. A restrained bank follows turn rate without changing the model or wing textures.

Idle flight now uses coupled ellipse phases with a subtle secondary drift, increasing pace and avoiding near-stationary reversals caused by independent X/Y oscillations. Entry takes 1.8 seconds. The path remains within the cursor's 300px disk, with viewport constraints and the seven-second idle trigger retained. Idle chick pursuit now starts at 1.35 world units and stops at 0.85 instead of 0.28/0.16. Forward travel reduces during turns and stops when facing away from the goal. Existing normal/recovery speed caps and randomized hesitations remain active.

Verification: 60-second deterministic simulations through the actual scene functions in headless Chromium reproduce 184 backward-facing frames and a median 22px pursuit gap before the fix. The revised center case has no backward-facing frames, a median flight speed of 127px/s, and a median pursuit gap of 158px; an edge-cursor case also has no backward-facing frames. These figures describe the 1280×800 test viewport, not fixed speed/gap guarantees. Headless idle-flight integration checks activation, radius, scrolling, chick movement and cursor reacquisition. Cache keys refreshed; original standalone HTML and existing ZIP unchanged.

### Random continuous butterfly steering (2026-11-03)

Replaced the one-direction ellipse with `sumi-butterfly-flight.js`. Idle flight now continuously advances while choosing a new random turn rate and cruising speed every 1.1–2.6 seconds. Angular velocity and speed ease toward their targets; there are no waypoint stops. Gradual inward steering near the radius and viewport edges keeps the flight local, with a 294px safety envelope inside the requested 300px radius. A small steering response away from the chick helps preserve pursuit spacing when a random turn brings them close.

The seven-second trigger, immediate return to cursor tracking, velocity-aligned heading and existing chick behavior remain active. A 60-second scene-function simulation verifies both clockwise and counterclockwise travel, no backward-facing motion, bounded radius, sustained flight speed and pursuit separation. Live headless idle-flight checks also cover activation, scrolling and cursor reacquisition. No model or texture edits; cache keys refreshed.

### Subtle portfolio-colored interaction traces (2026-11-03)

Replaced black/gray smoke composition with very faint peach (#DDA988 family) and muted olive traces. All existing emission sources use the new composition: dissolving footprints, chick landings, butterfly travel and blank-space clicks. Curl and upward drift are reduced substantially; density falls to 10–16% after one second of normal simulation instead of lingering as a plume. Emission amounts and radii are reduced, including the click radius from .05 to .014 normalized units. Footprints now use muted olive-gray at up to .22 alpha instead of .6 black ink, fading into the faint trace.

Normal source-over composition keeps the effect restrained on both light and dark site sections. GPU pixel checks measure about 2.7% alpha for a fresh click and a maximum of 7.5% even at saturated feedback density; an empty buffer remains fully transparent. Headless WebGL checks confirm warm/light colors and no shader/runtime errors. Character models, flight/chase behavior and site interaction remain unchanged. Cache keys refreshed; existing ZIP unchanged.

Footprint visibility increased (2026-11-03): raised the footprint opacity multiplier from .22 to .42 so the tracks read more clearly. Olive-gray color, dissolve timing and the faint movement/click/dissolve traces retain their preceding settings. Cache keys refreshed.

Footprint opacity multiplier increased again from .42 to .70 at the owner's request (2026-11-03). Dissolve behavior and other effect strengths are retained. Cache keys refreshed.

Chick wing colors matched to its body (2026-11-03): wing fur now uses the same base RGB (.98, .78, .34) and tip RGB (1, .95, .72) as body fur. Existing wing fur length, density, geometry and animation remain unchanged; butterfly colors are unaffected. Cache keys refreshed.

Footprint color changed to the portfolio olive #718B2C (2026-11-03), retaining the .70 opacity multiplier and existing dissolve timing. Color stays olive while fading; faint interaction traces keep their preceding settings. Cache keys refreshed.

### Occasional section-aware text footprints (2026-11-03)

Added `sumi-text-tracks.js`. Most footfalls retain the existing olive footprint. A randomized threshold of 15–25 visible footfalls, with a minimum 6.5-second interval, permits one footfall to become a short text stamp instead. Only one text stamp is visible at a time: a 0.1-second reveal, three-second hold (including reveal), and 1.2-second fade. Offscreen and edge-clipped candidates remain ordinary footprints; the next suitable footfall can carry the text.

- Hero: `2021–2026 SHOWREEL`
- Project collection: `ART · TECH · PIPELINE`
- Career / expertise: `EXPERIENCE & EXPERTISE`
- Closing: alternates `CRAFT THE VISUAL.` and `BUILD THE SYSTEMS.`

Section selection uses the planted foot's projected position against current section bounds, including after filter/EXPAND/responsive layout changes. Hero and career stamps use cream `#FFF4E2` with a narrow dark edge; light sections use dark olive `#3F4D24` with a light edge. A project-thumbnail hit also selects cream so text remains legible over images/video. These text colors do not change ordinary olive footprints or the existing faint effects.

CanvasTextures use the local Pretendard font at 600 weight, 16 CSS pixels on desktop / 14 on narrow screens. A screen-facing sprite stays at its world/document position with a small heading-dependent tilt limited to ±10 degrees; it cannot turn upside down or flatten into the ground perspective. Its CSS-pixel size stays constant on scroll/resize. The texture cache is bounded by the fixed phrase/theme/size combinations, resources are disposed with the companion, and no DOM overlay or pointer target is added. Existing companion suspension, opt-in and reduced-motion settings apply.

Verification: JavaScript syntax and headless Chromium/WebGL rendering. Checked all four section phrases/themes, thumbnail contrast variant, footfall replacement/cooldown, full fade, ±10-degree rotation, clipped-edge rejection, 100px scroll moving the stamp exactly 100px with constant size, resizing, narrow-screen sizing, cleanup and the unchanged 17-card collection. Inspected generated text textures and confirmed no shader/runtime errors. No GUI automation or site screenshots; no packaging changes.

### Character-by-character footprint correction (2026-11-03)

Replaced the whole-phrase caption behavior above with individual character footprints, following the owner's clarified reference. After an occasional normal-footprint interval (15–25 visible footfalls and at least 6.5 seconds), a phrase is written progressively: one character replaces the footprint at each randomly chosen one- or two-step interval. Spaces and intervening steps retain normal footprints. Finishing a phrase returns to the normal-footprint interval; crossing into a different section while writing starts that section's phrase on the next eligible step.

Every character stays at its own planted foot position, with no word layout, collision avoidance or automatic separation. Retracing the same ground intentionally overlaps the letters. Each character independently holds for three seconds and fades over 1.2 seconds, using the existing cream/dark-olive contrast variants, 16px desktop / 14px narrow-screen Pretendard, and viewport-facing tilt limited to ±10 degrees. No whole sentence is rendered in a single stamp. A fixed 64-sprite pool bounds live objects; textures are shared by character/theme/size and disposed with the companion.

Verification: deterministic headless Chromium/WebGL checks through the actual footfall function cover both one-step and two-step cadence, sequential characters, exact-position overlaps, spaces preserving normal prints, section changes, independent expiry, return to ordinary footprints, alternating closing phrases, scrolling, mobile size, GPU rendering and resource cleanup. No shader/runtime errors; 17 project cards remain present. Cache keys refreshed; ZIP unchanged.

### Ground-aligned letter tracks / full direction rotation (2026-11-03)

Corrected the camera-facing letter sprites after owner feedback. Letters now use shared horizontal XZ plane geometry at the same Y=.002 ground height as footprints, with depth testing enabled and depth writes disabled. The former depth-disabled transparent sprites could overpaint the chick's opaque fur regardless of their render order; ground letters are now occluded by the chick and other foreground geometry.

Each footfall computes one footprint heading, including its existing toe-in and small yaw variation. The letter's reading axis (+X in its texture) aligns with that heading (+Z in the footprint texture). This replaces the ±10-degree screen tilt limit: rightward travel reads upright, reversing travel rotates the glyph 180 degrees, and each letter follows local turns along the trail. Letters remain fixed after planting and scroll with the page.

The alternating lateral foot offset is removed for text only, placing glyphs midway between the two foot lanes at the planted step's forward/backward coordinate. Visible capital height is .225 world units: .14 between the two feet plus the .085 footprint extent, spanning the full two-foot trail. Texture resolution is independent of displayed size, and the glyph plane scales by measured capital height rather than CSS font size. Ordinary footprints retain their positions, dimensions and olive color.

Letter rendering now reuses the actual footprint noise/erosion shader and its 2.4-second hold / 2-second fade, retaining the contrasting cream and dark-olive glyph textures. One/two-step sequencing, occasional runs, overlapping characters and the bounded 64-stamp pool remain active. The shared plane, per-slot materials and cached glyph textures are disposed with the companion.

Verification: syntax and headless WebGL checks cover ground-plane vertices, reading-axis alignment, right/left 180-degree reversal and up/down orientation, two-foot sizing, one/two-step cadence, overlap, independent footprint-timed expiry, 100px document scrolling, mobile sizing, cleanup and no shader/runtime errors. A GPU occlusion check confirms that opaque foreground geometry completely hides a letter beneath it. Cache keys refreshed; ZIP unchanged.

Letter footprint size reduced by 20% in both dimensions (2026-11-03): capital height now .18 world units, using .8 of the preceding two-foot-trail size. Removed the canvas text stroke and shadow/halo, leaving solid cream/dark-olive glyphs. Ground orientation, depth testing, step cadence and erosion behavior retained. Cache keys refreshed; ZIP unchanged.

### Smaller letters and shared footprint colors (2026-11-03)

Reduced letter footprints by another 20% from the preceding size: capital height is now .144 world units (.64 of the original two-foot-trail size). Letters remain fill-only, without outlines.

Ordinary footprints now share the text's surface-color resolver at their planted screen position: cream `#FFF4E2` on the hero, career section and project media; dark olive `#3F4D24` on light sections. Each footprint stores its own ink color in an instanced attribute, so crossing a section boundary does not recolor older tracks. The ordinary footprint opacity multiplier stays at .70, with the existing appearance and erosion fade unchanged. Both glyphs and ordinary prints use matching color-space handling.

Verification: headless Chromium/WebGL checks passed for the further size reduction, ground orientation, depth occlusion, step cadence, scrolling and cleanup. Tested the actual stamped colors in all four page sections and on a project thumbnail; GPU readback confirmed both palette colors and 70% opacity (within 8-bit rounding). No shader/runtime errors. Cache keys refreshed; ZIP unchanged.

### Readable letter spacing and opacity fade (2026-11-03)

Replaced the one-/two-footfall letter interval with distance sampling along the planted, centered foot trail. Letter advances use the actual Pretendard glyph widths, plus modest tracking (24% of capital height, varied by ±6%). Word spaces add an empty 55%-of-height gap. Long steps interpolate intermediate letter positions; short steps wait until enough distance is available. Adjacent rotated glyph bounds reserve at least 14% of capital height as clearance on bends. In-place foot taps no longer pile multiple letters at the same point. Heading follows the chick's travel direction without alternating toe-in jitter; ground orientation, reversal, depth occlusion and .144-unit capital height remain.

Once a sentence starts, every footfall is consumed by that sentence, including waiting steps and word spaces. Normal footprints resume after completion and a small clearance beyond the final letter. Crossing a page section preserves the current sentence until complete, while each new glyph still resolves its local cream/dark-olive ink. New sentences retain the occasional 15–25-footfall / 6.5-second trigger. Offscreen jumps are not filled with a burst; an unfinished run with no new glyphs for eight seconds is released so abandoned text cannot remain indefinitely.

Text now uses a dedicated texture-and-opacity shader, with no erosion, UV distortion or emitted trace. Earlier letters remain intact while the sentence is being written. After completion, the whole sentence holds for 2.4 seconds and fades smoothly over two seconds. Ordinary footprint size, color selection, 70% opacity and dissolution effects remain unchanged.

Verification: headless Chromium tests cover seven paths (slow, fast, variable stride, reverse, broad curve, S curve and tight turn), measured adjacent clearance, speed-independent straight-line spacing, stationary taps, word gaps and sentence completion without mixed ordinary footprints. Actual scene footfall integration confirms ordinary tracks resume afterward; all four page phrases and light/dark palettes pass. GPU pixel comparison confirms the fading glyphs retain their mask and lose opacity uniformly, without fragments disappearing. Reviewed rendered letter-trail fixtures in `Q:\Codex\portfolio-exports\sumi-readable-trail-review.png`; no shader/runtime errors. Checks live outside the shipped site in `check-sumi-readable-trail.mjs`. Cache keys refreshed; ZIP unchanged.

Text footprint opacity matched to ordinary footprints (2026-11-03): reduced the text multiplier from .98 to .70 across every page section. Shared cream/dark-olive ink, letter spacing, sentence hold and smooth opacity fade remain unchanged. Cache keys refreshed.

Trail opacity revised again at the owner's request (2026-11-03): text restored to .98; ordinary footprints increased to .90. Both values apply across all sections with the existing adaptive colors. Letter spacing, sentence timing and each effect's fade behavior remain unchanged. Cache keys refreshed.

### Chick surface darkening removed (2026-11-03)

The chick did not use cast/receive shadow maps; the apparent self-shadow came from its custom fur shader's directional diffuse multiplier and root-darkening factor. Removed both darkening terms for body, head, wings and feathered legs. Root-to-tip pigment, strand coverage, soft positive sheen/rim highlights, geometry and motion remain. Beak and bare legs/toes now use unlit MeshBasicMaterial with their existing colors; the unused hemisphere/directional scene lights were removed. The light-direction uniform remains solely for the fur's positive sheen.

The separate ground-contact shadow retains its texture, .40 opacity, shape, placement and animation. Headless GPU comparison confirmed root color no longer varies with surface orientation (red-channel range 77 before, 0 after), identical contact-shadow alpha output, and no shader/runtime errors. Reviewed three rendered angles before/after in `Q:\Codex\portfolio-exports\sumi-self-shading-review.png`. Cache keys refreshed; original standalone scene and ZIP unchanged.

Footstep text shortened for readability (2026-11-03): hero `SHOWREEL`, projects `PROJECTS`, career/tools `EXPERTISE`, closing `CONNECT`. Each section now uses one short word, including a single closing word instead of alternating sentences. Text opacity remains .98 and footprints .90; distance-based spacing and opacity fade continue. Cache keys refreshed.

### Click hop followed by uninterrupted catch-up (2026-11-03)

A companion-eligible page click now requests one hop and latches a fast pursuit. After landing, the chick follows the butterfly's current position with the faster recovery speed/turn response and no random curiosity pauses. The existing 5.4 speed ceiling and arrival deceleration apply. Pursuit ends after landing within .25 units beyond the ordinary stopping distance (.80 normally, 1.10 during idle wandering); ordinary slower following and hesitation rhythm then resume. Clicking while already airborne keeps the current hop. Sleeping chicks wake and perform the requested hop; links, buttons and other excluded controls retain the existing input filtering.

Verification: deterministic headless scene checks cover a click during a hesitation, while sleeping, facing away and already near the butterfly. Every case retains the .48-second hop, has no pursuit pauses and releases near the target; normal pursuit afterward regains its slower limit and random pauses. The seeded rhythm/recovery checks also pass. No runtime errors. Cache keys refreshed.

### Hero background click reaction (2026-11-03)

The generic video input exclusion prevented chick click reactions across the right-hand hero background. Allow the control-free `.hero .hero-video` as a decorative page surface. Links, buttons, other interactive ancestors, videos with native controls and all other videos remain excluded. The passive listener does not intercept page actions. Bootstrap and scene cache keys refreshed.

Verification: headless Chromium DOM hit testing at three right-hand hero positions targets the actual background video; bubbling pointer events trigger the hop/pursuit state at all three. The hero pause button, a controlled video, a controlled hero video and a linked video remain excluded. Existing hop, uninterrupted catch-up and return-to-normal behavior checks pass with no runtime errors.

### Butterfly pollen click feedback (2026-11-03)

Replaced the click's broad feedback-buffer splat with a small pollen burst emitted from the butterfly's actual world position. Twenty-eight soft round grains in gold, peach, pale olive and cream spread in two wingbeat pulses 75 ms apart, decelerate into a slight flutter/drift and fade over .72–1.10 seconds. Grains are 2.2–4.4 CSS pixels before fading, with roughly 18–41 px radial spread. The butterfly briefly accelerates its wingbeat for .28 seconds while the existing chick hop and uninterrupted catch-up begin. Background-video eligibility and control exclusions remain unchanged.

`sumi-butterfly-pollen.js` uses one Points draw call and a fixed 120-grain pool, with no external assets or per-click GPU resources. Repeated clicks recycle the pool; suspension clears it and disposal releases it. Explicit reduced-motion opt-in uses ten grains, half the spread, a .55-second fade and no wingbeat boost. Normal movement/landing traces and footprints remain unchanged. Bootstrap/scene cache keys refreshed.

Verification: headless WebGL checks confirm actual butterfly-origin emission, 28 live grains, bounded capacity under 30 rapid bursts, expiry, suspension cleanup and same-frame chick hop/pursuit. Reviewed native-size shader renders against dark/light backgrounds in `Q:\Codex\portfolio-exports\sumi-pollen-review.png`. Hero hit-target/control exclusions and prior catch-up/normal-pause regression checks pass without runtime or shader errors.

Text footprint frequency increased (2026-11-03): apply a 1.5 frequency multiplier to both run-start gates. The random ordinary-footfall wait changes from 15–25 to approximately 10–17 steps, and the minimum wait from 6.5 to approximately 4.33 seconds. Completed-word timing, glyph spacing/size, colors, opacity and fade remain unchanged; actual frequency still depends on walking and word completion. Module/bootstrap cache keys refreshed.

Text footprint frequency revised to 2× the original baseline (2026-11-03), replacing the 1.5× setting: minimum wait is now 3.25 seconds and the rounded random footfall wait is 8–13 steps. Letter spacing, word completion and visual styling remain unchanged. Module/bootstrap cache keys refreshed.

### Playful chick trail lettering (2026-11-03)

Text footprints now use Chewy Regular (400), with soft, irregular rounded letterforms suited to the chick. Only the WebGL trail uses this font; portfolio typography remains unchanged. The unmodified 41,248-byte font is bundled at `assets/fonts/Chewy-Regular.ttf`, with its Apache 2.0 license in `assets/fonts/Chewy-LICENSE.txt`. Source: https://github.com/google/fonts/tree/main/apache/chewy .

The companion lazily loads a dedicated `Sumi Trail Chewy` FontFace and waits before measuring or caching glyph textures; no remote font request or system installation is needed. Font failure falls back to local cursive. Existing capital height (.144 world units), fill-only rendering, directional rotation, adaptive colors, opacity, distance-based clearance and 2× appearance frequency remain. Module/bootstrap cache keys refreshed.

Verification: headless Chromium confirms the bundled font loads with distinct font metrics and completes SHOWREEL on forward, reverse and curved paths without ordinary footprints mixed into the word. Measured minimum adjacent clearance stays above .02016 units and capital height stays .144. Reviewed four word specimens and actual projected letter meshes in `Q:\Codex\portfolio-exports\sumi-chewy-review.png`; no runtime errors.

### Creator-perspective trail phrases (2026-11-04)

Replaced section keywords with the approved playful production copy: hero “Welcome behind the scenes.”; projects “Looks good. Works better.”; career/tools “Less clicking. More creating.”; closing “What shall we make next?”. Preserve sentence case, punctuation and word gaps. Chewy lettering, size, section colors and 2× trigger frequency remain. A phrase continues to consume footfalls until complete, then holds and fades as before. Module/bootstrap cache keys refreshed.

Verification: browser fixtures using the actual text-track module completed all four phrases with word gaps, no ordinary footprints inside a phrase and full expiry after the hold/fade period. Syntax check passed. The previously exported 2026-11-03 ZIP is unchanged.

### Quiet flower collection play (2026-11-04)

Added `sumi-flower-game.js` to the existing companion scene. Up to three small cream/peach five-petal flowers appear in available page whitespace. Olive stems and a restrained gold seed match the portfolio palette. Art is generated locally with CanvasTexture; no download, image asset, external service, score HUD, popup or layout element is required.

Move the butterfly over a flower for .28 seconds: the flower opens briefly, emits a smaller version of the existing pollen burst, and leaves a tiny glowing seed. Nearby seeds attract a short, slower chick detour (1.8-world-unit acquisition radius, 1.4 speed cap). The chick collects the seed with a brief peck and seed-to-beak fade, then resumes following. Three seeds grant a small peach flower on its head for 6.5 seconds and two in-place hops. Explicit clicks override collection/celebration movement and preserve the existing hop/catch-up behavior. No remote seed pursuit is introduced.

Flowers use 43 CSS-pixel sprite bounds; seeds use 24. They are anchored to the page ground, move with scrolling and retain their apparent size. Placement avoids headings, body copy, cards, controls, hero copy, notes and the tools diagram with 22px clearance. Only reachable middle-screen whitespace is eligible, with 140px between flowers. There may be fewer flowers or none when space is limited. New content covering an item causes a .25-second retirement; resizing also retires old placements. Seeds expire after 24 seconds. A new round waits until the previous items are gone and at least 18 seconds after the last collection. Scrolling does not activate flowers.

Uses six reusable world sprites, one head decoration and four shared procedural textures. Pollen reuses the bounded existing particle pool. Suspension hides the game and pauses its timers; disposal releases its resources. Existing companion toggle, dialog/hidden-page suspension, mobile default-off and reduced-motion default-off remain. With explicit reduced-motion opt-in, reward hops, flower wobble, seed bounce/rotation and crown pop are suppressed. No portfolio pointer target is intercepted.

Verification: `Q:\Codex\portfolio-exports\check-sumi-flower-game.mjs` exercises actual scene following through three bloom/seed/collection cycles, reward reset/expiry, exactly two queued reward hops, cooldown, fixed sprite capacity, timer suspension, covered-item retirement and native-dialog suspension. A 120px page scroll produces exactly -120px flower movement with unchanged size. Placement checks pass at 1440×900 and 900×800; at 390×844 the tested hero has no safe flower placement. Native-size procedural art and offscreen rendered chick/flower decoration were visually reviewed on dark/light backgrounds. Existing click-pursuit and pollen checks pass without runtime/shader errors. These are headless desktop Chromium checks; physical mobile-device performance has not been measured. QA artifacts remain outside the shipped site in `portfolio-exports`. No new transfer ZIP was created.

### Illustrated flowers, content anchors and growth stages (2026-11-04)

Supersedes the original cream/peach rosettes and whitespace-only placement above. `sumi-flower-art.js` generates four distinct illustrated silhouettes (open poppy cup, tulip, oblique daisy and hanging bell) in six saturated palettes: yellow, coral, pink, blue, violet and turquoise. Rear/front petals and elliptical openings imply a slightly elevated oblique view rather than a face-on radial flower. Flat fills replace gradients. The same family is used for the head blossom. There are 24 flower/color combinations, with three world flowers present at most; new rounds vary the silhouettes and colors.

Placement now prefers typography's upper edges and the four inset corners of project thumbnails, with small randomized offsets. It may overlap text/images as requested. World positions follow the selected DOM anchor when cards change layout; blooming/seed positions then remain grounded. Most of the visible page is eligible (30px side clearance, 15–90% vertical range); header, dialogs, form fields and companion control remain excluded. Random placement is a fallback when the preferred anchors cannot accommodate three separated items. The transparent companion canvas still does not intercept any portfolio input. This permits flowers on the narrow-screen layout when the companion is explicitly enabled; mobile remains default-off.

Corrected layering: world flowers and seeds use the opaque render queue with custom source-over alpha blending, depth writes disabled and order -20, after the trace background but before the opaque fur. This is deliberate: a negative renderOrder on a transparent sprite alone does not place it behind opaque chick geometry. Head decoration remains in the transparent queue with order 4 and depth testing disabled, so only that decoration draws over the chick.

Seed one produces a green sprout; seed two changes it to a colored bud; seed three opens a flower and triggers the existing two-hop celebration. Sprout and bud remain until the next collection, including across suspension. Each stage grows/fades in over .22–.4 seconds; the finished flower holds then fades at 5.5–6.5 seconds before the next cycle. Reduced-motion opt-in suppresses the scale pop and celebration hops. Seed palette/flower variant determine the later head decoration; no score UI was added.

Verification: updated headless scene checks observe stages [1,2,3] during actual collection, persistence/suspension, final expiry, two queued hops, and recovery to ordinary following. Render callbacks verify all six ground sprites draw before the chick's fur and the crown draws after it. Project-section checks place all three flowers on actual thumbnail anchors. Scroll anchoring retains a -120px displacement for a 120px scroll with unchanged size; resize checks pass at 900×800 and 390×844. Native-size artboard reviews cover all 24 variants and three growth stages; an offscreen rendered chick verifies crown scale. Existing click-pursuit and pollen regression checks pass without runtime/shader errors. Bootstrap/module cache keys refreshed. No transfer package was regenerated.

### Flowers as document elements (2026-11-04)

Flowers now render as three non-interactive, aria-hidden 43px canvas elements in an absolute document layer at z-index 14, below the companion WebGL canvas at 15. They use the same illustrated artwork, attached to the chosen heading/thumbnail's layout coordinates. The WebGL flower sprites are not drawn; their existing values only drive the shared bloom animation. Camera projection is used solely for butterfly contact and the seed handoff. Seeds, chick and head-growth stages remain in WebGL.

Removed random viewport fallback placement and flower retirement merely for scrolling offscreen, resizing or exceeding a lifetime. A flower remains at its chosen element until consumed (or its anchor is removed/hidden). Returning to the section restores the same placement; responsive reflow/card movement follows the same anchor. This keeps the existing three-flower round rather than generating a new set on every viewport. Suspension hides the DOM layer alongside the companion; disposal removes it. Canvas nodes do not change document flow or capture input.

Verification: the headless integration check scrolls 1800px away for three simulated seconds and back, asserting the same flower, anchor and document coordinates, constant 43px dimensions and no duplicate WebGL flower. Existing three-stage collection, bloom-to-seed handoff, suspension, page anchoring and resize checks pass without runtime/shader errors. Cache keys refreshed; no ZIP generated.

### Populate the whole document (2026-11-04)

Removed the three-flower round gate, initial delay and 18-second global cooldown. Eligible headings and thumbnail corners across the entire document are planted immediately after the companion initializes, including below-fold sections. One flower per anchor element, 90px minimum separation and a bounded 48-slot pool keep the layout distributed. Current desktop fixture produces about 30 flowers spanning hero, work, capabilities and closing sections. The scanner checks for newly rendered anchors every .5 seconds; consumed/expired items have an individual 8-second regrowth delay. Other flowers do not wait for a collection round to finish.

Offscreen DOM flowers do not require a camera-ground intersection to be planted. Their collision position resolves when visible; screen interaction uses the actual element anchor, preventing offscreen flowers from accidentally activating at a stale world coordinate. Document anchoring, three seed growth stages, non-intercepting input, suspension and existing visual styling remain.

Verification: `portfolio-exports/check-sumi-full-garden.mjs` confirms initial planting in all four page areas, about 30 active flowers, collection stages [1,2,3], exactly two reward hops, bounded pool, suspension, scroll-away/return persistence and constant CSS size at desktop/narrow widths. No runtime/shader errors. Cache keys refreshed; no ZIP generated.

### DOM seeds and per-seed happy response (2026-11-04)

Seeds now render as 24px, non-interactive canvas elements in the same absolute document layer as flowers, below the chick. Both flower/seed render records are plain animation data; the garden group contains no WebGL meshes or sprites. Only the head decoration remains a Three.js sprite. Seed positions follow their source heading/thumbnail through document scrolling and layout changes. Camera-ground conversion remains for chick proximity/steering, and the projected beak position supplies the end of the .32-second DOM pickup animation. The seed shrinks and fades as it approaches the beak. Scroll/resize no longer retires a seed immediately; its normal 24-second lifetime remains.

Every seed now queues an in-place happy hop after the pickup finishes, with the existing hop-driven wing flutter and a small body puff. The third seed replaces that single-hop queue with the two-hop blossom celebration. Explicit clicks retain priority and reduced-motion opt-in disables the added hops/puff. The sprout/bud/flower progression is unchanged.

Verification: `portfolio-exports/check-sumi-dom-seeds.mjs` completes three actual collections and observes DOM seeds plus hop counts [1,1,2], stages [1,2,3], no garden WebGL objects, and unchanged document seed coordinates through a 220px scroll (approximately -220px viewport displacement, allowing slight rotation). Existing planting, suspension, flower persistence, resize and click-pursuit regression checks pass without runtime/shader errors. Cache keys refreshed; no ZIP generated.

### Thumbnail horizontal-edge planting (2026-11-04)

Replaced the four inset thumbnail corners with top/bottom edge anchors. Stem roots sit 1px above the top edge or 2px inside the bottom edge, so upward-growing flowers extend outside the top and inside the bottom. Horizontal placement is random across 8–92% of thumbnail width, retained once planted. Existing one-flower-per-thumbnail density, heading placement and collection behavior are unchanged. Headless DOM checks verify all 17 thumbnail flowers use the requested edges and x range, with actual document positions matching their anchor within .1px; the collection/scroll/resize suite passes. Cache keys refreshed.

### Featured thumbnail flower emphasis (2026-11-04)

The `cinematic-workflow-toolkit` and `production-breakdown` thumbnail IDs now receive a stable per-element random quota of 4–6 flowers. Slots split evenly across the upper/lower edges (an odd extra goes above); horizontal positions vary within separated bands. Each slot retains its anchor until consumed and regrows independently after the existing delay. Other thumbnails still receive one flower. Same-featured-card clearance is 36px; the document pool remains capped at 48.

Verification: headless checks observe 5 and 6 flowers on the two featured thumbnails, both top and bottom edges, and exactly one on every other thumbnail. Collection stages, DOM seed pickup, hop counts [1,1,2], suspension, scroll persistence and responsive sizing pass without runtime/shader errors. Cache keys refreshed.

### Hidden flowers in expanded card descriptions (2026-11-04)

Each card footer receives a stable random quota of 0–2 hidden flowers, positioned in the lower information area's whitespace around the footer/divider. They appear only when the information panel is visible and sufficiently unfolded; they hide immediately with a collapsed/clipped panel. Closing a card freezes its hidden flower/seed state and disables collection targeting; reopening restores it instead of rerolling the count. EXPAND and layouts with already visible descriptions also reveal them. Existing thumbnail flower quotas remain unchanged. The reusable pool is now capped at 80 to cover both all-page flowers and up to 34 hidden card flowers.

Verification: headless checks open all descriptions, assert per-card counts remain 0–2, then collapse/reopen and verify flowers/seeds hide and restore correctly. Featured counts, three growth stages, per-seed happy hops, DOM seeds, scroll anchoring and responsive checks continue to pass. Cache keys refreshed; no ZIP generated.

### Immediate card-flower appearance (2026-11-04)

Hidden description flowers now render at their normal .92 opacity as soon as the panel exposes them, bypassing the .65-second appearance fade. Visible-footer changes trigger layout scanning and planting in the same frame instead of waiting for the .5-second garden refill timer. Panel clipping, collapse hiding, stable quotas, collection and regrowth remain intact. Other document flowers retain their appearance fade.

Verification: `check-sumi-dom-seeds.mjs` confirms full opacity on the first exposed-panel update, collapse/reopen behavior, growth stages, seed collection, document anchoring and responsive sizing. No runtime errors. Cache key: `instant-card-flowers-20261104`.

### Smaller flowers and slower regrowth (2026-11-04)

Document flowers, including thumbnail and hidden-description flowers, now use 34.4px canvases instead of 43px (20% smaller). Bloom scaling and the flower-head interaction center follow the new size. Seed size and head growth decorations are unchanged. The per-slot regrowth delay after collection/retirement increases from 8 to 16 seconds. Initial hidden-card flowers still appear immediately. Cache key: `smaller-slower-flowers-20261104`.

Validation: DOM seed/garden regression checks cover reduced dimensions, collection, growth stages, scrolling, responsive sizing and immediate card-flower display.

### Reduced ordinary project flowers (2026-11-04)

Non-featured project cards now share a stable 0–2 flower quota across thumbnail and description: 15% receive none, 30% receive one, 55% receive two. This averages 1.4 flowers instead of the previous expected 2 (30% fewer). Nonempty cards place one on the thumbnail; two-flower cards reserve the second for the expanded description. The two KRAFTON featured projects retain their 4–6 thumbnail flowers and existing hidden-description quota. Other page sections, 16-second regrowth and 34.4px flower size remain unchanged.

Validation: headless checks confirm ordinary-card totals stay within 0–2, featured thumbnails remain at 5 and 6 in the fixture, and collection, scrolling, responsive layout and immediate hidden-flower visibility pass. Cache key: `sparser-project-flowers-20261104`.

### Twenty-stage garden growth and round-body cycles (2026-11-04)

Replaces the previous three-seed reset/fading reward with a persistent, twenty-seed growth cycle. One seed advances one stage. The stages are: one small leaf; two small leaves; large/small leaves; the original two-leaf sprout; three leaves; four leaves; small bud; the original full bud; opening bloom; full flower; extra leaves; side bud; two flowers; three flowers; little bush; sapling; young tree; full tree; blossom tree; fruit tree. Artwork retains the original flat fills, rounded green leaves, cupped flower shapes, four species and six palettes. A cycle holds its flower family; the next cycle may vary it. The fruit tree remains until the next seed starts a fresh sprout, with no timer-based loss of progress.

Every seed retains the happy hop. Stages 10 and 20 queue two celebration hops. At lifetime totals 20 and 40 the chick gradually becomes rounder; body evolution is capped at two upgrades while plant cycles continue. At the cap the body is approximately 40% wider, 24% deeper and 7% taller. Breast, wings, tail, neck position, hip/foot spread and ground shadow adjust together; the head itself is not inflated. Existing click pursuit remains authoritative. Reduced-motion opt-in skips celebration hops and growth pop/fade, and applies body proportions directly. Progress lives in the current page session; reloading starts over.

Implementation reuses one 192×192 growth CanvasTexture and one head sprite. The texture is repainted only on collection, not per frame; existing geometry and fur instances are reused for body proportions. No new network assets, server dependencies or per-cycle resource accumulation. Current page flower sizes, counts, 16-second regrowth and immediate hidden-card appearance remain in place. Cache key: `growth-cycle-20261104`.

Validation: `portfolio-exports/check-sumi-growth-cycle.mjs` advances 61 collections, checks all 20 distinct drawings, wraps 20→1, caps body tiers at [1,2,2] across three cycles, verifies per-seed/10th/20th hop queues, retained growth on suspend/resume, finite foot positions and ground contact, and reduced-motion behavior. Offscreen art plates review all stages and base/first/final body proportions. The isolated renders keep the same 46 draw calls and 7 active textures between body tiers 1 and 2; these are fixture observations, not a device FPS guarantee. Updated DOM-seed regression verifies actual butterfly/chick collection and three initial happy hops, responsive sizes, scrolling, project flower quotas and instant card flowers. Click-pursuit regression passes. No runtime or shader errors. No ZIP generated.

### Local growth debug slider (2026-11-04)

Adds a compact, collapsible GROWTH DEBUG panel at bottom right on localhost/127.0.0.1/IPv6 localhost. A native keyboard-accessible range input sets 0–60 total seeds immediately, including backward changes and reset to zero. Labels show total seeds, the 0–20 plant stage/name and body tier. At 20/40 the existing body upgrades apply; 21/41 begin the next plant cycle. Previewing updates actual session progress, so subsequent seed collection continues from the chosen value. No persistence or collection/celebration side effects are triggered by scrubbing.

The chick is positioned above the panel and held for inspection during adjustment. Pointer exit, focus leaving, panel collapse, modal opening or companion deactivation releases the hold. Controls are disabled until the companion is active, and the panel hides with project dialogs. Mobile layout clears the companion toggle. Public hosting does not display the panel by default; append `?growthDebug=1` for an explicit debug preview. New small modules: `sumi-growth-stages.js` and `sumi-growth-debug.js`. Cache key: `growth-debug-20261104`.

Validation: `check-sumi-growth-debug.mjs` sends input events through the real slider at 0/1/8/10/19/20/21/39/40/41/60 and backward to 5/0, checks immediate body/plant state, reset, hold release, modal hiding, narrow-screen bounds and local/public-host gating. The 61-collection growth-cycle regression also passes. No runtime errors; no ZIP generated.

### Stronger roundness at 20 / 40 / 60 seeds (2026-11-04)

Body evolution now has three capped tiers, at 20, 40 and 60 seeds. Each tier applies twice the former proportion change, so the first upgrade matches the former maximum. Relative to the base body, width is 1.4× / 1.8× / 2.2× and depth is 1.24× / 1.48× / 1.72×. Breast, tail, wing pivots, hip/foot spacing, neck offset and ground shadow follow the same stronger proportion parameter. Head size remains fixed. Plant cycles remain twenty stages. Debug labels now include the third body tier; values above 60 in normal collection retain that maximum.

Validation: the 61-seed regression confirms tiers [1,2,3], grounded feet, stable draw calls/textures and reduced-motion behavior. Offscreen body art review compares base, 20 and 60 seeds. Slider/reset/public-host gating checks pass. Initial parallel headless runs timed out during startup; isolated initialization and sequential reruns passed without runtime/shader errors. Cache key: `rounder-growth-20261104`.

### Fixed face height during body growth (2026-11-04)

Removed the growth-dependent vertical neck offset. All body tiers retain the base neck height; existing gaze/hop motion and forward offset remain. Scene syntax check passed. Bootstrap/scene cache key: `fixed-face-height-20261104`.

### Third body tier: 15% extra vertical thickness (2026-11-04)

Only body tier 3 adds a 1.15 multiplier to the existing body and breast Y scales. A smoothstep from tier 2 to 3 follows the existing gradual evolution; settled tiers 0–2 retain their exact prior proportions. Face/neck height and body X/Z scales remain unchanged. The 61-seed growth regression, grounded-foot checks and reduced-motion checks pass without runtime errors; offscreen body artwork was inspected. Cache key: `tier3-thickness-20261104`.

### Body evolution on the next sprout (2026-11-04)

At totals 19→20, 39→40 and 59→60 the chick keeps its body tier. Stage 20 now retains the same blossom tree as stage 19 (no fruit substitution), enlarging the tree sprite by 12% and its blossom drawings by another 12%. Body evolution occurs only at 20→21, 40→41 and 60→61, alongside the next sprout. The existing stronger body proportions and third-tier vertical thickness remain. The shared progress calculation now uses completed previous cycles, so the debug slider and natural collection agree. Slider maximum extends to 61 to allow third-tier inspection.

Validation: slider checks cover both directions across 19/20/21, 39/40/41 and 59/60/61. The growth-cycle suite verifies unchanged body tiers at each tree finale, exactly 12% tree-scale increase, and simultaneous smaller sprout/new body tier on the following seed. Cache key: `sprout-evolution-20261104`.

### Stronger tree finale (2026-11-04)

At seeds 20, 40 and 60 (plant stage 20), the illustrated trunk is 21 canvas units wide instead of 7 (3× stage 19). Attached blossoms use 1.5× stage-19 drawing scale, replacing the subtle 1.12× blossom multiplier. The existing 12% overall finale ornament enlargement remains. Stages 56–59 keep the existing sapling-to-blossom progression before the emphasized tree at 60. Branches, leaf style, body tier timing (21/41/61), face position and collection behavior are unchanged. This redraws the same reusable texture without adding meshes or textures. Cache key: `tree-finale-20261104`.

### Elastic body evolution (2026-11-04)

Body upgrades at 21/41/61 now use a finite 0.84-second anticipation/pop/settle animation instead of gradual damping: compress to 92% width/depth and 86% height at 0.14s, grow to the new tier with a 113% width/depth and 110% height overshoot at 0.34s, then rebound through 96% and 102–102.5% before settling exactly at 100%. Body and breast deform; wing attachment width follows. Head/neck height and grounded foot Y positions receive no evolution offset. Collection briefly holds movement and delays its existing happy hop to 0.9s so both actions read separately. No new geometry, textures or effects are created.

Local debug slider upward body-tier transitions preview the same motion; lower tiers/reset snap immediately and cancel any pending evolution. Reduced-motion users receive the final body immediately. The active-scene frame loop controls the timer, so hidden/suspended scenes do not skip the animation. Cache key: `elastic-growth-20261104`.

### Fixed 61-flower portfolio tour (2026-11-04)

The initial garden is now a single session-long plan of exactly 61 flowers: hero 10, projects 35, career/expertise 12, closing section 4. Each featured thumbnail has five flowers (three at its upper edge and two inside its lower edge). The current 15 ordinary project cards each have one thumbnail flower; ten randomly selected cards also have one hidden footer flower. Text flowers are spread across headings/descriptions rather than concentrated on one block. Initial anchor nodes, relative horizontal positions and variants are sampled once, then follow document layout through scrolling, resizing, filtering and expansion. Closed panels/filtered cards hide their slots without removing or replacing them. Reload starts a new session/plan.

No collected flower is replanted until all 61 unique initial seeds have actually been collected by the chick. A separate set of initial flower IDs controls completion; moving the growth-debug slider to 61 cannot unlock it. Uncollected seeds no longer expire, so looking elsewhere cannot make the finite tour impossible. Seed collection can finish even if its card closes during the pickup animation. Duplicate collection is rejected.

After the final initial seed, wait a randomized 16–24 seconds of active play, then plant one flower at a random eligible document anchor with subtle horizontal variation. Each new flower starts another 16–24-second delay. No catch-up burst occurs after a long frame or suspension; at most four uncollected flowers/seeds remain in the endless phase. The fixed pool is reduced from 80 to 61 DOM flower/seed pairs. Existing art, bloom effects, growth tiers and elastic body evolution remain intact.

Validation: headless browser checks verify all regional counts, five flowers per featured thumbnail, fixed anchors at desktop and 390px width, real dwell/bloom/seed pickup, persistent seeds, filter hide/restore, no respawn after 60 pickups and a long wait, actual 61st-pickup completion, delayed single spawns, four-item cap, suspension, and debug isolation. Growth-cycle regression covers all 61 progression steps and reduced motion. Cache key: `fixed-garden-20261104`.

### Subtle seed pickup count (2026-11-04)

Each actual seed pickup shows a single reusable DOM label above the chick/head ornament: `1/61`, `61/61`, then `63/61` etc. Its session-long actual collection count is independent of the debug growth slider. The existing playful Chewy footprint font is used at 17px, maximum opacity 0.84; cream on hero/career/media backgrounds and muted olive on light areas. No badge or persistent HUD is added, and the label does not intercept input.

The 1.35-second feedback rises 16px with a small scale overshoot, settles back 3px, holds briefly, then descends while fading out. It follows the projected head after pose updates, clears the visible sprout/tree, hides outside the viewport and during companion suspension/modal display, and reuses one element for rapid pickups. Reduced motion retains only opacity feedback. Disposal removes the element. The existing flower effects, body evolution and collection hops remain independent.

Validation: the fixed-garden browser suite now verifies real pickup labels `1/61`, `61/61`, `63/61`, no label change from debug edits, upward/hold/downward timing, fade completion and suspension hiding. Cache key: `seed-counter-20261104`.

### Hidden detail flowers and floating toolkit finds (2026-11-04)

Career/toolkit flowers are reduced from 12 to 4: two fixed career heading flowers and two gently floating flowers inside the toolkit field. Their slow, bounded elliptical drift stays within the central dot-cloud area; reduced motion holds the initial position. On bloom, the floating anchor freezes at the contact location so the chick can reliably collect its seed.

The removed eight slots are allocated to eight distinct, randomly selected project detail pages (one each). Stable project IDs and random heading/notes choices are assigned once per session. Detail DOM anchors resolve when that project opens, and rebind after its markup is recreated. Unvisited projects reserve their slots without displaying flowers on the main page. Collected IDs stay depleted across close/reopen and previous/next navigation. Total remains 61: hero 10, projects 35, career/toolkit 4, project details 8, ending 4.

The companion now stays active in project dialogs. Its existing transparent canvas, page-flower layer and count label are mounted inside the native dialog top layer, with pointer events still passing through. Flower coordinates use viewport space in the modal; the camera follows the dialog scroll while preserving chick size. Main-page chick position is restored on close. Main-page footprints are suppressed in detail mode and old ink buffers cleared on surface changes. Canvas/flowers/count feedback are clipped to the dialog bounds. Image enlargement still suspends the companion; video/buttons/links retain their normal interactions. No separate game instance or duplicate renderer is created.

Validation: headless browser checks exercise all eight assigned detail pages, real dwell/bloom/seed pickup, dialog scrolling while the main page remains scrolled, canvas top-layer mounting and viewport dimensions, return to the main page, and no respawn on reopening. Floating flowers move before contact and remain stationary as seeds. Fixed-garden/count and growth-cycle checks cover the retained 61-item rules. Cache key: `hidden-garden-20261104`.
# Body-growth pickup count emphasis (2026-11-04)

- Actual body-tier increases (normally seed 21, 41 and 61) use a 28px count instead of the normal 17px label. Detection compares growth tiers before/after collection, so later plant cycles at the capped body size do not trigger false growth emphasis.
- The count compresses at 0.14s, pops to 1.24× horizontal / 1.18× vertical scale at 0.34s alongside body expansion, and settles by 0.84s. It holds until 1.2s, then descends and fades out by 1.9s; peak opacity is 98%.
- Ordinary pickups keep the original subtle timing, opacity and size. Reduced motion retains larger milestone text with opacity-only feedback. The same reusable DOM label works on the main page and in project details, without changing layout or adding particles.
- Verified with headless `check-sumi-growth-counter.mjs` (mobile viewport, timing, ordinary-state reset, reduced motion and cleanup) and `check-sumi-fixed-garden.mjs` (61 collectibles, real pickups, count continuity and regeneration).

# Click pickup-count feedback (2026-11-04)

- A primary page click that triggers the chick's hop replays the normal 17px pickup count above its head, using the current real collection total (including `0/61` before collecting). Click feedback always uses the normal size/timing, even at 21/41/61; the large elastic emphasis is reserved for actual body-tier increases during collection.
- Clicks never increment collections or growth. The single existing counter is restarted on repeated clicks, so labels do not stack. Interactive controls and inactive companion states retain their existing input exclusions; reduced-motion feedback stays opacity-only.

# Project-detail media waiting spot (2026-11-04)

- Replaces the previous media-exclusion route: when the pointer enters `.dialog-stage`, the butterfly flies smoothly to the lower-right dialog margin. It may cross media during this flight; there is no hard barrier or position snap. Leaving the stage resumes ordinary pointer following.
- The waiting spot sits in the right notes margin when available, otherwise near the lower-right media edge, clamped to the visible dialog. Hover detection includes native `:hover` for embedded YouTube frames. Seven-second idle wandering is suppressed while waiting.
- Within 42px of the spot, wing motion eases down to a 7-radian/second phase rate and a smaller flap span; a 3–4px slow drift keeps it alive. Heading settles rather than twitching during that drift. Reduced motion removes the spot's drift.
- All active cursor following now shares the accepted media-return motion: a 4.4 follow rate and 2× the screen-speed cap derived from the pointer-out path's maximum velocity. This applies on the main page and in details, including final approach, without a special return-state speed switch. Gentler wing motion continues until within 12px of the cursor. Arrival at the lower-right spot, seven-second idle wandering and pointer-out free flight retain their existing speeds.
- Chick pursuit remains unrestricted. Media controls, click feedback and the enlarged image viewer's pause behavior remain intact; no overlay intercepts input.
- Headless QA: `check-sumi-media-perch.mjs` verifies smooth arrival, settled position/flap rate, video-to-gallery-image switching, release on pointer exit and return to the main page without runtime errors. The older avoidance test is superseded.

## Three flower sizes (2026-11-04)

- Each planted flower randomly receives one of three fixed sizes: 80%, 100% or 120% of the existing 34.4px base. The choice persists through scrolling, card expansion, detail visits and bloom animation; a newly respawned flower gets a new choice.
- Flower-head collision offset and dwell radius scale with that flower. Seeds, the chick's head ornament, the 61-item quota and respawn timing remain unchanged. Existing 192px canvases are reused with CSS transforms; no additional images or render loop are introduced.


## Featured giant-flower event (2026-11-04)

- KRAFTON Cinematic Workflow Toolkit and KRAFTON Production Breakdown each have two ordinary flowers along the upper thumbnail edge and one giant flower growing inside the lower edge. The ordinary flowers retain the random 80/100/120% sizes; the giant uses 180% of the base size and the same illustrated flower families/colors.
- Each giant requires three separate butterfly visits (0.28s contact each). Staying on it cannot repeatedly count: the butterfly must leave the contact radius by another 14px for at least 0.18s before the next visit. Each visit briefly pulses the flower and opens its petals further; reduced motion suppresses the pulse.
- The third visit blooms and releases three ordinary-size seeds in a small 34px-spaced fan. Every seed is separately collectible and triggers the existing count, growth and happy-hop behavior. These seeds stay document-anchored and persist through scrolling/filtering until collected.
- Each featured project still rewards five seeds: two from ordinary flowers plus three from its giant. There are 57 initial visible flower slots and four reserved seed reward slots, retaining 61 unique collectible IDs in the same fixed DOM pool. Regional reward allocation stays hero 10, projects 35, career/toolkit 4, details 8, closing 4. No extra detail flowers or network assets were added.
- After all 61 seeds are collected, the existing quiet endless phase produces ordinary flowers only, with the same 16–24 second delay and four-item cap.
- Headless checks: `check-sumi-featured-event.mjs` verifies allocation, separate-visit gating, three distinct seed positions and three physical pickups. `check-sumi-fixed-garden.mjs` verifies responsive anchor stability, 61-item completion, counters and respawn; `check-sumi-hidden-garden.mjs` verifies detail and floating-flower collection. All passed without page runtime errors.
- Cache key: `featured-flower-event-20261104`. Earlier dated allocation notes describe historical states; this section is the current featured-project allocation.

## Featured flower continuous-hover charge (2026-11-04)

Supersedes the three-visit event above. Each featured project still has two normal flowers plus one 180% giant flower, awarding five seeds in total; the global goal stays 61.

- Hold the actual cursor over the giant flower head for approximately six seconds. Butterfly follow easing or idle flight does not interrupt the hold. Normal flowers retain their existing butterfly dwell behavior.
- Five escalating squash/stretch beats begin at 0.15, 1.5, 2.8, 4.0 and 5.1 seconds. Each briefly compresses, springs and recoils around the planted stem base, with progressively stronger small pollen bursts. Petals open progressively; no literal sound-effect text or sound is added.
- Charge reaches full at 5.58 seconds, followed by the existing 0.42-second bloom/pop. A final stronger pollen burst and three 48px-spaced seed trajectories signal completion. Each seed is separately collectible through the existing chick growth/counter behavior.
- Leaving the hover target drains charge at twice its buildup rate; it cannot finish while the pointer is away. Companion suspension pauses all timers. Reduced motion removes squash/stretch, rotation and final scale pop while retaining progress and rewards.
- Reuses existing canvas slots, particle pool and frame loop; adds no remote assets or timers. Cache key: `featured-flower-charge-20261104`.
- Validation: `check-sumi-featured-charge.mjs` replaces the previous visit-count test and verifies interruption/recovery, five escalating beats, release at 6.017 seconds at 60fps, three distinct seeds and three pickups. Fixed-garden regression retains the 61-ID collection and respawn checks.

## Hero event flower and subtle event glints (2026-11-04)

- The hero now has seven ordinary flowers and one randomly placed giant event flower (eight visible flowers, ten seed rewards). One original ordinary slot becomes a three-seed event, and two other ordinary flowers are removed to offset its extra rewards. Its anchor is selected once per session from existing hero text/specification anchors, excluding the changing reel title.
- The two featured projects retain their existing giant events. Across the page there are now three giants, 55 initial visible flower slots and six reserved seed slots: 61 unique seed rewards in the same pool. Details and all other regional reward quotas stay unchanged.
- All giant flowers receive three tiny cream/olive four-point glints around their petals. Their opacity softly varies between 12% and 60%, with staggered phases, using the same flower canvas. Only visible event flowers redraw, at most about 11 times per second; no new DOM elements, WebGL textures or particle emitters are added. Reduced motion uses static glints and redraws only when charge stages change.
- Six-second continuous-hover charge, escalating spring/pollen feedback and three-seed release remain unchanged. Headless fixed-garden, featured-charge and hidden-garden suites passed; hero allocation is explicitly checked as seven normal + one giant + two reserved reward IDs, and total completion remains 61.
- Cache key: `hero-event-glints-20261104`.

## Event flower breeze (2026-11-04)

All three giant flowers gently sway around the existing planted-stem transform origin. Two slow sine waves (roughly six and 3.4 seconds, combined maximum 3.7 degrees) use each flower's own phase to avoid synchronized movement. The breeze fades during the first 0.6 seconds of charging so the existing elastic beats remain clear, and returns as charge drains after pointer exit. Reduced motion disables the sway. Normal flowers, seed rewards, anchor positions and six-second charge timing are unchanged. Uses the existing frame loop and CSS transform without new elements or assets. Cache key: `event-flower-breeze-20261104`.

### Stronger event-flower breeze (2026-11-04)

Doubled both sway amplitudes (0.104 and 0.024 radians, combined maximum approximately 7.3 degrees) and multiplied both angular frequencies by 1.5 (1.575 and 2.745 rad/s; approximately 4.0 and 2.3 second periods). Charge blending, elastic beats, six-second event timing and reduced-motion behavior remain unchanged. Cache key: `event-flower-breeze-stronger-20261104`.

## Scroll recovery during collection reactions (2026-11-04)

Fixed a reproducible state deadlock: queued reward hops made `celebrating` block movement while offscreen recovery forbade starting those hops. Consequently rewardHops never decreased and the chick could remain offscreen indefinitely, including after ordinary seed collection and body upgrades.

Recovery is now resolved before choosing the seed/butterfly target and before applying reaction locks. While recovering, pending reward hops and collection wait timers are deferred, active hops are grounded, idle settling is suppressed and the visible butterfly goal has priority. Elastic body-evolution time pauses until recovery ends. Once comfortably inside the viewport, the retained timers, remaining reward hops and body evolution resume normally. Seed counts, awarded growth tiers and usual walking/click speeds are preserved.

Related transition cleanup: entering, leaving or changing project-detail surfaces clears stale click-hop, reward-hop, collection, peck and idle state. A pending body evolution settles at its already-earned target tier, without changing the collection count. This avoids replaying old reactions at unrelated document coordinates.

Headless regression `check-sumi-scroll-recovery.mjs` first reproduced the original failure (zero speed and no return after 20 simulated seconds). After the fix, 16 upward/downward 1200px camera-scroll scenarios cover ordinary collection, double-hop rewards, tiers 21/41/61, a hop in progress, sleeping and click pursuit. Every case returned in approximately three seconds at the existing speed cap, with no recovery hesitation; pending reactions completed afterward. Additional assertions verify paused evolution and dialog entry/exit state cleanup without growth loss. Click-pursuit, full growth-cycle/reduced-motion and hidden-detail-garden suites also passed without runtime errors.

Cache key: `reaction-scroll-recovery-20261104`.

## Clearer event-flower glints (2026-11-04)

Increased the existing three event glints' peak radius from 4.8 to 7.4 canvas units (about 1.54x), and opacity range from 12–60% to 20–88%. Cream/olive colors are slightly lighter. The shimmer envelope uses a squared rather than cubed sine to keep each bright moment visible longer, retaining its original slow timing and staggered phases. No extra particles or glints are added; charge, sway, reduced-motion behavior and collection remain unchanged. Cache key: `event-glints-clearer-20261104`.

## Event flower size 200% (2026-11-04)

All three giant event flowers now use 200% of the 34.4px base (68.8px canvas box), replacing 180%. A shared size constant also updates the three-seed launch height. Hover radius and head position already scale with flower size. Ordinary flower sizes, seed sizes, six-second charge and the 61-reward goal remain unchanged. Cache key: `event-flower-200-20261104`.

## Hero flower focal position (2026-11-04)

Moved the existing hero giant flower from a randomly chosen text/spec anchor to the hero section itself: horizontal position is sampled once between 64–68% and vertical position between 52–58%. This creates a slightly right-of-center focal point over the reel, with small session-to-session variation. It follows the document on scroll and keeps the same relative position on resize. Its two reserved seed slots share the new anchor. Seven ordinary hero flowers, three event seeds, the 61-seed total, size and animations are unchanged. Cache key: `hero-flower-focal-point-20261104`.


## Hero ordinary focal flower and title event (2026-11-04)

The right-of-center reel focal point is now an ordinary flower, retaining the normal three size variations. The single hero event flower randomly chooses either the top of artistic (30–70% across that word) or the nic area of technical (60–70% across that word). Both title anchors follow their actual responsive text bounds, and the choice stays stable for the session. The ordinary reel flower remains at 64–68% horizontal and 52–58% vertical within the hero. No extra flowers or rewards were added: seven ordinary hero flowers plus one three-seed event, with the overall 61-seed goal unchanged. Cache key: `hero-flower-title-ledges-20261104`.


## Ordinary thumbnail flowers at the bottom (2026-11-04)

All non-featured project thumbnail flowers now anchor to the bottom edge, blooming inside the image with randomized horizontal positions. The two featured KRAFTON projects retain their existing top-edge ordinary flowers and bottom event flower. Hidden card-description flowers, reward allocation and the total 61 seeds are unchanged. Cache key: `ordinary-flowers-bottom-20261104`.


## Ordinary thumbnail flower variety (2026-11-04)

Ordinary thumbnails now receive 0, 1 or 2 bottom-edge flowers. On each fresh garden, 4–6 randomly selected thumbnails are empty and an equal number receive two blooms; the remaining thumbnails receive one. This preserves 15 ordinary-thumbnail rewards and the overall 61-seed goal. Horizontal positions span 8–92% of the thumbnail, with at least 18% width between paired stems. Placement remains stable through hover, filtering and resize. Featured flowers and hidden description flowers are unchanged. Cache key: `ordinary-flower-variety-20261104`.


## One floating flower and a surprise event (2026-11-04)

Reduced toolkit floating flowers from two to one, and ending flowers from four to three. Each fresh garden promotes one randomly chosen existing ordinary flower to a three-seed event, using the two freed reward slots. Eligible locations include hero text, ordinary project thumbnails/descriptions, career text, project details and the ending. The hero reel focal flower stays ordinary and the two featured projects stay unchanged. The selected location is stable for the session; it uses existing event size, sway, sparkle and six-second charge. There are now four event flowers, eight reserved reward slots and 61 total seed rewards. Cache key: `surprise-event-flower-20261104`.


## 61-seed dragon-breath reward (2026-11-04)

Actual pickup number 61 unlocks a separate 60-second fire state. The growth debug slider does not unlock it or fabricate pickups. Every later seed restores 10 seconds, capped at 60; after expiration, another seed starts a 10-second charge. Collection totals never reset. The timer uses active wall-clock frame deltas independently of the physics timestep cap, so slow rendering does not lengthen the minute. It runs only while the companion is active and pauses with hidden tabs, enlarged-image viewing, the companion toggle and held growth previews.

The chick blends to warm red over 0.30 seconds and stays fully red for the entire charged interval. At expiration it returns to its original per-material yellows over 0.22 seconds. After the existing tier-61 elastic evolution completes, body roundness tracks remaining charge (three tiers at full charge to the base body at zero) with damped interpolation, also smoothing refills. Head height stays unchanged. Subsequent 20-seed growth callbacks cannot override the charge-driven body. The original crown-growth cycle and pickup feedback remain intact.

Eligible page clicks while charged replace the click hop with a one-second dragon breath from the projected beak, aligned with the head's projected forward direction, and open the beak. Ordinary links, buttons and video controls retain input isolation. One reused 640x320 canvas draws three flowing flame skins plus sixteen bounded embers, approximately 490px long at desktop size, scaled down on small screens. Repeated clicks have a 0.85-second emission cooldown and do not accumulate canvas elements, particles, textures or shader programs. Reduced-motion mode uses a shorter, non-turbulent flame without flying embers. A small 64px countdown bar below the chick avoids covering its crown and pickup counter. The overlay is pointer-transparent and follows the active dialog host; changing surfaces or suspending clears an in-progress breath.

Validation: `check-sumi-fire-mode.mjs` covers actual pickup activation, debug isolation, refill and cap, late red color, expiration, post-expiration refill, click emission, bounded repeated emission, pause/resume, body shrink, dialog hosting, original yellow restoration and reduced motion. Existing fixed-garden, scroll-recovery and click-pursuit regressions cover the surrounding game. Browser checks reported no runtime errors; repeated isolated fire updates did not increase WebGL texture/program counts. This is not a physical-device FPS guarantee. Cache key: `dragon-breath-20261104`.


## Debug slider simulates real collection (2026-11-04)

The local growth slider now sets the actual seed counter, finite-garden collected IDs, growth and fire reward together. Setting 61 removes all initial rewards, activates a full 60-second red/fire state immediately, and schedules the usual delayed single-flower respawn. Lowering the slider rebuilds the remaining initial garden; values below 61 reset fire mode. Reset to zero restores the full tour and yellow base body. Reserved event rewards are marked consumed before parent flowers to prevent inaccessible orphan seeds during partial debug collection. This is a debug-only state setter, not repeated pickup animation; production collection remains unchanged. The timer stays paused while holding the preview and resumes after leaving the panel. The panel is still restricted to localhost or explicit growthDebug query opt-in. Cache key: `debug-actual-pickups-20261104`.


## Continuous fast following in fire mode (2026-11-04)

While fire charge is positive, following uses the same full pursuit boost, acceleration, turning and speed cap as click catch-up. Random hesitation, idle settling, floor pecks and unsolicited near-butterfly hops are suppressed. Reaching the butterfly still brakes safely; moving away starts pursuit immediately using the stop-distance threshold. Nearby seed detours remain available for refilling, with boosted travel; pickup/reward animations and offscreen recovery remain intact. Fire following is a derived state, not a permanently latched click flag, so depletion restores ordinary movement automatically. Cache key: `fire-fast-pursuit-20261104`.


### Fire transformation head ornament
- While fire charge is positive, the existing head-crown sprite shows a warm illustrated flame instead of its growth-stage plant. Expiration restores the current plant stage without resetting collection progress or moving the head.
- One cached 1024×768 flame atlas (48 frames, 128px each), played at 24fps with time-based stretch/sway. Independently deforming tips, notches, and inner tongues change the silhouette. Reduced motion uses a still frame. No per-frame texture redraws/uploads or extra sprites. The texture is disposed with the flower artwork.
- The collection debug slider reflects this immediately at 61 and restores the plant when lowered.

- Head flame motion tuning: layered 19–43 rad/s oscillations (roughly 3–7 Hz), stronger stretch and sway for a brisk burning effect. Base position/opacity stay stable; reduced-motion mode remains still. Reuses the cached texture with no per-frame uploads.

- Head flame shape animation: a seamless two-second flipbook updates only UV offsets; the base stays anchored on the head. Expiration restores the separate growth texture, so atlas transforms never affect the plant.


### Repeatable collection cycle (supersedes the previous endless-garden rules)
- Actual pickup 59 starts assistance: every 7 active seconds, spawn up to 3 ordinary flowers at separated layout anchors, prioritizing the current viewport. Keeps the existing 61-slot pool; occupied flowers/seeds are never overwritten and a delayed frame never creates multiple catch-up batches.
- Assistance continues through the charged transformation. Extra seeds still refill 10 seconds, capped at 60.
- Once charge expires and the brief red-to-yellow transition finishes, reset actual/display counts to 0/61, remove the head plant/flame, restore base body, clear pending reward reactions, and replant the original 61-reward tour. Assistance stops until the new cycle reaches 59. Unlocking fire again requires a fresh 61 pickups.
- Debug collection at 59/60 uses the same seven-second schedule; holding the debug preview pauses the assistance and fire clocks.


### Carry-over and timing revision (current rules)
- From 59 actual pickups, assistance plants up to two ordinary flowers every ten active seconds, using the existing bounded pool and separated layout anchors.
- Fire duration/cap is 30 seconds. Each extra seed adds five seconds, capped at 30; the gauge ratio uses the same duration constant.
- At the end of the red-to-yellow transition, subtract the 61-seed transformation cost and carry all excess seeds into the next cycle. Restore both plant stage and body tier from this count: 71 becomes 10/61 (stage-10 flower), 82 becomes 21/61 (tier-one chick/sprout), 61 becomes 0/61 with no plant.
- The renewed tour marks the carried count as already collected; assist timing follows the carried count, with no stale pickup reactions. Debug remains capped at 61, while normal carry-over never truncates excess seeds.


### Random elemental transformations
- At the 61-seed unlock, select fire, lightning, or ice with equal probability. Selection happens once per transformation; refills/clicks never reroll it. A consecutive cycle can legitimately select the same element.
- Fire: red/orange fur, animated flame head atlas, existing broad dragon breath. Lightning: saturated gold fur, illustrated bolt crown with small arcs, six staggered ground strikes around the cast position with impact rings, cracks and sparks. Ice: sky-blue fur, faceted crystal crown, five planted crystal pillars erupting sequentially in the cast-time forward direction.
- The same click input launches the selected skill, with pointer-control exclusions, fast pursuit, modal hosting, and pause behavior. Fire retains its 0.85-second cooldown; lightning/ice use 1.8/2.8 seconds so one complete ground cast plays before the next. One 640×320 fire canvas and one bounded 900×720 ground canvas are reused; no extra WebGL lights, particle systems, or per-click allocations of canvases/textures. Two small cached crown textures are disposed with the artwork. Lightning uses continuous local strokes, not screen flashes.
- Shared rules remain: 30-second duration/cap, +5 seconds per extra seed; flowers at 59+ spawn two per ten seconds; expiration carries total minus 61 into the matching normal growth/body stage. The small gauge shows the element name and matching color.
- Reduced motion keeps crowns static and reduces the skill length/particle count. Debug slider 0 → 61 samples a fresh element, just like a new transformation. Internal fireMode names remain for compatibility, but cover all three elements.

### Ground-anchored click skills (2026-11-04)
- `sumi-ground-skills.js` captures the chick foot position and facing at the accepted click. It never re-anchors to the moving chick. Document/dialog scroll offsets move the effect with the original page position.
- Lightning drops six bolts with 105 ms spacing; ice pillars erupt with 130 ms spacing, overshoot briefly, remain planted, then fade. Ground effects render below the chick, are pointer-transparent, and are clipped to the open dialog.
- Cooldown clicks do not relocate/restart the active cast. Pause, surface changes, viewport changes and mode expiration clear it. No accumulating effect nodes or GPU textures; reduced motion uses three simultaneous ground marks and omits flying debris.
- Headless checks cover fire/lightning/ice activation, palettes, refill/carry-over, stable GPU texture counts, reduced motion, stationary cast coordinates during chick movement, cooldown, document/dialog scrolling, expiry and suspension. Canvas artwork was rendered separately for visual inspection.
