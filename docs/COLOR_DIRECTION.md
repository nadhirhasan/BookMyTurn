# Eucalyptus and sage colour update

3 November 2026. Replaces the red/coral brand used in PRs #18 and #19 across
Customer, Manager and Barber. The user asked for a softer alternative and has
previously excluded blue and dark themes.

Implemented in [PR #20](https://github.com/nadhirhasan/BookMyTurn/pull/20).

## Research and choice

- [Android colour guidance](https://developer.android.com/design/ui/mobile/guides/styles/color)
  recommends a restrained palette, consistent semantic roles and role-based
  tokens. Primary actions and error feedback should have distinct purposes.
- [NN/g colour guidance](https://www.nngroup.com/articles/color-enhance-design/)
  stresses consistent meaning and notes that colour interpretation varies by
  culture. Eucalyptus is a design choice responsive to this user's preference,
  not a claim that green universally creates positive emotions.
- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  specifies 4.5:1 for normal text. [Use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
  requires additional cues; existing status text, icons, selection borders and
  inline error messages remain.

The installed UI/UX skill returned pink/lavender for spa products and green/pink
for a narrower natural-product query. Neither is an exact salon-app match. The
final palette is selected through the existing brand, user constraints and
measured contrast, rather than adopting those templates.

Eucalyptus provides a green accent without a blue cast or a dark screen theme.
Soft sage replaces peach panels. Warm white, white cards and charcoal text keep
photography prominent. Amber remains for pending states and red for error feedback.
Green availability badges remain labelled, so their meaning does not depend on
being visually distinct from green action controls.

| Role | Colour |
| --- | --- |
| Primary action, active navigation, links | `#176B52` |
| Brand panels and selection tint | `#E6F1E8` |
| App background | `#FFFCF8` |
| Main text | `#28241F` |

## Verification

Calculated from WCAG sRGB relative luminance for default opaque colours:

| Pair | Contrast |
| --- | --- |
| White on primary action | 6.44:1 |
| Primary action on app background | 6.30:1 |
| Primary action on sage | 5.55:1 |
| Muted text on sage | 4.83:1 |
| Main text on sage | 13.29:1 |

These measurements cover the changed default colour pairs, not a full accessibility
certification. Existing layout, behaviour, permissions and data APIs are unchanged.
`brandSoft` replaces the hue-specific `peach` token; the unused coral token is removed.

- [x] Research role consistency and accessibility guidance.
- [x] Update both existing theme files and references.
- [x] Verify contrast and run both workspace lint/type checks.
- [x] Inspect rendered customer/staff journeys and publish previews.
- [x] Open a separate PR.
- [ ] User reviews colours on their phone.

Both existing visual journey tests pass, covering customer discovery/booking/queue
and manager/barber start-to-completion screens. This colour-only change did not
rerun the full behavioural suite or native exports; no new API or dependency is used.

Previous screenshot galleries document the earlier palette. See the
[current previews](../design/reviews/eucalyptus/README.md). Figma's known tool quota
remains a separate limitation.
