---
name: Samuel Alderete
description: A software engineer's portfolio stocked, labelled and priced like a well-run bilingual aisle, set in Chrome with no hue at all.
colors:
  accent: "#080808"
  accent-ink: "#f8fafc"
  ground: "#edf1f5"
  panel: "#ffffff"
  ink: "#080808"
  muted: "#4b5563"
  unlit: "#7e8895"
  rule: "#cbd5e1"
  rule-strong: "#4b5563"
  sign-ink: "#080808"
  sign-muted: "#4b5563"
  shutter: "#080808"
  shutter-ink: "#f8fafc"
  shutter-muted: "#cbd5e1"
  accent-dark: "#cbd5e1"
  accent-ink-dark: "#080808"
  ground-dark: "#080808"
  panel-dark: "rgba(31, 35, 40, 0.62)"
  ink-dark: "#f8fafc"
  muted-dark: "#a7b1be"
  unlit-dark: "#636465"
  rule-dark: "#393d41"
  rule-strong-dark: "#636465"
  sign-ink-dark: "#f8fafc"
  sign-muted-dark: "#a7b1be"
typography:
  display:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 1.5rem + 2.2vw, 3.3rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0"
  display-compact:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.3rem + 1.8vw, 2.8rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0"
  headline:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 0.95rem + 1.1vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
  price:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.1rem, 0.9rem + 0.7vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.05
  sign-number:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 0.95rem + 1.1vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 1
  title-article:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.25
  label-aisle:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.2
  label-aisle-compact:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.2
  aisle-number:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1
  aisle-number-compact:
    fontFamily: "Michroma, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.3
  lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum' 1"
  body-small:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label-sign:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.14em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  focus: "2px"
  panel: "6px"
spacing:
  chip-gap: "6px"
  row: "12px"
  sign-rule: "16px"
  sign-gap: "32px"
  shelf-gap: "44px"
  product-gap: "48px"
  gutter: "clamp(16px, 4vw, 48px)"
  column-gap: "clamp(32px, 5vw, 88px)"
  aisle-end: "clamp(64px, 10vh, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  link-chip:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
  aisle-sign:
    backgroundColor: "transparent"
    textColor: "{colors.sign-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "0 0 16px"
  aisle-sign-phone:
    backgroundColor: "{colors.ground}"
    padding: "14px clamp(16px, 4vw, 48px)"
  aisle-sign-hairline:
    backgroundColor: "{colors.rule}"
    height: "1px"
  aisle-sign-current:
    textColor: "{colors.sign-ink}"
  aisle-sign-hairline-current:
    backgroundColor: "{colors.accent}"
    height: "1px"
  aisle-sign-number:
    textColor: "{colors.unlit}"
    typography: "{typography.sign-number}"
  aisle-sign-number-current:
    textColor: "{colors.ink}"
  directory-number:
    textColor: "{colors.muted}"
    typography: "{typography.aisle-number}"
  directory-name:
    textColor: "{colors.muted}"
    typography: "{typography.label-aisle}"
  directory-number-current:
    textColor: "{colors.ink}"
  directory-name-current:
    textColor: "{colors.ink}"
  directory-chip:
    textColor: "{colors.muted}"
    typography: "{typography.label-aisle-compact}"
    height: "44px"
  price-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.price}"
  highlight-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  shelf-tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  product-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  product-picture:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.none}"
    width: "100%"
  loop-control:
    backgroundColor: "{colors.shutter}"
    textColor: "{colors.shutter-ink}"
    rounded: "{rounded.none}"
    padding: "0"
    size: "36px"
  loop-control-coarse:
    size: "44px"
  bin-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "12px 0"
  sku-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "3px 8px"
  was-price:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body-small}"
  was-price-now:
    textColor: "{colors.ink}"
    typography: "{typography.label-aisle}"
  more-link:
    textColor: "{colors.ink}"
  progress-line:
    backgroundColor: "{colors.accent}"
    height: "2px"
  inventory-row-hover:
    backgroundColor: "{colors.panel}"
---

# Design System: Samuel Alderete

## Overview

**Creative North Star: "The Well-Run Aisle, in Chrome"**

The site is a bilingual aisle held to signage discipline. A pinned directory on the left lists numbered aisles. Each section on the right opens under a full-width overhead sign: the aisle number, the English aisle name in a wide extended face, and its Spanish pair after it on the same baseline in small tracked capitals, all standing over one hairline. Work is stocked as shelf tags, product cards that open on a full-width picture over a spec list, a bin of smaller items, and price figures standing on one shelf edge. Nothing is boxed: items sit straight on the page, and type, rules, numbering and the bilingual pairs carry the metaphor. There are no props, no illustrations and no retailer colours or marks.

The palette is Chrome, from the Nerrix design library (dopely-fashion-brand-08): Future Black, Graphite Gray, Chrome Silver and Frost White, and no hue at all. Dark is the palette as the library draws it: Frost White type on a Future Black ground, Chrome Silver for primary actions and the lit rule. Light is its matching day version: Future Black type on Frost White with a quarter of the silver in it (`ground`), so the white work light still shows, and white for the highlight panel. Every word pair passes WCAG AA, with body pairs at 6.7:1 or better. Density is moderate and legible: a 17px Inter reading face, generous aisle breaks, and 1px rules. Hierarchy comes from the pairing. Michroma, at its one weight of 400, names things, and Inter reads, labels and acts.

There are two kinds of motion. The first, and the main idea, is the aisle lighting up. Sign numbers rest unlit. As you scroll, the current aisle's sign number lights to ink, the hairline under its sign lights to the accent, its directory row lights, and the first time you reach it the number flickers once like a fluorescent tube. When you reach for a shelf item (a fine pointer over it, or keyboard focus on its link) a soft panel fades up under it, and the rest of its shelf steps back to half strength (shelf focus). With a mouse or trackpad, a soft work light follows the pointer along the aisle floor, under the shelves: a white light by day, a faint cold silver light at night. Touch screens and reduced motion get no light. The aisle floor is still water under the shelves: with a mouse or trackpad the pointer leaves a soft wake, and a click on the floor (anywhere that isn't a link or a control) drops a ring that spreads out and fades. The work light catches the ripples, lighting each one on the side that faces the pointer in the light's own colours (`--ripple-lit`: white by day, cold silver at night) and shading the far side (`--ripple-shade`). A tap rings the floor on touch screens, but a finger leaves no wake, and reduced motion keeps the floor still. On the first visit of a session, and on every refresh, the store opens: a plain Future Black screen with Frost White lettering, in both schemes. "Hello" lights like a sign and holds a beat, then eleven more languages speed past (Hola, Olá, Bonjour, Hallo, Xin chào, Korean, Japanese, Mandarin, Hindi, Arabic and Navajo) to the store's own sign, Open with Abierto after it in Chrome Silver. Once the page has loaded (2.7 s at least, so Open holds about a second, and 3.8 s at most; a key, click, scroll or touch opens it at once) the shutter fades away over 700 ms while the page drifts up 40px into place, and the sign of the aisle you're in flickers on. It never shows for a link straight to a section, on a return from the inventory, or under reduced motion, but a refresh always shows it, even when the address names a section. A 2px accent line along the top edge fills as you scroll, so you always know how far down the page you are. The second kind is the work itself: KasaPro, Nerrix Digital, Gracias Por Invitar and KasaRentals each play a short muted screen-recording loop of the real product, and the visitor owns it, by scrolling and by a pause button. A loop plays only while at least 40% of it is on screen and pauses when it leaves, nothing loads until then, and reduced motion or Save-Data keeps its still. A pause the visitor chooses holds until they press play. Nothing else moves.

**Exception: the résumé page.** `resume.html` deliberately keeps the owner's own LaTeX résumé look: Computer Modern Serif (CMU Serif, self-hosted from `assets/fonts/cmu`), black on white, centered header, small-caps section rules, a Letter page with print margins. It sits outside the aisle system. Don't restyle it in aisle grammar, and don't borrow its serif, its small caps or its centered LaTeX header for aisle surfaces. Chrome's day scheme is black on a frosted white too, so the line between them is the type, not the colour.

**Key Characteristics:**
- Two self-hosted families: Michroma (one weight, 400) for naming, Inter (wght 400–800) for everything else. No width axes and no condensed type.
- Chrome: black, graphite, silver and white, with no hue. The accent always means "current", "primary" or "selected".
- Nothing boxed: no cards, no number boxes, no filled labels. Items sit on the page and a panel comes up only when you reach for one.
- Square everything except the highlight panel (6px): 0 radius, 1px rules, and a dashed 1px rule for receipts.
- Bilingual pairs on every aisle name: English first, Spanish after it on the baseline.
- Flat at rest. The only shadow belongs to the highlight panel, and the only gradient is the work light, which is light on the floor rather than paint on a surface. The floor ripples only where you touch it, and settles flat again.
- Light and dark follow `prefers-color-scheme`, and numerals are tabular everywhere.

## Colors

Chrome: four library values and a few mixes of them, so the page never introduces a hue.

### Primary
- **Chrome Accent** (`accent` / `accent-dark`): the lit hairline under the current sign and under the inventory and 404 signs, the primary button, the 2px underline on more-links and inventory links, text selection and the skip link. By day it is Future Black, the same as the ink. At night it is Chrome Silver.
- **Accent Lettering** (`accent-ink` / `accent-ink-dark`): text on an accent fill (the primary button, selection, the skip link). Frost White by day, Future Black at night.

### Neutral
- **Frost Ground** (`ground` / `ground-dark`): the page background, the phone sticky sign and the fill of SKU chips. By day it is Frost White with 25% Chrome Silver mixed in, so the white work light shows. At night it is Future Black.
- **White Panel** (`panel` / `panel-dark`): the highlight that comes up under a shelf item on hover or focus, and hovered inventory rows. White by day. At night it is Future Black with 35% Graphite, at 62% opacity over the ground.
- **Future Black Ink** (`ink` / `ink-dark`): body text, headings, prices, lit numbers, the focus outline and the panel's focus ring. It is also the fill of outline buttons on hover. At night it is Frost White.
- **Graphite Muted** (`muted` / `muted-dark`): home prose paragraphs, descriptions, dates, spec terms, captions, resting directory names and their Spanish halves, the was/now line and the scrollbar thumb. By day it is Graphite Gray (6.7:1 on the ground). At night it is Chrome Silver with 28% Graphite (9.2:1).
- **Unlit Graphite** (`unlit` / `unlit-dark`): a sign's number before its aisle lights. By day it is Graphite with 40% Silver, at night Future Black with 38% Frost White (#636465). It sits at 3.2:1 by day and 3.4:1 at night, which clears the 3:1 floor for the large sign numerals, and those numbers are hidden from screen readers. It is never used on words, or on the directory's numbers, which are part of their link's text and rest in Muted.
- **Silver Rule** (`rule` / `rule-dark`): the 1px hairline under a resting sign, the price channel's top rule, spec rows, table rows, product picture frames and SKU chip borders. By day it is Chrome Silver.
- **Graphite Rule** (`rule-strong` / `rule-strong-dark`): button and link chip borders, the top rule of spec lists, the inventory table's top and header rules, dashed receipt rules and a hovered product picture's frame.
- **Sign Lettering** (`sign-ink` / `sign-ink-dark`) and **Sign Subline** (`sign-muted` / `sign-muted-dark`): the English and Spanish text on a sign. They match ink and muted in both schemes.
- **Shutter** (`shutter`, `shutter-ink`, `shutter-muted`): the loading screen is Future Black with Frost White lettering and a Chrome Silver Spanish subline, the same in both schemes. The loop control borrows them: a Future Black plate at 72% with a Frost White icon and a 1px Frost White frame at 35%.

### Named Rules
**The No-Hue Rule.** Every value in the system is Future Black, Graphite Gray, Chrome Silver, Frost White or a mix of them. A hue, a tint, a gradient fill or a retailer's colour is never introduced.

**The Lit Rule.** "Current" is shown by light, not by inversion or a new colour. Sign numbers rest unlit and directory rows rest in Muted; the current aisle's sign number and its directory row light to ink, and the hairline under its sign lights to the accent. Inventory and 404 signs name the aisle you are in, so they are always lit.

## Typography

**Display Font:** Michroma (one weight, 400, self-hosted at `assets/fonts/michroma-latin.woff2` and preloaded on the home page, the inventory and the 404, with ui-sans-serif and system-ui as fallbacks)
**Body Font:** Inter (self-hosted at `assets/fonts/inter-latin.woff2`, with ui-sans-serif and system-ui as fallbacks)

**Character:** A wide extended sans does the naming the way an overhead shop sign would, and a plain neo-grotesque does the reading and the labelling. Michroma only ever appears at its one weight, 400, with no tracking and nothing synthesised bold, in the case the words are written in (title case for aisle names, sentence case for the bin heading), and never transformed to capitals.

### Hierarchy
- **Display** (`display`): the owner's name at the top of the directory, on two lines. It appears once per site. On laptops 820px tall or less it steps down to `display-compact`.
- **Headline** (`headline`): the English name on an overhead sign. The sign number (`sign-number`) is set at the same size.
- **Price** (`price`): the four About figures, in ink.
- **Title, article** (`title-article`): the "Also on the shelf" bin heading.
- **Aisle label** (`label-aisle`): English aisle names in the directory, and the "Built in-house" figure in the was/now line. In the phone row they use `label-aisle-compact`, with numbers at `aisle-number-compact`.
- **Aisle number** (`aisle-number`): directory numbers.
- **Title** (`title`): shelf-tag and product names in Inter, sentence case. The employer or status after the title drops to weight 500 in Graphite.
- **Lead** (`lead`): the first paragraph of an aisle, in ink. The directory's role line uses the same size at weight 600.
- **Body** (`body`): reading text, capped at 64ch in aisles, 68ch on the inventory and the 404, and 52ch at checkout. Home prose paragraphs after the lead are muted. Numerals are tabular site-wide.
- **Body small** (`body-small`): descriptions, buttons, spec lists, table text and the was/now line.
- **Sign subline** (`label-sign`; uppercase): the Spanish half of a sign, in Sign Subline.
- **Label** (`label`; uppercase, weight 600–700): dates on tags, spec terms, bin categories and table column heads. SKU chips use the same size without the uppercase.

### Named Rules
**The Two Voices Rule.** Michroma names things: the owner, aisles, sign numbers, prices, the bin heading and the "Built in-house" figure. Inter does everything else, including every button, chip, label, date and paragraph. Michroma is never used for running text, never set in capitals, never set at any weight but its one weight of 400, and never set below the 0.8125rem phone row label.

**The Bilingual Pair Rule.** Every aisle name comes as English and then Spanish. On signs, the Spanish runs after the English on the same baseline in Inter capitals (`label-sign`, tracked 0.14em) in Sign Subline, marked `lang="es"`. In the directory it sits underneath at 13px in Inter sentence case, and on phones it is dropped from the row. Spanish never sits above the English, and the sign never leaves it out.

## Layout

At 1024px and up the store has two columns, with a max-width of 1320px, a gutter of `gutter`, and a column gap of `column-gap`. The left column (minmax(300px, 0.82fr)) is the directory. It is sticky at full viewport height (100svh) and holds the name, the role, a one-line description, the numbered aisle list and, pushed to the bottom, the link chips and a fine-print line. The right column (1.18fr) is the floor. Aisles stack with `aisle-end` after each one and `sign-gap` under each sign. On laptops 820px tall or less, the directory tightens its padding and rows and scrolls internally, so the whole thing stays reachable.

Below 1024px the store collapses to one column. The directory becomes a header, and the aisle list becomes one plain wrapping row (a number and the English name, at least 44px tall, 20px apart) with no border or fill. Each overhead sign turns sticky at the top on a solid ground background and bleeds out to the viewport edges, and scroll padding is 76px. The price channel goes from four columns to two at 640px or less. Product cards stack at every width: the picture over the title, description and spec list, 18px apart, tightening to 14px at 720px or less. Shelf tags stack at 640px or less, with the date moving *under* the title.

The inventory and the 404 use a single 760px column with the same gutter (the inventory widens to 1080px). The inventory gets a top bar with home and résumé links, then the aisle's sign (static, not sticky) and a lead paragraph. The 404 opens straight on its sign.

Spacing comes from a handful of reused steps rather than a strict scale: `chip-gap` between chips, `shelf-gap` between shelf tags, `product-gap` between product cards, `row` above and below each bin row, and `sign-rule` between a sign's lettering and its hairline. Because items have no padding of their own, their highlight panel bleeds out past them: 16px above and below, and clamp(-24px, gutter × -0.75, -12px) to each side.

## Elevation & Depth

Flat at rest, with no cards. Depth comes from 1px rules and from the lit hairline. A surface appears only as a response: when a shelf tag, product card or bin row is hovered with a fine pointer, or a linked one gets keyboard focus, a highlight panel fades up underneath it over 200ms. The panel is the item's own `::before`, behind its content (z-index -1), with a 6px radius, the `panel` colour and the Panel shadow. Bin rows get the panel with no vertical bleed and at most 16px to each side. Keyboard focus adds a 2px ink ring to the panel in place of the outline. Linked items also nudge their arrow 2px up and to the right and press to scale(0.995).

### Shadow Vocabulary
- **Panel, day** (`box-shadow: 0 1px 2px rgba(8, 8, 8, 0.06), 0 12px 28px -14px rgba(8, 8, 8, 0.24)`): a soft two-layer drop under the white panel.
- **Panel, night** (`box-shadow: inset 0 1px 0 rgba(203, 213, 225, 0.1), 0 12px 28px -14px rgba(0, 0, 0, 0.8)`): a 1px Chrome Silver top edge at 10% plus a soft drop.
- **Panel focus ring** (`box-shadow: var(--shadow), 0 0 0 2px var(--ink)`): keyboard focus on a linked shelf item.
- **Focus outline** (`outline: 2px solid ink; outline-offset: 3px; border-radius: 2px`): every other focusable element. There is no accent halo.

### Named Rules
**The Panel Rule.** Nothing has a surface at rest. A panel comes up under an item only when you reach for it, by opacity alone, and keyboard focus gets the same panel with an ink ring. Items never move up, never gain a border, and never keep the panel once you leave.

## Shapes

Square stock: every corner is 0, with one exception, the 6px highlight panel. The focus outline takes the `focus` rounding. One line weight governs the system: 1px rules for sign hairlines, the price channel's top edge, dividers, chip and button outlines, spec rows and table rows. The **receipt tear** (1px dashed Graphite Rule) opens the checkout footer and the end note on the inventory. Product pictures, screenshots and loops alike, run full width inside a 1px Silver Rule frame at 16:9, cropped from the top left.

**The One Line Rule.** Rules are 1px. The only heavier lines are 2px and in the accent: the underline on more-links and inventory links, and the progress line along the top edge. There are no double borders and no rails.

## Components

### Buttons
Blunt, square and self-explanatory.
- **Shape:** square (0) with a 1px Graphite Rule border, an 18px authored SVG icon before the label, and Inter at weight 700 (600 for the directory link chips).
- **Primary:** accent fill and border with Accent Lettering: Future Black with Frost White by day, Chrome Silver with Future Black at night. There is one per group: Résumé in the directory, email at checkout, and "Back to the portfolio" on the 404.
- **Outline:** a transparent fill with ink text. On hover with a fine pointer it fills ink and its text turns the ground colour.
- **Focus:** the 2px ink outline at 3px offset.
- **Press:** scale(0.97) over 160ms on the standard ease-out.
- **Sizes:** checkout "till" buttons at 14px 18px, and directory link chips at 9px 12px in body-small.

### Navigation (the directory)
- Numbered rows with no rules and no boxes: a 2.5rem column for the Michroma number and a two-line label, the English aisle name in Michroma and the Spanish underneath in 13px Inter, 8px apart top and bottom.
- **Rest:** number and name in Muted (the number is part of the link's text, so it keeps full text contrast). **Hover** (fine pointer) and **Current** (`aria-current="true"`, set by the scroll-spy): the number and the English name light to ink over 200ms.
- **Mobile:** a plain wrapping row of number and English name pairs, 44px tall, with no border or fill.

### Aisle Sign (signature)
The overhead sign that opens every aisle and every secondary page. It is unboxed: the number at the headline size, the English name in Michroma 400 and the Spanish subline in Inter caps after it on the baseline, 18px apart, over one 1px Silver Rule hairline 16px below. **Current:** the number lights from unlit to ink and the hairline lights to the accent, over 240ms. The first arrival flickers the number only, a one-time 300ms stepped flicker (opacity 1, 0.55, 1, 0.8, 1), skipped under reduced motion. On phones the sign is sticky on a solid ground background. On the inventory and the 404 the sign is static, always lit, and names the aisle you're in (03 Inventory / Inventario; 404 Not on the shelf / No está aquí).

### Price Channel (signature)
Four plain Michroma figures in ink, standing on one 1px Silver Rule with 20px above them, each with a short body-small description in Graphite underneath. There are no fills, no cell dividers and no rail.

### Was / Now Line
A plain body-small line in Graphite at weight 600. The old item is struck through (1px, weight 500), followed by "Built in-house" in Michroma ink at the aisle-label size and a short saving. It is used only where a real replacement happened.

### Shelf Tag, Product Card
- **Shared:** no fill, border or padding. They sit on the page, spaced by `shelf-gap` (tags) or `product-gap` (products), and take the highlight panel on hover and, when linked, on keyboard focus. A linked item has a 14px arrow icon after its title.
- **Shelf tag:** a 128px date column (label style) and a body column, 24px apart.
- **Product card:** one column that opens on its picture, full width at 16:9 in a Silver Rule frame, above the title, description and spec list, 18px apart (14px at 720px or less). The picture is a screenshot, or for KasaPro, Nerrix Digital, Gracias Por Invitar and KasaRentals a short muted loop (9.4 s, 960x540 H.264, `preload="none"`, a still poster from its first frame). A hovered product's frame turns Graphite Rule. The panel, the arrow nudge and shelf focus follow the whole list item (`.products > li:hover`), so they hold while the pointer is on the loop control. Inside is a **spec list**: a two-column term/value grid with a Graphite Rule on top and Silver Rules between rows, with terms in label style.

### Loop Control
The pause/play button every loop carries, added by `site.js` (`.vid-toggle`). It sits 10px in from the picture's top right corner but outside the card's link, so pressing it never follows the link. It is a square plate in the shutter colours, 36px (44px on coarse pointers): Future Black at 72% with a 14px Frost White pause or play icon and a 1px Frost White frame at 35%, and no shadow. It rests at 0.8 opacity and comes up to full on hover of its card or on keyboard focus, over 160ms, presses to scale(0.94), and takes the standard focus outline. Its spoken label names the action and the product ("Pause the KasaPro preview", "Play the KasaPro preview"). A pause the visitor chooses holds through scrolling away and back until they press play.

### SKU Chips
Small tech and scope tags: label-size Inter at weight 600 (not uppercase), 3px 8px, with a 1px Silver Rule border, filled with the ground colour. They have no states.

### Bin
A list of secondary stock with no rules, under a Michroma `title-article` heading. Each row has `row` padding above and below, a bold Inter name, a right-aligned uppercase category label and a muted one-line description. Rows take the panel on hover, and linked rows underline the name.

### More-link
A weight-700 inline link with a 2px accent underline and an arrow icon. On hover the underline turns ink and the arrow nudges 2px up and to the right. It never fills. Inventory links follow the same pattern.

### Page Furniture (inventory and 404)
- **Table base:** the single-column pages give any table a 1px Graphite Rule along its top, body-small text and Silver Rule rows. The inventory's table is the one that uses it, and the Inventory Table section below covers the rest.
- **End note:** a dashed receipt rule 48px below the content, over muted body-small, with its links at weight 600. The inventory ends on one.

### Inventory Table
No fill, 1px Silver Rule rows under a Graphite header rule, set 12px wider than the column on each side so its text lines up with the page. A hovered row takes the panel colour over 200ms while the rest of the table steps back to half strength. At 860px or less each row becomes a stacked entry with labelled fields.

### Icons
Authored inline SVG symbols on a 16px viewBox. Drawn icons use a 1.5–1.6 stroke with square caps and mitred joins, and the GitHub and LinkedIn marks are solid fills. They render at 18px in buttons and 14px for the "go" arrow.

## Do's and Don'ts

### Do:
- **Do** open every aisle and every secondary page with an unboxed aisle sign: the number at the headline size, the English name in Michroma 400 and the Spanish pair after it in tracked Inter capitals, over one 1px hairline.
- **Do** show "current" by light: the sign number from unlit to ink and the directory row from Muted to ink, the hairline from Silver Rule to the accent, driven by scroll position, with a one-time number flicker that respects reduced motion.
- **Do** set figures as plain Michroma in ink, and keep tabular numerals on.
- **Do** use the `accent-ink` token for text on every accent fill, in both colour schemes.
- **Do** keep Michroma at its one weight, 400, for naming roles only, and set everything else in Inter.
- **Do** let shelf items sit on the page with no fill, border or padding, and bring the 6px highlight panel up under them on fine-pointer hover and on keyboard focus of a linked item, by opacity over 200ms, with a 2px ink ring for the keyboard.
- **Do** quiet the rest of a shelf (experience tags, product cards, bin rows, inventory rows) to 0.5 opacity while one item has the pointer or keyboard focus, over 220ms.
- **Do** keep the shutter to the first visit of a session and to refreshes, under 3.8 s, skippable by any key, click or scroll, and absent for links straight to a section and for reduced motion (`index.html` head script, `.shutter`, `site.js`).
- **Do** open the links that leave the portfolio (live sites, GitHub, LinkedIn) and the PDF résumé in a new tab, with `rel="noopener"` and the page's hidden "Opens in a new tab" description, so the portfolio stays open behind them. In-page aisles, email and the portfolio's own pages (the inventory) open where you are.
- **Do** keep the work light under the shelves, moved by transform only, for fine pointers only, and off under reduced motion (`site.js`, `.worklight`, token `--lamp`).
- **Do** keep the floor ripples under the shelves and over the work light, in the work light's colours (tokens `--ripple-lit`, `--ripple-shade`): a wake for a mouse or trackpad, a ring for a click or tap that misses every link and control, drawn on the GPU only while there are ripples and hidden five seconds after the last, and off under reduced motion, forced colours and print (`site.js`, `.ripples`).
- **Do** keep product loops muted, playing only while at least 40% of one is on screen, still under reduced motion and Save-Data, and always pausable with the loop control, where a chosen pause holds until play (`site.js`, `.vid-toggle`).
- **Do** keep corners square and rules at 1px, with the 6px panel, the 2px accent underline and the dashed receipt rule as the only exceptions.
- **Do** draw icons as inline SVG on the 16px grid with square caps.

### Don't:
- **Don't** add a hue, a tint, a gradient fill, or any real retailer's colours or marks. The work light is the one radial gradient, and it stays a light, not a surface.
- **Don't** use cartoon props, illustrations or hardware clip-art. The aisle is carried by type, rules, numbering and bilingual pairs.
- **Don't** set a kicker or eyebrow label above a heading. The Spanish pair runs after the English on the sign's baseline, and on phones dates move under the title.
- **Don't** set Michroma in capitals, in running text, or at any weight other than 400, and never let it be synthesised bold.
- **Don't** bring back condensed type or width-axis hierarchy.
- **Don't** put boxes, fills or cards around numbers, headings, figures or shelf items, or bring back the 3px rail.
- **Don't** lift items, move them up on hover, or give anything a shadow at rest. The panel's shadow is the only one.
- **Don't** round anything other than the highlight panel and the focus outline.
- **Don't** put sound, customer data or a phone number in a product loop, or ship a loop without its pause button. KasaPro's loop shows no customer data, and the phone number in KasaRentals' header is blurred.
- **Don't** use Unicode glyphs or emoji as icons.
- **Don't** use Computer Modern, small caps or the centered LaTeX header outside the résumé page.
