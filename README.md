# noprofits.org

The project hub for **noprofits.org** — open tools that make nonprofit money
legible. Served at [www.noprofits.org](https://www.noprofits.org/) via GitHub
Pages. The person behind it is [Peter V. Johnston](https://pvjohnston.com).

This repository is the **landing site** only. It's a single, dependency-free
static page: selected tools, mission, resources, metrics, and links out to
the apps and writing that live on their own subdomains.

## What's here

A hand-written static site — no build step, no framework, no package manager.
Open `index.html` in a browser and it runs.

| File | Purpose |
| --- | --- |
| `index.html` | The whole site — a tabbed single page (Home, Writing, Mission, Resources, Metrics, Contact). |
| `styles.css` | Site-specific layer (tab routing, hero, feature cards) over the shared theme. |
| `noprofits-theme.css` / `noprofits-theme.js` | Vendored shared design system (chrome, buttons, tokens, dark/light). |
| `nonprofits.js` | Tab routing, theme toggle, mobile nav, `#resume` redirect to pvjohnston.com, and the live blog feed on the Writing tab. |
| `fonts/`, `*.svg`, `og-image.png` | Self-hosted fonts, icons, brandmark, and social card. |
| `CNAME`, `_headers` | GitHub Pages custom domain and response headers. |

## The tools it links to

The transparency tools are **separate projects** with their own repos and
subdomains — this site just points at them:

- **Search** ([search.noprofits.org](https://search.noprofits.org)) — look up any
  U.S. nonprofit's mission, Form 990 financials, and efficiency metrics.
  Repo: [`noprofits-org/search`](https://github.com/noprofits-org/search).
- **Grants** ([grants.noprofits.org](https://grants.noprofits.org)) — interactive
  map of how grant funding moves between organizations, grantor to grantee.
  Repo: [`noprofits-org/grants`](https://github.com/noprofits-org/grants).
- **Blog** ([blog.noprofits.org](https://blog.noprofits.org)) — field notes on
  nonprofit data, automation, and the command line (Hakyll, with LaTeX/TikZ).
  Repo: [`noprofits-org/blog`](https://github.com/noprofits-org/blog).

## Local development

No tooling required:

```sh
# open directly…
open index.html

# …or serve locally so root-relative paths (/favicon.svg, /fonts/…) resolve
python3 -m http.server 8000   # then visit http://localhost:8000
```

Serving over HTTP (rather than `file://`) is recommended so the absolute asset
paths and the blog feed fetch behave the same as in production.

## Deployment

Pushing to `main` publishes to GitHub Pages automatically. The custom domain is
configured in `CNAME` (`noprofits.org`).

## License

BSD-3-Clause.
