# Samuel Alderete · portfolio

The source of [saalderete.github.io/SamuelAlderete](https://saalderete.github.io/SamuelAlderete/).

Plain HTML, CSS and a little JavaScript, with no build step. GitHub Pages serves this folder as it is.

| Path | What it is |
|---|---|
| `index.html` | The portfolio: a pinned directory on the left, five aisles on the right |
| `inventory.html` | Everything built or shipped, on one table: what it is, where it was made, the stack, where to see it |
| `writing/` | Three technical write-ups drawn from the real code |
| `resume.html` / `resume.pdf` / `resume.md` | The résumé, as a page, as a one-page PDF and as plain text |
| `styles.css` | Every style on the site, including the articles and the 404 |
| `site.js` | Scroll-spy for the directory, the one-time sign flicker, the work light that follows the pointer, and the shutter of greetings that fades away on a first visit and on every refresh |
| `assets/` | Screenshots (demo data only), the favicon and self-hosted fonts |
| `PRODUCT.md`, `DESIGN.md` | Who the site is for, and the design system it follows |

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Update the résumé PDF

Edit `resume.html`, then print it to PDF from Chrome (Letter, margins "Default", background graphics on) and save over `resume.pdf`. Check that it is still one page.

## Fonts

Bodoni Moda for headings and Inter for text on the site, and Computer Modern Serif on the résumé. All three are under the SIL Open Font License 1.1 and self-hosted in `assets/fonts/`. The palette is Chrome (Future Black, Graphite, Chrome Silver and Frost White, with no hue) from the Nerrix design library, at night as the library draws it and by day on a frost ground.
