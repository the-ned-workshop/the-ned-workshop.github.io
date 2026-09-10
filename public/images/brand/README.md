# The Ned Workshop — social branding

Generated from the site's own wordmark by `scripts/generate-social-logos.mjs` in the
website repo. Re-run it rather than editing these by hand:

    npm run brand:social -- "public/images/brand"

## Files

| file | use |
| --- | --- |
| `profile-circle-safe-1024.png` | **Instagram, Facebook, YouTube profile.** All three mask to a circle; the mark is sized to fit inside it. |
| `profile-square-1024.png` | Profile art where the image is *not* circle-cropped. The mark is larger, so the corners would clip under a circle mask. |
| `facebook-cover-1640x624.png` | Facebook page cover. |
| `youtube-banner-2560x1440.png` | YouTube channel banner; the mark sits inside the 1546×423 area that shows on every device. |
| `wordmark-wide-on-green-2400.png` | The lockup on its green plate, for slotting into a light layout. Not transparent — for a master with nothing behind it, and for anything going to a printer, see `npm run brand:print`. |
| `wordmark-wide.svg` | Vector master, wide lockup. |
| `logo-tile.svg` | Vector master, square tile. |

## Colors

| | hex | where |
| --- | --- | --- |
| quilt green | `#23392c` | the field behind the mark |
| pink | `#f2a7c6` | the "the" starburst |
| coral | `#ff8383` | the "NED" tile — same coral as the site's Donate button |
| cream | `#fbf5e3` | the "workshop" panel |
| dark green | `#3f5c3a` | the word "workshop" |
| page cream | `#fff8ee` | banner backgrounds, the site's page colour |

Type is Titan One (SIL Open Font License), with the glyphs converted to outlines — nothing here
depends on the font being installed.
