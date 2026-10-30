# Figma construction source

These scripts run through the official Figma `use_figma` tool, not as application
code. Load the Figma skills and the recorded file/session context before executing
them. Never replay a creation script over existing content without checking the
manifest and its deterministic-name guard.

## Completed

1. `foundations.js`: neutral token aliases, typography and the two design pages.
2. `components.js`: shared customer components, using `common.js` and `icons.json`.
3. `discovery.js`: three customer screens, using `common.js` and `screens-common.js`.
4. Targeted corrections: horizontal rows hug their height while keeping fixed
   widths; SVG wrapper frames have transparent fills. Corrections are reflected
   in the shared helper source. The final render is in `../reviews/`.

`manifest.json` records actual completed Figma IDs. The private continuation ledger
in `.artifacts/figma/state.json` also retains the current session UUID and pending
link targets, but is ignored by Git. Do not commit upload/screenshot URLs, which
are temporary credentials, or any application `.env` values.

## Prepared but not composed in Figma

- `queue.js`: join form, remote registration and physically arrived states.
- `appointments.js`: request, pending, suggested-time and confirmed states.
- `account.js`: optional sign-in/sign-up and email-verification screens.
- Prototype wiring: collect actual returned frame/action IDs and assign reactions
  only after all target screens exist. No clickable navigation has been wired yet.

The queue composition call returned the Figma plan-limit error before execution.
Resume with a canvas read when access is available; preserve existing IDs and
completed work. Do not work around the account's limit or silently recreate the
file. Validate new compositions with actual renders before marking them complete.

The runner supplies `STATE` from the ledger and `ICONS` from `icons.json`, followed
by `common.js`, `screens-common.js` and the selected screen script. Component
creation instead uses `common.js` and `components.js`. Scripts must be run in
dependency order and against the recorded target file. This is not a general
command-line replay tool.
