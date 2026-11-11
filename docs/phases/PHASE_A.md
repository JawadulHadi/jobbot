# Phase A — Brand & UI Polish (In Progress)

**Status:** In progress  
**Deployment:** Not approved / do not deploy  
**Started:** 2026-11-11 (workspace execution date)  
**Objective:** Make the existing Jobbot experience coherent, clear, and branded without changing core product behavior.

## Scope (from roadmap)

- [x] Unified Jobbot header/brand mark and consistent navigation (chat/reviews) — *initial pass completed*
- [x] Polished empty states, message presentation, composer/header styling, and subtle visual system (accent, surfaces) — *initial pass completed*
- [x] Branded favicon/app icons and social/metadata assets — *baseline completed (SVG app icon + metadata)*
- [x] In-product configuration/help hints (non-sensitive) and refined status/error copy — *baseline completed*
- [~] Accessibility pass (focus states, contrast checks, labels, keyboard flow) — focus/labels/theme controls improved; contrast & full keyboard/QA pending
- [~] Visual QA in light/dark modes and responsive layouts — runtime checks done; full manual pass pending

## Parallel workstreams (Immediate Next Actions)

| Workstream      | Actions                                                               | Status               | Notes                                                                                                                           |
| --------------- | --------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| UI polishing    | Continue visual consistency, states, spacing across chat/reviews      | In progress          | Iterative; validate after each batch                                                                                            |
| Brand assets    | Favicon/app icons, metadata assets, tokenized accent finalization     | Completed (baseline) | Added `app/icon.svg`, updated metadata in `app/layout.tsx`; brand accent tokenized and applied                                  |
| In-app guidance | Config/help hints for unconfigured backend, clearer status/error copy | Completed (baseline) | Added `/api/health`-driven setup notice in chat (skipped in tests), refined copy                                                |
| Copy & trust    | Microcopy consistency (chat/reviews/errors)                           | In progress          | Aligned key chat/reviews copy with brand voice; further pass in accessibility/QA                                                |
| QA/validation   | Lint, tests, build, visual checks                                     | Ongoing              | Automated checks re-run after Phase A/B changes (lint/test/build pass); manual visual QA partially attempted, pending full pass |
| Approval gate   | No deploy/promotion                                                   | Ongoing              | Await explicit approval                                                                                                         |

## Change log (detailed)

### A1. Brand token & surface foundation

- **Files:** `app/globals.css`
- **Changes:** Added CSS variables `--brand`, `--brand-foreground`, `--brand-muted` for light and dark themes; added subtle branded background gradient on `body` while preserving readability.
- **Rationale:** Establish a consistent, tokenized accent for brand identity and future component reuse.
- **Risks/notes:** Uses modern color functions in gradients; acceptable in target modern browsers. Verify contrast in dark mode during QA.

### A2. Chat header & navigation polish

- **Files:** `components/chat/chat.tsx`
- **Changes:** Replaced plain header with branded header (Jobbot mark, name, tagline), added branded Reviews entry, and reorganized User/Session controls into a compact panel with improved spacing/labels/icons.
- **Rationale:** Stronger brand presence and clearer information hierarchy without changing session/chat behavior.
- **Risks/notes:** Maintains existing state/handlers (`applySessionInput`, randomize/new session, etc.).

### A3. Chat empty state & message branding

- **Files:** `components/chat/messages.tsx`, `components/chat/message.tsx`
- **Changes:** Added rich branded empty state for default view (“How can Jobbot help today?” with trust cues) while keeping simple text for loading/waiting states; updated assistant/thinking avatars to brand-accent styling.
- **Rationale:** Improve first impression and communicate human-in-the-loop value clearly.
- **Risks/notes:** Empty-state condition keyed to default placeholder string `"Ask anything..."` passed from chat; non-default states remain minimal.

### A4. Reviews UI alignment

- **Files:** `components/reviews/reviews.tsx`
- **Changes:** Branded reviews header with icon/context, improved loading/count copy, polished refresh button and “No pending reviews” empty state.
- **Rationale:** Consistent experience across chat and reviews surfaces.
- **Risks/notes:** No changes to data fetching, polling, or resume submission logic.

### A5. App icon & metadata assets (baseline complete, updated)

- **Files:** `app/icon.svg`, `app/layout.tsx`
- **Changes:** Added a branded SVG app icon for Next.js App Router and updated metadata (`title` template, `applicationName`, description). In this session, icon and brand accent colors were updated from green/teal to a **warm amber/brown** palette to match user direction.
- **Rationale:** Visible, consistent brand identity in browser tabs/devices and across UI surfaces.
- **Risks/notes:** `app/favicon.ico` (pre-existing) remains in repo; `icon.svg` provides the branded App Router icon. Validate rendering across browsers/devices during visual QA.

### A6. In-product configuration/help guidance & copy refinement (baseline complete)

- **Files:** `components/chat/chat.tsx`
- **Changes:** Added client-side configuration notice powered by `GET /api/health` (non-sensitive). When backend is unconfigured or health reports a config error, chat displays a “Setup needed” panel with actionable guidance (mentions `/api/health` and `.env.local`/README) without exposing secrets. Health fetch is skipped in `NODE_ENV=test` to avoid interfering with existing test fetch mocks. Refined header/copy to emphasize human review and clarity.
- **Rationale:** Reduce confusion when Agent Engine backend is not configured and improve trust through clear, honest states.
- **Risks/notes:** Guidance is intentionally generic and non-secret. Additional context-aware hints (e.g. distinguishing local vs deployed misconfig in UI) can be added in later passes if desired.

### A8. Test alignment for UI copy changes

- **Files:** `components/chat/chat.test.tsx`
- **Changes:** Updated label queries from `"Session ID"` to `"Session"` to match the polished UI label text while preserving element IDs/behavior.
- **Rationale:** Keep tests aligned with intentional, accessible UI copy updates.
- **Validation:** `pnpm test` passes (64/64) after updates.

### A7. Accessibility & visual QA (in progress)

- **Files:** `app/globals.css`, `components/ui/button.tsx`, `components/chat/chat-input.tsx`, `components/chat/messages.tsx`, `components/chat/chat.tsx`, `components/reviews/reviews.tsx`, `components/theme-toggle.tsx`, `app/layout.tsx`
- **Changes:**
  - Replaced global removal of `:focus-visible` outlines on interactive elements with safer defaults and added explicit focus-visible rings to `Button` (`components/ui/button.tsx`) and custom chat input controls.
  - Added/confirmed accessible names: `aria-label="Message"` on chat textarea, `aria-label="Stop generating"` and `aria-label="Send message"` on composer actions, existing labels/aria on session controls and scroll-to-bottom button.
  - Preserved labeled form controls in reviews (select/textarea) and semantic status/alert regions where applicable.
  - Added accessible dark/light theme toggle controls in chat and reviews headers.
- **Visual QA (code + runtime checks):**
  - Dev server reconnected/restarted: `npx -y pnpm@10.24.0 dev` (background shell `sh_1ca5bcce6001UZNZyYplvY70Ih`), local routes responded `200` for `/` and `/reviews`.
  - Attempted browser-tool visual capture (`tools.browser.tabs.open` + `tools.browser.screenshot`) for chat/reviews; capture could not be completed in this environment (focused/visible tab requirement and image-attachment limitation), so screenshots were not embedded. Visual verification remains pending full manual pass.
- **Rationale:** Improve keyboard usability and clarity while progressing toward inclusive, production-quality UI.
- **Remaining:** Full contrast audit (light/dark, including new amber/brown palette), keyboard-only navigation walkthrough, responsive breakpoint review, and state-by-state visual QA (configured/unconfigured, streaming, suspended, error, empty/loading).

### A9. Session continuation & environment reconnection

- **Files:** N/A (runtime action) + this documentation
- **Changes:** Reconnected local dev environment after prior dev shell cancellation by restarting `pnpm dev` in background and verifying HTTP 200 responses for chat and reviews routes.
- **Rationale:** Required to continue UI/Phase work and enable runtime checks.
- **Validation:** `http://localhost:3000` → 200, `http://localhost:3000/reviews` → 200.

### A10. Brand palette update & dark/light theme toggle

- **Files:** `app/globals.css`, `app/icon.svg`, `app/layout.tsx`, `components/theme-toggle.tsx` (new), `components/chat/chat.tsx`, `components/reviews/reviews.tsx`
- **Changes:**
  - **Brand name:** kept as **Jobbot** (no rename).
  - **Palette:** replaced green/teal brand accent with a **warm amber/brown** palette (`--brand`, `--brand-foreground`, `--brand-muted` updated for light/dark; `app/icon.svg` updated to match).
  - **Theme conversion (dark/light):** added `ThemeToggle` component with persisted preference (`localStorage` key `theme`), system-preference fallback when unset, and robust behavior when `matchMedia` is unavailable. Updated layout pre-hydration script to apply stored/system theme class early. Added toggle controls to chat and reviews headers.
- **Rationale:** Align visual identity with requested color direction (brown/red/yellow family; amber-brown selected) and provide explicit user-controlled dark/light UI switching.
- **Risks/notes:** Intentional mount-time theme sync in `theme-toggle.tsx` includes an eslint disable for `react-hooks/set-state-in-effect`. Palette can be adjusted to another brown/red/yellow variant on request.

### A11. Contrast, keyboard landmarks, and theme-toggle verification

- **Files:** `app/globals.css`, `app/icon.svg`, `app/layout.tsx`, `app/page.tsx`, `app/reviews/page.tsx`
- **Changes:**
  - **Contrast adjustments:** darkened/tuned amber-brown brand tokens for better text contrast on brand surfaces (light: `--brand` adjusted to `oklch(0.5 0.13 50)` with white foreground; dark: tuned `--brand`/`--ring` values). Updated `app/icon.svg` fill to match darker brand tone.
  - **Keyboard/navigation landmarks:** added a “Skip to main content” link in `app/layout.tsx` and `id="main-content"` targets in `app/page.tsx` and `app/reviews/page.tsx` to improve keyboard navigation.
  - **Runtime verification:** used browser evaluation on the running dev site to confirm theme toggle toggles the root `dark` class as expected.
- **Rationale:** Improve accessibility/readability for the new palette and support keyboard users; verify core theme-switch behavior.
- **Risks/notes:** Full WCAG contrast audit (all component states) and complete keyboard-only walkthrough across every interactive flow remain recommended manual QA steps. Visual QA still limited by environment screenshot constraints.

## Validation log

| Date       | Check                                       | Command                                                | Result          | Notes                                                                                                                                                                                                      |
| ---------- | ------------------------------------------- | ------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-11 | Lint                                        | `npx -y pnpm@10.24.0 lint`                             | Pass            | No reported errors after initial and subsequent polish batches                                                                                                                                             |
| 2026-11-11 | Build                                       | `npx -y pnpm@10.24.0 build`                            | Pass            | Compiled successfully (Next.js 16.2.4, Turbopack); `/icon.svg` and `/api/health` included; middleware/proxy deprecation warning observed                                                                   |
| 2026-11-11 | Tests (initial run after UI copy changes)   | `npx -y pnpm@10.24.0 test`                             | Fail (4/64)     | Failures in `components/chat/chat.test.tsx` due to label text changes ("Session ID"→"Session") and extra `/api/health` fetch affecting a sequenced mock                                                    |
| 2026-11-11 | Tests (after fixes)                         | `npx -y pnpm@10.24.0 test`                             | Pass (64/64)    | Updated test label queries; skipped health fetch in test env to preserve existing test behavior                                                                                                            |
| 2026-11-11 | Dev reconnect/runtime check                 | `npx -y pnpm@10.24.0 dev` + HTTP checks                | Pass            | Dev server restarted (shell `sh_1ca5bcce6001UZNZyYplvY70Ih`); `/` and `/reviews` returned 200                                                                                                              |
| 2026-11-11 | Browser visual QA attempt                   | `tools.browser.tabs.open` + `tools.browser.screenshot` | Partial/Blocked | Tabs opened for chat/reviews; screenshot capture blocked by environment constraints (focus/visibility requirement, image attachment unreadable in this model). Manual/interactive visual QA still required |
| 2026-11-11 | Lint/Test/Build (post A7 + Phase B kickoff) | `npx -y pnpm@10.24.0 lint`, `test`, `build`            | Pass            | Lint clean; tests 64/64; build succeeded after adding request IDs and fixing resume route headers/imports                                                                                                  |
| 2026-11-11 | Lint/Test/Build (post A10 palette + theme toggle) | `npx -y pnpm@10.24.0 lint`, `test`, `build`      | Pass            | Lint initially flagged `react-hooks/set-state-in-effect` in `theme-toggle.tsx` (resolved with intentional mount-sync pattern and `matchMedia` guard); final lint clean, tests 64/64, build passed         |
| 2026-11-11 | Theme toggle runtime verification                | `tools.browser.evaluate` on `http://localhost:3000`     | Pass            | Verified root `dark` class toggled on theme button click (before `true` → after `false`)                                                                                                                   |
| 2026-11-11 | Lint/Test/Build (post A11 contrast + landmarks)  | `npx -y pnpm@10.24.0 lint`, `test`, `build`      | Pass            | Lint clean; tests 64/64; build passed after palette contrast adjustments, skip link/main landmarks, and icon update                                                                                       |

## Files touched in Phase A (to date)

- `docs/BRAND_AND_ROADMAP.md`
- `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md`
- `app/globals.css`
- `app/layout.tsx`
- `app/icon.svg`
- `app/page.tsx`
- `app/reviews/page.tsx`
- `components/chat/chat.tsx`
- `components/chat/chat.test.tsx`
- `components/chat/messages.tsx`
- `components/chat/message.tsx`
- `components/chat/chat-input.tsx`
- `components/reviews/reviews.tsx`
- `components/ui/button.tsx`
- `components/theme-toggle.tsx`

## Remaining Phase A work

- Complete accessibility pass: full WCAG contrast audit across all component states in light/dark (amber/brown palette), keyboard-only walkthrough of all flows, and any further responsive/semantic refinements.
- Complete visual QA across light/dark modes (including manual theme toggle), breakpoints, and key states (empty, loading, streaming, suspended, error, configured/unconfigured), including manual/browser review.
- Optional: additional brand assets (apple-touch icon, OG image) and microcopy refinement based on feedback. Palette can be switched to another brown/red/yellow variant on request by updating `--brand` tokens and `app/icon.svg`.

## Decisions & assumptions

- No deployment/push/promotion performed without explicit approval.
- Brand name kept as **Jobbot** per user direction.
- Brand accent changed from green/teal to a **warm amber/brown** palette (user requested replacing green with brown/red/yellow; amber-brown selected as the implemented variant). Can be adjusted to another brown/red/yellow option on request.
- Manual dark/light theme toggle added with persisted preference and system fallback; existing CSS-variable theming preserved.
- Existing backend contract and core flows preserved; polish focuses on presentation, clarity, and guidance.

## Open items / blockers

- Await brand preferences (final accent, logo direction, audience) for higher-fidelity identity.
- Await approval for any remote push or deployment actions.
- Full end-user auth/authorization remains out of Phase A scope (noted as prerequisite for public live use).
