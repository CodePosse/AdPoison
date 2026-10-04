<p align="center">
  <img src="assets/img/icon-192.png" alt="Ad Poison sugar skull mascot" width="96" height="96">
</p>

<h1 align="center">Ad Poison</h1>

<p align="center"><strong>Scramble your ad profile.</strong> Decoy browsing, hosts-file blocking, private DNS picks and ad ID reset guides, in a retro 8-bit static site.</p>

<p align="center"><a href="https://codeposse.github.io/AdPoison/"><strong>Live site: codeposse.github.io/AdPoison</strong></a></p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-ffd23f?style=flat-square">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2ec4b6?style=flat-square">
  <img alt="Dependencies: none" src="https://img.shields.io/badge/dependencies-0-7bd389?style=flat-square">
  <img alt="Node 22+" src="https://img.shields.io/badge/node-%3E%3D22-ff9f1c?style=flat-square&logo=node.js&logoColor=white">
  <img alt="Static site" src="https://img.shields.io/badge/hosting-static-b18cff?style=flat-square">
  <img alt="WCAG 2.2 AA target" src="https://img.shields.io/badge/WCAG_2.2-AA-ff5c9d?style=flat-square">
  <img alt="Trackers on this site: 0" src="https://img.shields.io/badge/trackers-0-1a0f1f?style=flat-square">
</p>

---

## What it does

| Move | Page | What you get |
| --- | --- | --- |
| **Noise** | `index.html#generator` | A chaff generator that browses as a fake persona (or pure chaos) at jittered intervals. |
| **Block** | `html/hosts.html` | A hosts-file builder (copy or download), one-line install commands per OS, flush DNS commands, links to maintained lists for Pi-hole. |
| **Block** | `html/dns.html` | Free and paid private DNS comparison (AdGuard, Mullvad, Control D, NextDNS, Quad9, Pi-hole...) with setup steps per device. |
| **Reset** | `html/reset.html` | A saved checklist to delete advertising IDs and turn off personalization at Google (including the [My Ad Center hard link](https://myadcenter.google.com/personalizationoff?n=true)), Meta, Amazon, Microsoft and more. |
| **Reset** | `html/hygiene.html` | A weekly scrub checklist, per-browser settings, extensions, and auto-clear policies (Firefox `policies.json`, Chrome `.reg`). |

The site itself has no analytics, no cookies, no third-party requests (fonts are self-hosted), and a strict Content Security Policy.

## How the chaff generator works

Pressing **Start** (a real click, so popup blockers allow it) opens one extra window, and the page steers it to decoy searches.

- **Full visits** (Bing, Amazon, Etsy, Wikipedia, DuckDuckGo): the window loads the page like normal browsing, with your first-party cookies.
- **Background pings** (Google, YouTube, Google News): these sites send `Cross-Origin-Opener-Policy`, which cuts the opener's link to the window as soon as it lands there. This was verified in Chrome: control survives Wikipedia, Amazon and Bing, and is lost on Google. So these hops are sent as hidden, sandboxed iframe requests. They count toward your profile only if your browser allows third-party cookies.
- Timing gets ±40% jitter. A Web Worker keeps the timer running while the tab is in the background, and sessions stop on their own after the duration you pick.
- **Persona mode** sticks to one coherent fake identity, which is harder to filter out than random noise. Personas live in `assets/utils/wordbank.js`, so you can add your own.

## Project structure

```
.
├── index.html               # Home + chaff generator
├── 404.html
├── html/                    # Sub pages
│   ├── hosts.html
│   ├── dns.html
│   ├── reset.html
│   ├── hygiene.html
│   └── privacy.html
├── assets/
│   ├── css/main.css         # Single shared stylesheet (tokens, components, print, reduced motion)
│   ├── js/
│   │   ├── main.js          # Nav, copy buttons, Web Share, checklists, mascot
│   │   ├── chaff.js         # Generator engine
│   │   └── hosts.js         # Hosts-file builder
│   ├── utils/
│   │   ├── helpers.js       # window.AP: storage, toast, clipboard, download, crypto random
│   │   ├── wordbank.js      # Personas and query words
│   │   └── blocklists.js    # Curated tracker host groups
│   ├── img/                 # Generated pixel art, icons, OG image
│   └── fonts/               # Press Start 2P + VT323 (SIL OFL), self-hosted
├── scripts/
│   ├── build-images.mjs     # Regenerates all images from pixel maps (zero deps)
│   └── set-domain.mjs       # Swaps the placeholder domain everywhere
├── index.js                 # Zero-dependency dev server (applies _headers)
├── _headers                 # Security headers for Netlify / Cloudflare Pages
├── .nojekyll                # Tells GitHub Pages to skip Jekyll
├── robots.txt · sitemap.xml · site.webmanifest · humans.txt · .well-known/security.txt
├── package.json · package-lock.json
└── README.md
```

All scripts are classic (non-module) files, so pages also work when opened straight from disk. Shared CSS and JS are separate files that any new page can reference.

## Run locally

```bash
npm start          # http://localhost:8080
npm run dev        # same, restarts on changes to index.js
```

No `npm install` needed: there are no dependencies.

## Deploy

### GitHub Pages (current setup)

The site is configured for **https://codeposse.github.io/AdPoison/**.

1. GitHub Pages paths follow the repository name and are case-sensitive. The repo is currently `CodePosse/AdPoison`, which would publish at `/AdPoison/`. To get the lowercase URL, rename the repo to `adpoison` (**Settings → General → Repository name**). GitHub redirects the old remote URL.
2. **Settings → Pages → Build and deployment**: set Source to *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Push. The site is live in a minute or two.

Notes for GitHub Pages:
- `.nojekyll` turns off Jekyll, so `.well-known/` and `_headers` get published.
- GitHub Pages ignores `_headers`, so every page also carries a `<meta http-equiv="Content-Security-Policy">`. Clickjacking protection (`frame-ancestors`) can't be set from a meta tag, so it only applies on hosts that honor `_headers`.
- Crawlers only read `robots.txt` and `security.txt` at the host root (`codeposse.github.io/`), not under `/AdPoison/`. Submit `https://codeposse.github.io/AdPoison/sitemap.xml` in Google Search Console instead.
- `404.html` uses absolute URLs, so it's styled correctly at any missing path under the project.

### Moving to another domain later

```bash
npm run set-domain -- https://your-domain.com
```

This rewrites canonical URLs, Open Graph and Twitter tags, JSON-LD, the 404 page, `sitemap.xml`, `robots.txt`, `humans.txt` and `security.txt`. The current domain is recorded in `.domain`, so it's safe to re-run.

- **Netlify / Cloudflare Pages**: publish the repo root with no build command. `_headers` and `404.html` are picked up automatically.
- **Apache / Nginx**: serve the folder and copy the headers from `_headers` into your config.

## SEO and accessibility checklist

- Unique `<title>`, meta description and canonical URL on every page
- Open Graph and Twitter `summary_large_image` cards with a 1200×630 PNG
- JSON-LD: `WebSite`, `WebApplication`, `FAQPage`, `HowTo`, `ItemList`, `BreadcrumbList`
- `sitemap.xml`, `robots.txt`, web app manifest, SVG and PNG icons
- Web Share API with a copy-link fallback
- WCAG: skip link, landmarks, labelled controls, visible focus, `aria-live` status updates, AA-contrast palette, 48px touch targets, `prefers-reduced-motion` support, `noscript` fallbacks, print stylesheet

## Customise

- **Mascot and images**: edit the pixel maps in `scripts/build-images.mjs`, then run `npm run build:images`.
- **Personas**: add entries to `assets/utils/wordbank.js`.
- **Hosts groups**: add groups or hosts to `assets/utils/blocklists.js`. Use `breaks` to warn about side effects.
- **Colours**: edit the tokens at the top of `assets/css/main.css`.

## Credits and inspiration

[Chaff](https://github.com/immutabledev/chaff) · [TrackMeNot](https://trackmenot.io/) · [AdNauseam](https://adnauseam.io/) · [StevenBlack/hosts](https://github.com/StevenBlack/hosts) · [AmIUnique](https://amiunique.org/) · [EFF Cover Your Tracks](https://coveryourtracks.eff.org/)

Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [VT323](https://fonts.google.com/specimen/VT323), both under the SIL Open Font License.

## Disclaimer

For information only, not legal advice. Ad Poison doesn't click ads or touch anyone else's accounts. Use it on your own devices and accounts. Not affiliated with any company mentioned.

## License

[MIT](LICENSE)
