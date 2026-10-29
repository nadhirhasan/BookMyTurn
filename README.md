# BookMyTurn

Mobile salon discovery, queues and appointments for Akurana, Sri Lanka.

The Customer app is the primary product: help people compare current waiting
times, find an estimated quieter time to visit, join a queue or request a future
appointment. Salon Manager workflows keep that customer information up to date.

The agreed stack is React Native with Expo, TypeScript, and Supabase. Development
will proceed one verified milestone and one feature pull request at a time.

- [Implementation plan and progress checklist](docs/IMPLEMENTATION_PLAN.md)
- [Customer app specification](idea/customer.md)
- [Salon Manager specification](idea/manager.md)
- [Figma customer design and review status](design/README.md)

Start with the implementation plan. UI implementation is paused for the customer
design review. The agreed direction is light and neutral, replacing the original
dark/navy and cyan specification.

## Design review

Open [BookMyTurn in Figma](https://www.figma.com/design/wugLxCXK2CM44607SvxZwF?node-id=9-140)
to review Home, salon comparison and Royal Saloon availability. These are editable
screens with reusable components. The remaining journey and clickable prototype
are pending because the Figma MCP Starter-plan tool limit was reached.

The earlier engineering shell remains a local draft. It is not the approved
design and is not included in the design-review PR. React Native setup and
run instructions will be delivered with the implementation milestone.

## Local configuration

The root `.env` contains local Supabase connection settings and is ignored by Git.
`.env.example` documents the variable names without real project values. The Expo
workspace setup milestone will document where each app reads its configuration.

Only the Supabase project URL and publishable key belong in mobile app
configuration. Database passwords, service-role keys and secret keys do not.

## Feature delivery

Each feature uses its own PR and stops for user verification. Mark a milestone
complete only after the applicable checks, user verification and merge.
