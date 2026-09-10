# The Ned Workshop — screen-printing artwork

Generated from the site's own wordmark by `scripts/generate-print-assets.mjs`. Re-run it
rather than editing these by hand:

    npm run brand:print

Everything here is flat spot colour with the type already converted to outlines — no gradients,
no halftones, no font to install. Hand a printer the SVGs, not the PNGs.

## What to print

**On a dark green or black garment — 3 screens.** `lockup-*-dark-garment.svg`. The green field
is dropped and the shirt becomes the background, so the three patches float free — which is the
quilting metaphor the brand is built on, and a much lighter hand than a solid printed field.
"the" and "workshop" are knocked out, so the garment shows through the letters.

**On a natural or cream garment — 4 screens.** `lockup-*-light-garment.svg`. The green field is
printed, and the knocked-out words reveal it, so the mark reads exactly as it does on screen.
Note the field is a large solid area: fine in the wide ratio, heavy in the stacked one.

**One screen.** `lockup-*-one-color.svg` and `icon-one-color.svg`, supplied as black art so the
shop can flood any ink. The icon is the right choice for caps, sleeves and pocket hits, where
the full lockup would be three smudges.

## Files

| file | shape | screens | inks, in print order |
| --- | --- | --- | --- |
| `lockup-wide-dark-garment.svg` | wide | 3 | pink, coral, cream |
| `lockup-wide-light-garment.svg` | wide | 4 | green, pink, coral, cream |
| `lockup-stacked-dark-garment.svg` | stacked | 3 | pink, coral, cream |
| `lockup-stacked-light-garment.svg` | stacked | 4 | green, pink, coral, cream |
| `lockup-wide-one-color.svg` | wide | 1 | any |
| `lockup-stacked-one-color.svg` | stacked | 1 | any |
| `icon-one-color.svg` | square | 1 | any |

`separations/` holds one file per screen, solid black — burn straight from these. A knocked-out
word arrives as a hole in its patch rather than as separate film that has to register.

`previews/` shows each variant on its garment colour. `lockup-wide-transparent-2400.png` is the
mark with nothing at all behind it.

## Inks

| | hex | note |
| --- | --- | --- |
| green | `#23392c` | one green, not the three the screen version uses |
| pink | `#f2a7c6` | the starburst |
| coral | `#ff8383` | the NED patch |
| cream | `#fbf5e3` | the workshop panel and the NED letters |

Light inks on a dark garment need an opaque ink or a white underbase — ask the shop, and budget
a screen for it if they want one.

## Sizes

Measured on the artwork itself — every file here is trimmed to the ink, so a width you give the
shop is a width of mark.

| variant | ratio | adult chest | youth |
| --- | --- | --- | --- |
| wide / dark-garment | 5.57:1 | 11in wide → 2.0in tall | 8in wide |
| wide / light-garment | 4.54:1 | 11in wide → 2.4in tall | 8in wide |
| wide / one-color | 5.57:1 | 11in wide → 2.0in tall | 8in wide |
| stacked / dark-garment | 1.70:1 | 10in wide → 5.9in tall | 7in wide |
| stacked / light-garment | 1.59:1 | 10in wide → 6.3in tall | 7in wide |
| stacked / one-color | 1.70:1 | 10in wide → 5.9in tall | 7in wide |

The finest detail is the starburst points, about 0.13in deep even on a youth-size wide print —
comfortably above what a screen holds. Stacked reads better at youth sizes.

Type is Titan One (SIL Open Font License), glyphs converted to outlines.
