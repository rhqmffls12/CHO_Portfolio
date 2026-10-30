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
