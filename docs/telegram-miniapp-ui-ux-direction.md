# Telegram Mini App — Loan Application UI/UX Direction

## Design objective
Make the applicant flow feel like a calm, trustworthy banking app, not a collection of cards. The experience must be designed for Telegram's phone viewport first; desktop is secondary. This is the direction for the separate UI work, not a claim that every screen has already been redesigned.

## Visual language
- Primary: deep teal/emerald used for key actions, selected states and progression.
- Canvas: neutral near-white in light mode; deep green-charcoal in dark mode.
- Surfaces: white/charcoal cards with subtle borders, consistent radius and very limited elevation.
- Accent: muted champagne/amber for informative highlights and warnings; not used as a second primary.
- Semantic: readable green success, amber warning, red errors; never use neon.
- Typography: Inter plus Noto Sans Bengali, consistent line height, sentence-case labels and readable 14–16px body controls.
- Surfaces and text must meet comfortable contrast in both themes. The selected state must not rely on color alone.

## Telegram/mobile layout rules
- One-column page canvas at phone width, width 100%, `min-width: 0`, no fixed desktop-width side gutter.
- Use 12–16px horizontal page gutters on 320–360px screens; increase gradually on larger screens. Bound wider form content around 720–760px.
- Form fields fill available width, use at least 44px control height, and avoid horizontal scrolling.
- Respect `env(safe-area-inset-*)`; keep primary actions above the persistent bottom navigation and keyboard.
- Consistent card padding (16px base), radius (14–18px) and spacing scale (4/8/12/16/24), not large uncontrolled empty gaps.
- Do not use glassmorphism, neon gradients or large shadows.
- Bengali and English must wrap naturally without clipping, overflow or shrinking important labels.

## Applicant journey
Recommended six clear stages:
1. **Loan choice** — select category, with a short category-specific note.
2. **Amount & tenure** — amount packages/custom amount, tenure, calculation basis and fee/deposit preview.
3. **Identity & contact** — name, NID, date of birth, gender and contact details.
4. **Address & family** — current/permanent address, nominee and applicable guardian/co-applicant details.
5. **Profession, income & banking** — conditional occupation/business/student/expat/medical details and bank fields; hide irrelevant options when a profession is selected.
6. **Documents, review & submit** — required/optional file groups, missing-item checklist, complete application summary and declaration. The final Review state must be a separate substate before the submit action, not an immediate submit from the document uploader.

The current code has four data-entry views (category, amount/tenure, combined applicant details, documents), a separate final review/consent view, and a success view. This PR corrects the progress counter to five actionable stages and adds the final review before submit. Applicant identity/address/profession fields are still combined in one large view; splitting them into the target six-stage journey and extracting maintainable components remains the next UI iteration. Most of the flow is still concentrated in a ~286 KB `ApplyLoan.tsx`.

## Implementation order
1. Normalize responsive page canvas, mobile gutters, safe-area actions and body-control sizes.
2. Make the displayed progress indicator match the five actionable stages (four data-entry views plus final review) and keep success outside the step count.
3. Split the giant ApplyLoan component into step components while retaining the server-side field allowlists and validations.
4. Integrate resumable drafts and normalized documents after the database migration history is reconciled (issue #20; applicant model in PR #23).
5. Split the combined applicant details view into distinct Identity/Contact, Address/Family and Profession/Income/Banking stages; align the complete journey with six clear stages.
6. Apply the same semantic token system to Home, Loan Categories, My Loans, Profile and Admin in controlled screen-by-screen batches.

## Manual visual QA (no paid TestSprite)
- Telegram Android viewport at 320px, 360px, 390px and 430px CSS widths.
- Light mode and dark mode, Bangla and English.
- Category cards, amount chips and duration choices align without clipping or enormous gaps.
- Keyboard open/close leaves the focused input and bottom action visible.
- Long Bengali labels, inline errors, upload progress and missing-document messages wrap correctly.
- Back/Next, smart confirmation, submit success/error, and revision flow work without data loss.
- Bottom navigation does not cover submit buttons; safe areas respected on phone devices.

The user will test the preview manually and report screen-by-screen issues. No paid end-to-end test service is a project requirement.
