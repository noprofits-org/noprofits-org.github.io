# Direction

Working notes on where this site is headed. Written 2026-07; the split below is
decided in principle, the mechanics are deferred.

## Decision: split "person" from "project" across two domains

The core sorting principle is **person vs. project** (not topic):

- **`pvjohnston.com` → Peter Johnston (the person).**
  Portfolio + résumé, framed around the through-line that runs across every role
  so far: *drops into a complicated domain and builds the systems that make it
  legible and fast* (chemistry → hazmat classification → automation →
  construction platform → nonprofit tools). Plus personal and **chemistry**
  writing. Reuses the existing Hakyll toolchain, which already handles
  LaTeX/BibTeX/TikZ — purpose-built for chemistry posts.

- **`noprofits.org` → the project (the brand).**
  The tools (search, grants), mission / resources / metrics, and nonprofit-domain
  field notes. Brand-first, not person-first.

- **`hyperpolarizability.com`** (already owned, currently an archived repo) —
  optional dedicated home for the chemistry writing if a distinctly academic URL
  is wanted; otherwise `pvjohnston.com/chemistry` is fine.

- **Cross-link both ways:** pvjohnston.com features noprofits.org as a flagship
  project; noprofits.org credits "built by Peter Johnston → pvjohnston.com".

## `pvjohnston.com` setup decisions

- **Hosting: under the existing `noprofits-org` GitHub account** (a `pvjohnston.com`
  repo + CNAME), not a separate personal account — to avoid account juggling.
  Trade-off accepted: the repo owner reads as `noprofits-org`, a minor
  person/project blur, but it's cosmetic and reversible (repos transfer later).
  To keep the split legible, point any "see the code" links at the specific
  repos or the profile, not at "the org."
- **Contact email: `peter@pvjohnston.com`, a free forwarding alias → `pvjohnst@gmail.com`.**
  Branded and consistent with `peter@noprofits.org`, keeps the personal gmail
  private, and needs no second mailbox — registrars offer forwarding-only aliases
  for free. (Avoid publishing the raw gmail: it exposes the personal address and
  `pvjohnst` doesn't match the `pvjohnston.com` domain.)

## Consequence for this repo

The portfolio-first reframe currently on this branch (person-first hero,
promoted Résumé tab, print-résumé) is **interim**. Once `pvjohnston.com` exists,
the personal material moves there and `noprofits.org` flips back to
**project-first** (drop the full CV, restore the tool focus). Nothing is wasted —
the hero copy, résumé markup/CSS, and print stylesheet port straight over. It's a
move, not a rebuild.

## Deferred next steps

1. Register `pvjohnston.com` (cheap + available as of this writing).
2. Set up the free forwarding alias `peter@pvjohnston.com` → `pvjohnst@gmail.com`
   at the registrar.
3. Create the `pvjohnston.com` repo under `noprofits-org` (+ CNAME) and enable Pages.
4. Scaffold `pvjohnston.com` reusing this repo's theme — portfolio + résumé +
   chemistry blog section.
5. Split the blog: chemistry / personal → the personal site; nonprofit data,
   automation, CLI field notes → `blog.noprofits.org`.
6. Refocus this repo (`noprofits.org` www) back to project-first and relocate the
   résumé.
