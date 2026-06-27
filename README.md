# Zone14 — World Cup 2026 Jerseys

Premium FIFA World Cup 2026 football jersey store for Bangladesh.
Static site (pure HTML/CSS/JS) with WhatsApp-driven checkout — no backend
required to launch.

**Live demo:** _coming soon_

---

## What's included

- **Landing page** — hero countdown, jersey grid, star players,
  match hub, group standings, host stadiums, reviews, FAQ, newsletter.
- **Order page** — full checkout flow with cascading
  Division → District → Thana address picker (all 8 BD divisions),
  payment selector, promo codes, free-shipping bar, custom name &
  number print.
- **Admin dashboard** — passcode-gated (`zone14admin`) localStorage
  order viewer with status updates, KPI cards, one-click WhatsApp
  confirmations, JSON export.
- **3D Size Visualizer** — Three.js mannequin that drag-rotates 360°
  and scales to the selected jersey size.
- **Quick View modal** — photo gallery (up to 4 per jersey) + optional
  video player + product details.
- **Static pages** — About, Contact, Privacy, Terms, Shipping, Refund.
- **SEO** — sitemap.xml, robots.txt, JSON-LD store schema, Open Graph
  + Twitter Card meta.
- **PWA** — manifest.json so customers can "Add to Home Screen".

## Tech

Pure HTML, CSS, and JavaScript. No build step, no npm dependencies.
- Real country flags from [flagcdn.com](https://flagcdn.com)
- Google Fonts: Bebas Neue + Inter

## Repo layout

```
zone14/
├── index.html          # Landing page
├── order.html          # Checkout
├── admin.html          # Admin dashboard (passcode: zone14admin)
├── about.html
├── contact.html
├── privacy.html · terms.html · shipping.html · refund.html
│
├── styles.css          # All styles
├── data.js             # Jerseys, players, matches, locations, helpers
├── script.js           # Landing-page interactions
├── order.js            # Checkout logic
├── admin.js            # Admin dashboard logic
│
├── images/             # Product photos (see images/README.md)
├── videos/             # Product videos (see videos/README.md)
├── logo/               # Brand assets + favicon
│
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap
└── robots.txt          # Search-engine instructions
```

## Local preview

Double-click `index.html` to open it in your browser. For best results
(especially for the 3D viewer and product photos that ship from a real
domain), serve via any static host:

```bash
python -m http.server 8080
# then visit http://localhost:8080
```

## Deploy

Push to `main` and the repo is ready for:

- **GitHub Pages** — Settings → Pages → Source: `main / root`
- **Vercel** — Import the repo, no config needed
- **Netlify** — Drag-drop or connect the repo
- **Cloudflare Pages** — Connect the repo, no build command

## Going to market

See `images/README.md` and `videos/README.md` for what assets to drop
where. Search the repo for `TODO` and `YOUR_PIXEL_ID` / `G-XXXXXXXXXX`
to find the analytics placeholders.

---

© Zone14 · Built in Dhaka
