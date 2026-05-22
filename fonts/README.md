# Self-hosted fonts

Drop the **Bohemian Typewriter** font file here as one of:

- `BohemianTypewriter.ttf` (recommended)
- `BohemianTypewriter.otf`
- `BohemianTypewriter.woff2` (smaller, modern)
- `BohemianTypewriter.woff`

The `@font-face` declaration in [`../styles.css`](../styles.css) tries all
four paths in that order, so any of the formats works.

## How to get the file

1. Open https://typewriterfonts.net/font/bohemian-typewriter/
2. Click **Download** — you get a ZIP
3. Unzip; inside you'll find `BohemianTypewriter.ttf` (filename may
   vary — rename it to exactly `BohemianTypewriter.ttf` to match the CSS)
4. Copy it into this folder (`g:\project\zone14\fonts\`)
5. Commit + push:
   ```
   git add fonts/BohemianTypewriter.ttf
   git commit -m "Self-host Bohemian Typewriter"
   git push
   ```

Vercel redeploys in ~30 seconds and serves the font from the same domain.

## Until then…

The site is already trying to load Bohemian Typewriter via
**cdnfonts.com** in [`../index.html`](../index.html). If that public
CDN does host this font, it appears immediately with no download
needed. If not, the layout uses Courier Prime as a clean fallback
until the local file is dropped here.
