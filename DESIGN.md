---
name: Samuel Alderete
description: A software engineer's portfolio stocked, labelled and priced like a well-run bilingual hardware-store aisle.
colors:
  lime: "#c6ff34"
  lime-ink: "#171717"
  lime-muted: "#3c4a12"
  ground: "#f2f3ee"
  shelf: "#ffffff"
  ink: "#171717"
  muted: "#4a4e46"
  rule: "#d3d6cc"
  rule-strong: "#171717"
  sign: "#171717"
  sign-ink: "#f2f3ee"
  sign-muted: "#a9ada0"
  ground-dark: "#121311"
  shelf-dark: "#1b1d19"
  ink-dark: "#eef0e8"
  muted-dark: "#b0b4a8"
  rule-dark: "#2e312b"
  rule-strong-dark: "#eef0e8"
  sign-dark: "#30332b"
  sign-ink-dark: "#eef0e8"
  sign-muted-dark: "#9da196"
  sign-edge-dark: "#464a3f"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 2rem + 3.4vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 75"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 75"
  headline-article:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 75"
  price:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.3rem + 1.4vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 75"
  title-article:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    fontVariation: "'wdth' 87.5"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.3
  lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum' 1"
  body-small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label-sign:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 87.5"
  label-aisle:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    letterSpacing: "0.03em"
    fontVariation: "'wdth' 75"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.06em"
  code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0px"
spacing:
  chip-gap: "6px"
  stack: "12px"
  inset: "18px"
  sign-gap: "32px"
  gutter: "clamp(16px, 4vw, 48px)"
  column-gap: "clamp(32px, 5vw, 88px)"
  aisle-end: "clamp(64px, 10vh, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
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
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "14px 18px 14px 14px"
  aisle-sign-current:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
  aisle-sign-number:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    height: "56px"
    width: "64px"
  aisle-sign-number-current:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.lime}"
  directory-number:
    textColor: "{colors.ink}"
    typography: "{typography.label-aisle}"
    width: "44px"
    height: "36px"
  directory-number-current:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
  price-label:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    typography: "{typography.price}"
    padding: "4px 8px 2px"
  shelf-tag:
    backgroundColor: "{colors.shelf}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px 20px 20px 18px"
  product-card:
    backgroundColor: "{colors.shelf}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "18px"
  sku-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "3px 8px"
  was-price:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    typography: "{typography.body-small}"
    padding: "6px 10px"
  code-block:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.code}"
    padding: "16px 18px"
  callout:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    padding: "14px 18px"
---

# Design System: Samuel Alderete

## Overview

**Creative North Star: "The Well-Run Aisle"**

The site is a bilingual hardware-store aisle held to signage discipline. A pinned directory on the left lists numbered aisles; each section on the right opens under a full-width overhead sign with a lime number box, an English name in heavy condensed capitals and its Spanish pair after it on the same baseline. Work is stocked as shelf tags, product cards with spec labels, a bin of smaller items, and lime price labels hanging from a heavy shelf rail. The metaphor is carried only by type, rules, numbering and bilingual pairs. There are no props, no illustrations and no retailer colours or marks.

Density is moderate and legible: a single 17px reading face, generous aisle breaks, and hard 1px rules that every tag, sign and table snaps to. Hierarchy comes from Archivo's width axis rather than from extra families: condensed capitals for signage, normal width for reading. One acid lime carries every "you are here", every price and every primary action against an off-white ground (light) or a near-black ground (dark). Dark mode keeps the same lime and inverts only the neutrals.

The one motion idea is the aisle lighting up. As you scroll, the current aisle's sign inverts to lime, its number lights in the directory, and the sign flickers once like a fluorescent tube the first time you reach it. Clickable shelf items lift 3px with a soft shadow on hover or keyboard focus, and nothing else moves.

**Exception: the résumé page.** `resume.html` deliberately keeps the owner's own LaTeX résumé look: Computer Modern Serif (CMU Serif, self-hosted), black on white, centered header, small-caps section rules, a Letter page with print margins. It sits outside the aisle system. Don't restyle it in aisle grammar, and don't borrow its serif or small caps for aisle surfaces.

**Key Characteristics:**
- One family (Archivo variable, wdth 62–125, wght 400–800, self-hosted latin subset); width does the hierarchy work.
- One accent (acid lime) on neutral ground; it always means "current", "price" or "primary".
- Square everything: 0 radius, 1px rules, a 3px shelf rail, dashed 1px for receipts.
- Bilingual pairs on every aisle name: English first, Spanish after it on the baseline.
- Flat at rest. The only shadow is the hover/focus lift.
- Light and dark follow `prefers-color-scheme`; tabular numerals everywhere.

## Colors

A neutral warehouse palette (faintly green off-white, true white shelves, near-black ink) lit by one acid lime.

### Primary
- **Shelf-Light Lime** (`lime`): the sign of the aisle you're standing in, the directory number of the current aisle, every price label, the "was / now" strike-through strip, the primary button, the selected table row, article callouts, text selection, the focus halo and the more-link underline. Text on it is always **Lime Ink** (`lime-ink`, the same near-black as ink), never white. Muted text on lime (the Spanish subline of a current sign, interval figures in a selected row) uses **Olive Ink** (`lime-muted`), which the stylesheet sets as a literal value.

### Neutral
- **Warehouse Floor** (`ground` / `ground-dark`): page background, and the fill of SKU chips (so they read as recessed against the white shelf).
- **Shelf White** (`shelf` / `shelf-dark`): surfaces that hold stock, such as shelf tags, product cards, writing cards, the price channel, tables and inline code.
- **Stencil Ink** (`ink` / `ink-dark`): body text, headings, focus outline. Also the fill of outline buttons on hover.
- **Tag Grey** (`muted` / `muted-dark`): secondary text such as descriptions, dates, spec terms, captions, the Spanish half of directory labels, and the scrollbar thumb.
- **Light Rule** (`rule` / `rule-dark`): the default 1px divider and card border.
- **Strong Rule** (`rule-strong` / `rule-strong-dark`): the 3px shelf rail, the top rule of spec lists and bins, directory number boxes, button borders, and card borders on hover. It always equals ink.
- **Sign Black** (`sign` / `sign-dark`): the resting overhead sign and article code blocks. In dark mode it lifts to a warm charcoal so it still reads as a sign against the darker ground, and gets a 1px **Sign Edge** (`sign-edge-dark`) border.
- **Sign Lettering** (`sign-ink`) and **Sign Subline** (`sign-muted`): the English and Spanish text on a resting sign.

### Named Rules
**The One Lime Rule.** Lime is the only chroma in the system. It marks four things: where you are, what something cost, what to do next, and what was selected. A second hue, a gradient or a tint of lime is never introduced.

**The Inversion Rule.** "Current" is shown by swapping roles, not by adding a colour. The sign ground goes lime and its number box goes sign-black with a lime numeral. The directory number box fills lime. Nothing else changes.

## Typography

**Display Font:** Archivo at wdth 75% (with ui-sans-serif, system-ui fallback)
**Body Font:** Archivo at wdth 100%
**Code Font:** ui-monospace, SF Mono, Menlo, Consolas (articles only)

**Character:** One grotesque family used like a sign shop's stencil set. Heavy condensed capitals name things; the normal width reads. Archivo's width axis replaces a second family. Note that the stylesheet's `--mono` variable also resolves to Archivo, so the site has no monospaced face outside article code.

### Hierarchy
- **Display** (`display`; uppercase): the owner's name at the top of the directory, on two lines. Used once per site. On short laptop screens (≤820px tall) it steps down to clamp(2.5rem, 1.6rem + 2.6vw, 3.75rem).
- **Headline** (`headline`; uppercase): the English name on an overhead sign. The sign number is the same face at 2rem (1.5rem below 1024px).
- **Headline, article** (`headline-article`; uppercase, balanced wrap): the article title under the sign.
- **Price** (`price`): figures inside lime price labels.
- **Title, article** (`title-article`): article section heads, sentence case, at 87.5% width.
- **Title** (`title`): shelf-tag and product names, sentence case. The employer or status after the title drops to weight 500 in Tag Grey. Writing cards use 1.125rem/1.35.
- **Lead** (`lead`): the first paragraph of an aisle. The directory's role line uses the same size at weight 600.
- **Body** (`body`): reading text, capped at 64ch in aisles and 68ch in articles, 52ch at checkout. Tabular numerals site-wide.
- **Body small** (`body-small`): card descriptions, buttons, spec lists, table text.
- **Label, sign** (`label-sign`; uppercase): the Spanish half of a sign, in Sign Subline.
- **Label, aisle** (`label-aisle`; uppercase): English aisle names in the directory, and the "Also on the shelf" bin heading (weight 800, 0.04em).
- **Label** (`label`; uppercase, weight 600–700): dates on tags and notes, spec terms, bin categories, table column heads.

### Named Rules
**The Width Axis Rule.** Condensed (75%) capitals are for naming: the owner, aisles, signs, prices, article titles. Section heads sit at 87.5%, reading text at 100%. Condensed text is never set in sentence case, and body copy is never condensed.

**The Bilingual Pair Rule.** Every aisle name comes as English and then Spanish. On signs, the Spanish runs after the English on the same baseline: smaller, weight 500, 87.5% width, tracked 0.08em, muted, marked `lang="es"`. In the directory it sits underneath at 13px sentence case. Spanish never sits above the English, and it is never left out.

## Layout

A two-column store at 1024px and up: a max-width of 1320px, a gutter of `gutter`, and a column gap of `column-gap`. The left column (minmax(300px, 0.82fr)) is the directory, sticky at full viewport height (100svh), with name, role, a one-line description, the numbered aisle list and, pushed to the bottom, the link chips and a fine-print line. The right column (1.18fr) is the floor: aisles stacked with `aisle-end` after each and `sign-gap` under each sign. On laptops 820px tall or less, the directory tightens its padding and scrolls internally so the whole thing stays reachable.

Below 1024px the store collapses to one column. The directory becomes a header with the aisle list as one wrapping row of chips (number cell plus English name, at least 44px tall), and each overhead sign becomes sticky at the top and bleeds out to the viewport edges. Scroll padding is 76px. The price channel goes from four columns to two at 640px or less. Product cards stack image over text at 720px or less, shelf tags and writing cards at 640px or less, with the date moving *under* the title.

Article pages, the 404 and any secondary page use a single 760px column with the same gutter: a top bar with home and résumé links, then the aisle's sign (static, not sticky), the title and a muted meta line.

Spacing comes from a handful of reused steps rather than a strict scale: `chip-gap` between chips, `stack` between cards in a list, `inset` inside cards and code blocks, and 9–14px vertical padding on rows.

## Elevation & Depth

Flat at rest. Depth comes from surface value (white shelf on off-white floor, or charcoal shelf on near-black floor), from 1px rules, and from the sign's solid black band. A shadow appears only as a response: when a clickable shelf tag, product card or writing card is hovered with a fine pointer or receives keyboard focus, it rises 3px, its border goes to Strong Rule, and its arrow nudges 2px up and to the right.

### Shadow Vocabulary
- **Lift** (light `0 6px 16px -6px rgba(23,23,23,0.28), 0 1px 2px rgba(23,23,23,0.12)`; dark `0 8px 18px -8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.5)`): the only shadow, on hover or focus of clickable shelf items.
- **Focus halo** (`outline: 2px solid ink; outline-offset: 3px; box-shadow: 0 0 0 5px lime`): every focusable element. On cards it stacks with Lift.

### Named Rules
**The Lift-Only Rule.** Nothing casts a shadow at rest. A shelf item lifts a few pixels when you reach for it, and keyboard focus gets the same lift as the pointer. Static (non-link) tags never lift.

## Shapes

Square stock: every corner is 0. The only exception is the 2px rounding on the focus outline. One line weight governs the system: 1px rules for card borders, dividers, chip outlines, spec rows and table rows. Two heavier or broken lines carry meaning. The **shelf rail** (3px Strong Rule) runs along the top of the price channel and of data tables. The **receipt tear** (1px dashed Strong Rule) opens the checkout footer and the end note of an article. Images sit inside a 1px Light Rule frame at 16:10, cropped from the top left.

**The One Line Rule.** Rules are 1px. The only exceptions are the 3px shelf rail and the 2px lime underline on more-links. There are no hairline greys and no double borders.

## Components

### Buttons
Blunt, square, self-explanatory.
- **Shape:** square (0), 1px Strong Rule border, an 18px authored SVG icon before the label, weight 700 (600 for directory chips).
- **Primary:** lime fill and border with Lime Ink text. One per group (Résumé in the directory, email at checkout, "Back to the portfolio" on the 404).
- **Outline:** transparent fill, ink text. On hover with a fine pointer it fills ink and its text turns ground colour.
- **Press:** scale(0.97), 160ms, standard ease-out.
- **Sizes:** checkout "till" buttons at 14px 18px; directory link chips at 9px 12px in body-small.

### Navigation (the directory)
- Numbered rows split by Light Rules. Each has a 44×36 number box (1px Strong Rule, condensed weight-800 numeral) and a two-line label (English aisle name, Spanish underneath in 13px Tag Grey).
- **Hover:** the number box fills ink. **Current** (`aria-current="true"`, set by scroll-spy): the number box fills lime with Lime Ink and keeps its Strong Rule border.
- **Mobile:** a wrapping row of chips: a shelf-white fill, a 34px number cell split off by a 1px rule, and the English name only.

### Aisle Sign (signature)
The overhead sign that opens every aisle and every article. It is a full-width Sign Black band, padded 14px 18px 14px 14px, with a lime number box (min 64×56) and the bilingual heading pair. **Current:** the band goes lime, the number box goes Sign Black with a lime numeral, and the Spanish subline goes Olive Ink. Colours transition over 240ms. The first arrival plays a one-time 300ms stepped flicker (opacity 1, 0.55, 1, 0.8, 1), which is skipped under reduced motion. On articles and the 404 the sign names the aisle you're in (04 Writing / Notas; 404 Not on the shelf / No está aquí).

### Price Channel and Price Label (signature)
A shelf strip on Shelf White, closed by a 3px rail on top and a 1px rule underneath, divided into four cells by Light Rules. Each cell hangs a lime price label flush from the rail (a -1px top margin and no top padding on the cell), with a short description underneath in body-small Tag Grey. The flush hang is deliberate: it is how a shelf-edge label sits.

### Was / Now Strip
An inline lime strip. The old item is struck through (2px, weight 500, 80% opacity), followed by the new price in condensed capitals and a short saving in body-small. It is used only where a real replacement happened.

### Shelf Tag, Product Card, Writing Card
- **Shared:** Shelf White fill, 1px Light Rule border, square corners, flat at rest. When the whole item is a link, it gets Lift on hover and focus and a 14px arrow icon after the title.
- **Shelf tag:** a 128px date column (label style) and a body column. Padding is 20px 20px 20px 18px.
- **Product card:** a 220px framed screenshot next to the body, 18px padding. Inside is a **spec list**: a two-column term/value grid with a Strong Rule on top and Light Rules between rows, terms in label style.
- **Writing card:** the shelf-tag grid at 18px padding, with title at 1.125rem and description in body-small.

### SKU Chips
Small tech and scope tags: label-size text at weight 600 (not uppercase), 3px 8px, a 1px Light Rule border, filled with ground colour so they look stamped into the shelf. They have no states.

### Bin
A borderless list for secondary stock: a Strong Rule on top and Light Rules between rows. Each row has a bold name, a right-aligned uppercase category label and a muted one-line description. Linked rows fill Shelf White on hover and underline the name.

### More-link
A weight-700 inline link with a 2px lime underline and an arrow icon. On hover it fills lime.

### Article Furniture
- **Code block:** a Sign Black slab, 16px 18px, monospace 0.875rem/1.6. **Inline code:** a Shelf White fill with a 1px Light Rule.
- **Callout (blockquote):** a lime slab, weight 600, Lime Ink.
- **Data table:** Shelf White with a 3px rail on top and Light Rule rows. Column heads are in label style. The selected row fills lime, with Olive Ink for its secondary figures. The caption sits underneath in Tag Grey.
- **End note:** a dashed receipt rule, muted body-small.

### Icons
Authored inline SVG symbols on a 16px viewBox: a 1.5–1.6 stroke with square caps and mitred joins for drawn icons, and solid fills for the GitHub and LinkedIn marks. They render at 18px in buttons and 14px for the "go" arrow.

## Do's and Don'ts

### Do:
- **Do** open every aisle and every secondary page with an aisle sign: a lime number box, the English name in condensed capitals and the Spanish pair after it.
- **Do** show "current" by inversion (sign to lime, number box to Sign Black), driven by scroll position, with a one-time flicker that respects reduced motion.
- **Do** put figures in lime price labels hung flush from a 3px shelf rail, and keep tabular numerals on.
- **Do** use Lime Ink on every lime fill, in both colour schemes.
- **Do** give clickable shelf items the 3px lift with the Lift shadow on hover *and* keyboard focus, and nothing at rest.
- **Do** keep corners square and rules at 1px, with the 3px rail and dashed receipt rule as the only exceptions.
- **Do** draw icons as inline SVG on the 16px grid with square caps.

### Don't:
- **Don't** add a second accent hue, a lime tint or gradient, or any real retailer's colours or marks.
- **Don't** use cartoon props, illustrations or hardware clip-art. The aisle is carried by type, rules, numbering and bilingual pairs.
- **Don't** set a kicker or eyebrow label above a heading. The Spanish pair runs after the English on the sign's baseline, and on phones dates move under the title.
- **Don't** round corners or add resting shadows to cards, signs or chips.
- **Don't** use Unicode glyphs or emoji as icons.
- **Don't** introduce a second typeface on aisle surfaces. Hierarchy comes from Archivo's width and weight. Computer Modern belongs to the résumé page only.
- **Don't** put white text on lime.
