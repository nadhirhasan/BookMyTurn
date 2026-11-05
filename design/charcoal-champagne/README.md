# BookMyTurn — Charcoal & Champagne

Historical prototype. The user's later cream and teal reference replaces this
visual direction. See [the current app screenshots](../reviews/cream-teal/README.md).

Design review, 5 November 2026. **Design-only prototype: no application, Supabase, account or live business-data changes.**

The user supplied a neon/cyan dark mockup as a quality reference, requested a dark alternative without neon, and asked to preview the design before application implementation. This direction uses warm charcoal, layered olive-charcoal surfaces, ivory typography, muted champagne actions and real salon photography. The provided composition informs the visual ambition; BookMyTurn's actual workflow determines the screens.

## Open the preview

From the repository root:

```powershell
python design/charcoal-champagne/serve.py
```

- Interactive: <http://127.0.0.1:9077>
- Eight-screen board: <http://127.0.0.1:9077/?view=board>
- Static overview: [previews/all-screens.png](previews/all-screens.png)

The server listens only on loopback and serves an explicit allowlist of preview files, existing sample photos and bundled font files. It does not expose the rest of the workspace. Nothing calls Supabase, opens external maps, sends invitations, captures location or creates bookings.

## Review scope

Ten interactive views: customer discovery, salon details, calendar/time selection, queue ticket, visits, haircut collections, account, manager dashboard, manager team/invitations and barber chair. Eight representative views appear on the board.

Try the customer queue flow; calendar request and pending status; collection/full-image preview; manager add-barber/invitation; and barber verify → start → finish. The sample visit code is **482619**. Completing the sample haircut adds the entered final price to the sample owner revenue. Secondary controls use clearly labelled preview sheets or messages where the full workflow is outside the visual review.

Preserved product rules: no service catalogue or upfront prices, queue separate from appointments, appointments need salon confirmation, six-digit codes, staff-led service progression, final-price entry after the haircut, private haircut collections and owner-only financial views.

## Visual and motion decisions

- Background `#141613`; surfaces `#20231E` / `#2A2E26`; text `#F4F0E7`; muted text `#B1B4A8`; champagne `#CBB58F`; status sage `#B2C7A9`.
- Existing DM Sans, with clearer hierarchy and larger supporting text. Real photos provide character without neon edges or glowing controls.
- Page navigation: approximately 280–300 ms, directional horizontal movement and a restrained fade. Sheet entrance: 360 ms from the bottom. Pressed controls respond immediately.
- Fixed salon queue/appointment actions and booking summary/CTA. Disabled taken times. Scrollable screen content, persistent navigation, keyboard focus indicators and dialog focus trapping.
- Reduced-motion OS preference and an explicit preview Motion switch. No autoplay backgrounds, particle effects or continuous decorative animation.

## Validation

Syntax checked and visually reviewed in isolated Edge. Exercised queue entry/ticket; date/time selection and pending appointment; immediate invitation reveal; barber code verification, service completion and owner revenue; full photo preview; 320px layout; board rendering and local images. No JavaScript page errors. These checks validate the prototype, not a native implementation or real hosted workflow.

Figma tooling was available and a new file was created, but the first inspection/edit call was rejected with **“You've reached the Figma MCP tool call limit on the Starter plan.”** No screens were written to Figma. The blank file key `X7QKj2ysPJg7gb062i4Deg` is retained only as a future export destination. This interactive preview and its screenshots are the deliverables for this review. Do not describe the blank file as a completed Figma design.

## Assets and references

- User-attached Claude design: composition and polish reference, not a source of copied assets or business rules.
- Photos: existing illustrative Unsplash assets; [licences and authors](../../apps/customer/assets/images/README.md). These do not depict the sample salons or barbers.
- Lucide Icons 1.64.0, [ISC licence](../figma/LUCIDE-LICENSE.txt). The preview embeds SVGs from the existing installed library.
- Existing DM Sans files from `@expo-google-fonts/dm-sans`.
- Used installed UI/UX design skill and native UI review guidance. Generic liquid-glass/scroll-storytelling recommendations were rejected because they do not fit the user's task-first salon workflow.
- [Official OpenAI Figma workflow](https://learn.chatgpt.com/use-cases/figma-designs-to-code).

## Approval gate

- [x] Produce a non-neon dark visual direction.
- [x] Preview customer, manager and barber screens with representative interactions and transitions.
- [x] Verify layouts and sample flows; preserve the product rules.
- [x] User reviews and approves the direction (5 November 2026).
- [x] Translate into shared Expo tokens/components and native navigation/motion on the implementation feature branch.

Application implementation and its validation are tracked in
[CHARCOAL_IMPLEMENTATION.md](../../docs/CHARCOAL_IMPLEMENTATION.md).
