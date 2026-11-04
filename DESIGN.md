---
name: Samuel Alderete
description: A software engineer's portfolio stocked, labelled and priced like a well-run bilingual aisle, set in one blue on linen.
colors:
  accent: "#265789"
  accent-ink: "#ece8df"
  accent-muted: "#c9d6e6"
  ground: "#e2ddd1"
  shelf: "#ece8df"
  ink: "#1e3f66"
  muted: "#3e5e83"
  rule: "#c9c2b2"
  rule-strong: "#265789"
  sign: "#ece8df"
  sign-ink: "#265789"
  sign-muted: "#456690"
  sign-border: "#265789"
  accent-dark: "#8fb1da"
  accent-ink-dark: "#0f1724"
  accent-muted-dark: "#1e3f66"
  ground-dark: "#0f1724"
  shelf-dark: "#162133"
  ink-dark: "#e2ddd1"
  muted-dark: "#aab4c3"
  rule-dark: "#2a3a52"
  rule-strong-dark: "#e2ddd1"
  sign-dark: "#162133"
  sign-ink-dark: "#e2ddd1"
  sign-muted-dark: "#a3b4ca"
  sign-border-dark: "#3d5a80"
typography:
  display:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(2.75rem, 2rem + 3.4vw, 4.75rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  display-compact:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.6rem + 2.6vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline-article:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  price:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.3rem + 1.4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.05
  sign-number:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
  title-article:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  label-aisle:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.2
  label-aisle-compact:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  aisle-number:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1
  aisle-number-compact:
    fontFamily: "Bodoni Moda, Didot, Bodoni 72, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 600
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
  code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0px"
  focus: "2px"
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
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "14px 18px 14px 14px"
  aisle-sign-current:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  aisle-sign-number:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.sign-number}"
    height: "56px"
    width: "64px"
  aisle-sign-number-current:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.accent}"
  directory-number:
    textColor: "{colors.ink}"
    typography: "{typography.aisle-number}"
    width: "44px"
    height: "36px"
  directory-number-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  directory-number-current:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  price-label:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body-small}"
    padding: "6px 10px"
  code-block:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    typography: "{typography.code}"
    padding: "16px 18px"
  callout:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    padding: "14px 18px"
  table-row-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
---

# Design System: Samuel Alderete

## Overview

**Creative North Star: "The Well-Run Aisle, in Haven Blue"**

The site is a bilingual aisle held to signage discipline. A pinned directory on the left lists numbered aisles. Each section on the right opens under a full-width overhead sign: a solid blue number box, the English aisle name in a high-contrast Didone, and its Spanish pair after it on the same baseline in small tracked capitals. Work is stocked as shelf tags, product cards with spec lists, a bin of smaller items, and blue price labels hanging from a heavy shelf rail. Type, rules, numbering and the bilingual pairs carry the metaphor. There are no props, no illustrations and no retailer colours or marks.

The palette is Haven, from the Nerrix design library: one blue on linen. Every chromatic value is that single blue family. The deep blue (`accent`) fills current signs, prices and primary actions and draws the strong rules, a darker navy (`ink`) sets the text, and warm linen grounds and shelves (`ground`, `shelf`) hold everything. Dark mode turns the ground to night navy, the text to linen, and lifts the accent to a pale sky blue so it still reads as the one light in the room. Density is moderate and legible: a 17px Inter reading face, generous aisle breaks, and 1px rules that every tag, sign and table snaps to. Hierarchy comes from the pairing. Bodoni Moda at weight 600 names things, and Inter reads, labels and acts.

The one motion idea is the aisle lighting up. As you scroll, the current aisle's sign inverts from a linen panel to solid blue, its number lights in the directory, and the sign flickers once like a fluorescent tube the first time you reach it. Clickable shelf items lift 3px with a soft shadow on hover or keyboard focus, and while one item is in focus the rest of its shelf steps back to half strength (shelf focus). With a mouse or trackpad, a soft work light follows the pointer along the aisle floor, under the shelves: pale linen by day, a faint blue shop light at night. Touch screens and reduced motion get no light. On the first visit of a session the store opens: a closed shutter in the sign blue, drawn with 1px slat rules. "Hello" lights like a sign and holds a beat, then eleven more languages speed past (Hola, Olá, Bonjour, Hallo, Xin chào, Korean, Japanese, Mandarin, Hindi, Arabic and Navajo) to the store's own sign, Open with Abierto after it. Once the page has loaded (2 s at least, 3.3 s at most; a key, click, scroll or touch opens it at once) the shutter fades away over 700 ms while the page drifts up 40px into place, and the first aisle's sign flickers on. It never shows for a link to a section, on a return from an article, or under reduced motion. Nothing else moves.

**Exception: the résumé page.** `resume.html` deliberately keeps the owner's own LaTeX résumé look: Computer Modern Serif (CMU Serif, self-hosted from `assets/fonts/cmu`), black on white, centered header, small-caps section rules, a Letter page with print margins. It sits outside the aisle system. Don't restyle it in aisle grammar, and don't borrow its serif, its small caps or its black-on-white for aisle surfaces.

**Key Characteristics:**
- Two self-hosted families: Bodoni Moda (variable, wght 400–900, used at 600) for naming, Inter (wght 400–800) for everything else. No width axes and no condensed type.
- One blue on linen. The accent always means "current", "price", "primary" or "selected".
- Square everything: 0 radius, 1px rules, a 3px shelf rail, and a dashed 1px rule for receipts.
- Bilingual pairs on every aisle name: English first, Spanish after it on the baseline.
- Flat at rest. The only shadow is the hover/focus lift, and the only gradient is the work light, which is light on the floor rather than paint on a surface.
- Light and dark follow `prefers-color-scheme`, and numerals are tabular everywhere.

## Colors

Haven: warm linen neutrals and one blue, used at three depths (accent, ink, muted) so the page never introduces a second hue.

### Primary
- **Haven Blue** (`accent` / `accent-dark`): the fill of the current aisle sign, every sign number box at rest, the current directory number, every price label, the was/now strip, the primary button, article callouts, the selected table row, text selection and the skip link. It also draws the 5px focus halo and the 2px more-link underline. In dark mode it lifts to a pale sky blue.
- **Linen on Blue** (`accent-ink` / `accent-ink-dark`): all text on an accent fill. In light mode it is the shelf linen. In dark mode it is the night-navy ground.
- **Mist Blue** (`accent-muted` / `accent-muted-dark`): secondary text on an accent fill, meaning the Spanish subline of a current sign and the interval figures in a selected table row.

### Neutral
- **Linen Ground** (`ground` / `ground-dark`): the page background, and the fill of SKU chips so they read as stamped into the shelf. In dark mode it becomes night navy.
- **Shelf Linen** (`shelf` / `shelf-dark`): surfaces that hold stock, such as shelf tags, product cards, writing cards, the price channel, tables, inline code and the phone aisle chips.
- **Harbor Navy** (`ink` / `ink-dark`): body text, headings and the focus outline. It is also the fill of outline buttons and directory numbers on hover. In dark mode it is linen.
- **Slate Blue** (`muted` / `muted-dark`): secondary text such as descriptions, dates, spec terms, captions, meta lines, the Spanish half of directory labels and the scrollbar thumb.
- **Flax Rule** (`rule` / `rule-dark`): the default 1px divider and card border.
- **Strong Rule** (`rule-strong` / `rule-strong-dark`): the 3px shelf rail, the top rule of spec lists and bins, directory number boxes, button and chip borders, dashed receipt rules and card borders on hover. In light mode it equals Haven Blue. In dark mode it equals the linen ink.
- **Sign Panel** (`sign` / `sign-dark`) with **Sign Edge** (`sign-border` / `sign-border-dark`): the resting overhead sign is a linen panel inside a 1px blue border. Article code blocks use the same panel fill without the border.
- **Sign Lettering** (`sign-ink` / `sign-ink-dark`) and **Sign Subline** (`sign-muted` / `sign-muted-dark`): the English and Spanish text on a resting sign, and the text of code blocks.

### Named Rules
**The One Blue Rule.** Every chromatic value in the system belongs to the Haven blue family, set on linen. Ink, muted text and rules are deeper or greyer steps of the same blue. A second hue, a gradient, or a retailer's colour is never introduced.

**The Inversion Rule.** "Current" is shown by swapping roles, not by adding a colour. The sign's linen panel goes solid accent, its number box goes linen with an accent numeral, and its Spanish subline goes Mist Blue. The directory number box fills accent. Nothing else changes.

## Typography

**Display Font:** Bodoni Moda (variable, self-hosted at `assets/fonts/bodoni-moda-latin.woff2`, with Didot, Bodoni 72 and Georgia as fallbacks)
**Body Font:** Inter (self-hosted at `assets/fonts/inter-latin.woff2`, with ui-sans-serif and system-ui as fallbacks)
**Code Font:** ui-monospace, SF Mono, Menlo, Consolas (articles only)

**Character:** A high-contrast Didone does the naming the way a painted shop sign would, and a plain neo-grotesque does the reading and the labelling. Bodoni Moda only ever appears at weight 600, in the case the words are written in (title case for aisle names, sentence case for article titles), and never transformed to capitals.

### Hierarchy
- **Display** (`display`): the owner's name at the top of the directory, on two lines. It appears once per site. On laptops 820px tall or less it steps down to `display-compact`.
- **Headline** (`headline`): the English name on an overhead sign. The sign's number box uses `sign-number`, which drops to 1.5rem below 1024px.
- **Headline, article** (`headline-article`; balanced wrap): the article title under the sign.
- **Price** (`price`): the figures inside blue price labels.
- **Title, article** (`title-article`): article section heads, and the "Also on the shelf" bin heading.
- **Aisle label** (`label-aisle`): English aisle names in the directory. In the phone chip row they use `label-aisle-compact`, with numbers at `aisle-number-compact`.
- **Aisle number** (`aisle-number`): directory number boxes, and the "Built in-house" figure inside the was/now strip.
- **Title** (`title`): shelf-tag and product names in Inter, sentence case. The employer or status after the title drops to weight 500 in Slate Blue. Writing cards use 1.125rem/1.35.
- **Lead** (`lead`): the first paragraph of an aisle. The directory's role line uses the same size at weight 600.
- **Body** (`body`): reading text, capped at 64ch in aisles, 68ch in articles and 52ch at checkout. Numerals are tabular site-wide.
- **Body small** (`body-small`): card descriptions, buttons, spec lists, table text and meta lines.
- **Sign subline** (`label-sign`; uppercase): the Spanish half of a sign, in Sign Subline.
- **Label** (`label`; uppercase, weight 600–700): dates on tags and notes, spec terms, bin categories and table column heads. SKU chips use the same size without the uppercase.

### Named Rules
**The Two Voices Rule.** Bodoni Moda names things: the owner, aisles, sign numbers, prices, article titles and section heads, and the "Built in-house" figure. Inter does everything else, including every button, chip, label, date and paragraph. Bodoni is never used for running text, never set in capitals, and never set below the 0.9375rem phone chip label.

**The Bilingual Pair Rule.** Every aisle name comes as English and then Spanish. On signs, the Spanish runs after the English on the same baseline in Inter capitals (`label-sign`, tracked 0.14em) in Sign Subline, marked `lang="es"`. In the directory it sits underneath at 13px in Inter sentence case, and on phones it is dropped from the chips. Spanish never sits above the English, and the sign never leaves it out.

## Layout

At 1024px and up the store has two columns, with a max-width of 1320px, a gutter of `gutter`, and a column gap of `column-gap`. The left column (minmax(300px, 0.82fr)) is the directory. It is sticky at full viewport height (100svh) and holds the name, the role, a one-line description, the numbered aisle list and, pushed to the bottom, the link chips and a fine-print line. The right column (1.18fr) is the floor. Aisles stack with `aisle-end` after each one and `sign-gap` under each sign. On laptops 820px tall or less, the directory tightens its padding and rows and scrolls internally, so the whole thing stays reachable.

Below 1024px the store collapses to one column. The directory becomes a header, and the aisle list becomes one wrapping row of chips (a number cell plus the English name, at least 44px tall). Each overhead sign turns sticky at the top and bleeds out to the viewport edges, and scroll padding is 76px. The price channel goes from four columns to two at 640px or less. Product cards stack the image over the text at 720px or less. Shelf tags and writing cards stack at 640px or less, with the date moving *under* the title.

Article pages and the 404 use a single 760px column with the same gutter. Articles get a top bar with home and résumé links, then the aisle's sign (static, not sticky), the title and a muted meta line.

Spacing comes from a handful of reused steps rather than a strict scale: `chip-gap` between chips, `stack` between cards in a list, `inset` inside cards and code blocks, and 9–14px vertical padding on rows.

## Elevation & Depth

Flat at rest. Depth comes from surface value (a pale linen shelf on a deeper linen ground, or a navy shelf on a night ground), from 1px rules, and from the blue edge around each sign. A shadow appears only as a response. When a clickable shelf tag, product card or writing card is hovered with a fine pointer or gets keyboard focus, it rises 3px, its border goes to Strong Rule, and its arrow nudges 2px up and to the right.

### Shadow Vocabulary
- **Lift** (light `0 6px 16px -6px rgba(30,63,102,0.30), 0 1px 2px rgba(30,63,102,0.14)`, tinted with Harbor Navy; dark `0 8px 18px -8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.5)`): the only shadow, on hover or focus of clickable shelf items.
- **Focus halo** (`outline: 2px solid ink; outline-offset: 3px; box-shadow: 0 0 0 5px accent`): every focusable element. On cards it stacks with Lift.

### Named Rules
**The Lift-Only Rule.** Nothing casts a shadow at rest. A shelf item lifts a few pixels when you reach for it, and keyboard focus gets the same lift as the pointer. Static (non-link) tags never lift.

## Shapes

Square stock: every corner is 0. The only exception is the `focus` rounding on the focus outline. One line weight governs the system: 1px rules for card borders, sign edges, dividers, chip outlines, spec rows and table rows. Two heavier or broken lines carry meaning. The **shelf rail** (3px Strong Rule) runs along the top of the price channel and of data tables. The **receipt tear** (1px dashed Strong Rule) opens the checkout footer and the end note of an article. Images sit inside a 1px Flax Rule frame at 16:10, cropped from the top left.

**The One Line Rule.** Rules are 1px. The only exceptions are the 3px shelf rail and the 2px accent underline on more-links. There are no double borders.

## Components

### Buttons
Blunt, square and self-explanatory.
- **Shape:** square (0) with a 1px Strong Rule border, an 18px authored SVG icon before the label, and Inter at weight 700 (600 for the directory link chips).
- **Primary:** accent fill and border with Linen on Blue text. There is one per group: Résumé in the directory, email at checkout, and "Back to the portfolio" on the 404.
- **Outline:** a transparent fill with ink text. On hover with a fine pointer it fills ink and its text turns the ground colour.
- **Press:** scale(0.97) over 160ms on the standard ease-out.
- **Sizes:** checkout "till" buttons at 14px 18px, and directory link chips at 9px 12px in body-small.

### Navigation (the directory)
- Numbered rows split by Flax Rules. Each row has a 44×36 number box (1px Strong Rule border, Bodoni numeral) and a two-line label: the English aisle name in Bodoni and the Spanish underneath in 13px Inter, Slate Blue.
- **Hover:** the number box fills ink. **Current** (`aria-current="true"`, set by the scroll-spy): the number box fills accent with Linen on Blue text and keeps its Strong Rule border.
- **Mobile:** a wrapping row of chips with a Shelf Linen fill and a Strong Rule border. Each chip has a 34px number cell split off by a 1px rule, and the English name only.

### Aisle Sign (signature)
The overhead sign that opens every aisle and every article. At rest it is a full-width Sign Panel inside a 1px Sign Edge, padded 14px 18px 14px 14px, with a solid accent number box (min 64×56) and the bilingual heading pair in Sign Lettering and Sign Subline. **Current:** the panel fills accent and its border goes accent, the number box turns linen with an accent numeral, the English name turns Linen on Blue, and the Spanish subline turns Mist Blue. Colours transition over 240ms. The first arrival plays a one-time 300ms stepped flicker (opacity 1, 0.55, 1, 0.8, 1), which is skipped under reduced motion. On articles and the 404 the sign is static and names the aisle you're in (04 Writing / Notas; 404 Not on the shelf / No está aquí).

### Price Channel and Price Label (signature)
A shelf strip on Shelf Linen, closed by a 3px rail on top and a 1px rule underneath, and divided into four cells by Flax Rules. Each cell hangs a blue price label flush from the rail (a -1px top margin and no top padding on the cell), with a short description underneath in body-small Slate Blue. The flush hang is how a shelf-edge label sits. The cells keep 14px of side and bottom inset.

### Was / Now Strip
An inline accent strip. The old item is struck through (2px, weight 500, 80% opacity), followed by the new item in Bodoni at the aisle-number size and a short saving in body-small. It is used only where a real replacement happened.

### Shelf Tag, Product Card, Writing Card
- **Shared:** Shelf Linen fill, a 1px Flax Rule border, square corners, and flat at rest. When the whole item is a link, it gets Lift on hover and focus and a 14px arrow icon after the title.
- **Shelf tag:** a 128px date column (label style) and a body column, padded 20px 20px 20px 18px.
- **Product card:** a 220px framed screenshot next to the body, with 18px padding. Inside is a **spec list**: a two-column term/value grid with a Strong Rule on top and Flax Rules between rows, with terms in label style.
- **Writing card:** the shelf-tag grid at 18px padding, with the title at 1.125rem and the description in body-small.

### SKU Chips
Small tech and scope tags: label-size Inter at weight 600 (not uppercase), 3px 8px, with a 1px Flax Rule border, filled with the ground colour so they look stamped into the shelf. They have no states.

### Bin
A borderless list for secondary stock, under a Bodoni `title-article` heading. It has a Strong Rule on top and Flax Rules between rows. Each row has a bold Inter name, a right-aligned uppercase category label and a muted one-line description. Linked rows fill Shelf Linen on hover and underline the name.

### More-link
A weight-700 inline link with a 2px accent underline and an arrow icon. On hover it fills accent.

### Article Furniture
- **Code block:** a Sign Panel slab with Sign Lettering, 16px 18px, monospace 0.875rem/1.6. **Inline code:** a Shelf Linen fill with a 1px Flax Rule.
- **Callout (blockquote):** an accent slab in weight 600 with Linen on Blue text.
- **Data table:** Shelf Linen with a 3px rail on top and Flax Rule rows. Column heads use label style. The selected row fills accent, with Mist Blue for its secondary figures. The caption sits underneath in Slate Blue.
- **End note:** a dashed receipt rule over muted body-small.

### Icons
Authored inline SVG symbols on a 16px viewBox. Drawn icons use a 1.5–1.6 stroke with square caps and mitred joins, and the GitHub and LinkedIn marks are solid fills. They render at 18px in buttons and 14px for the "go" arrow.

## Do's and Don'ts

### Do:
- **Do** open every aisle and every secondary page with an aisle sign: a linen panel in a 1px blue edge, a solid accent number box, the English name in Bodoni Moda 600 and the Spanish pair after it in tracked Inter capitals.
- **Do** show "current" by inversion (panel to solid accent, number box to linen), driven by scroll position, with a one-time flicker that respects reduced motion.
- **Do** put figures in blue price labels hung flush from a 3px shelf rail, and keep tabular numerals on.
- **Do** use the `accent-ink` token for text on every accent fill, and `accent-muted` for secondary text on it, in both colour schemes.
- **Do** keep Bodoni Moda at weight 600 for naming roles only, and set everything else in Inter.
- **Do** give clickable shelf items the 3px lift with the Lift shadow on hover *and* keyboard focus, and nothing at rest.
- **Do** quiet the rest of a shelf (experience tags, product cards, writing cards, bin rows, inventory rows) to 0.5 opacity while one item has the pointer or keyboard focus, over 220ms.
- **Do** keep the shutter to the first visit of a session, under 3.3 s, skippable by any key, click or scroll, and absent for #links and reduced motion (`index.html` head script, `.shutter`, `site.js`).
- **Do** keep the work light under the shelves, moved by transform only, for fine pointers only, and off under reduced motion (`site.js`, `.worklight`, token `--lamp`).
- **Do** keep corners square and rules at 1px, with the 3px rail and dashed receipt rule as the only exceptions.
- **Do** draw icons as inline SVG on the 16px grid with square caps.

### Don't:
- **Don't** add a second hue, a gradient fill, or any real retailer's colours or marks. The work light is the one radial gradient, and it stays a light, not a surface.
- **Don't** use cartoon props, illustrations or hardware clip-art. The aisle is carried by type, rules, numbering and bilingual pairs.
- **Don't** set a kicker or eyebrow label above a heading. The Spanish pair runs after the English on the sign's baseline, and on phones dates move under the title.
- **Don't** set Bodoni Moda in capitals, in running text, or at any weight other than 600.
- **Don't** bring back condensed type or width-axis hierarchy.
- **Don't** round corners or add resting shadows to cards, signs or chips.
- **Don't** use Unicode glyphs or emoji as icons.
- **Don't** use Computer Modern, small caps or black on white outside the résumé page.
