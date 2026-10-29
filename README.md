# BookMyTurn

Mobile salon discovery, queues and appointments for Akurana, Sri Lanka.

The agreed stack is React Native with Expo, TypeScript, and Supabase. Development
will proceed one verified milestone and one feature pull request at a time.

- [Implementation plan and progress checklist](docs/IMPLEMENTATION_PLAN.md)
- [Customer app specification](idea/customer.md)
- [Salon Manager specification](idea/manager.md)

Start with the implementation plan. Application development has not started.

## Local configuration

The root `.env` contains local Supabase connection settings and is ignored by Git.
`.env.example` documents the variable names without real project values. The Expo
workspace setup milestone will document where each app reads its configuration.

Only the Supabase project URL and publishable key belong in mobile app
configuration. Database passwords, service-role keys and secret keys do not.
