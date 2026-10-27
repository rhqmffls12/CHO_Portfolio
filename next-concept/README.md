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

An optional `rounded-preview.css` stylesheet gives the main hero video and all project thumbnails subtle 6 px corners, including hover video clipping. Layout, colors and detail-view media styling remain unchanged. Remove its link in index.html to restore square media corners. This visual trial is applied only to the working site; no transfer archive was rebuilt.

The Selected Work section date range is 2015–2026, covering the earlier work as well as recent projects.

The project-section introduction now describes experience in high-quality real-time visuals through Unreal Engine cinematic production, inviting visitors to explore the technical artist's approach and results across art, tool development and pipeline design. This copy update was applied to the working site only; the existing transfer package was not rebuilt.

The lower approach contact area uses compact Outlook and Slack SVG icons, without text-button frames. Icons have muted brand colors, 44 px clickable targets, accessible labels and hover titles. The header retains its text links. The Outlook icon retains the existing mailto behavior (opens the visitor's configured mail app); it does not force Outlook. Slack retains the Enterprise profile destination.

Slack contact buttons appear beside LET’S TALK in the header and approach section. The owner supplied the KRAFTON Enterprise domain and member ID; `profile.slackProfileUrl` points to `https://krafton.enterprise.slack.com/user/@U022E9ULBT3`, using Slack's documented Enterprise profile link format. This opens the member profile for accessible organization members, from which they can message the owner. Direct native DM deep links require a workspace team ID, which has not been supplied. Links open a new tab; no messages are sent automatically. Authenticated Slack navigation has not been tested.

Desktop mouse hover immediately creates a muted preview for either local video (`entry.video` or `media.type=video`) or YouTube media, with no intentional delay. Only one card preview exists at a time. Local video loops with cover sizing; YouTube uses its privacy-enhanced embedded player and the IFrame API to mute before playback and reveal only after the playing event. Original posters remain visible during loading or playback errors. YouTube branding/loading and embedding restrictions are controlled by YouTube; no remote video is downloaded.

YouTube API and connection prewarming begins when the project section is within 600 px of the viewport on eligible desktop devices. Iframe and API requests also run in parallel on hover, eliminating the previous serial loading delay. Actual YouTube media startup still depends on the remote player and network; short locally supplied preview MP4s are the next option for consistently faster previews.

Pointer leave/down, project opening, category changes, page hiding, window blur, or scrolling the card out of view destroys the preview and restores the original thumbnail. Preview media is loaded on hover; the YouTube API is warmed near the project section. Touch devices and reduced-motion preferences retain static thumbnails. Thumbnail clicks still open project details. This implementation was not browser-tested in this pass.

Earlier Work uses the owner-supplied 2015_rig.png, 2015_tool.png and 2015_project.png for Rig Breakdown, Tools & Pipeline and Production Showreel respectively. Originals are copied into assets/thumbnails and small/card/detail WebP derivatives are included in the image manifest. Video links are retained. The transfer ZIP has not been rebuilt.
