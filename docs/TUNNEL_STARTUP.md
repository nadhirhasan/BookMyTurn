# Expo Go tunnel startup on Windows

From the project root:

```powershell
cd C:\Users\pc\Mobile-Apps\BookMyTurn
npm run start:tunnel
```

Keep the terminal open. Scan its QR with the iPhone Camera, then open Expo Go.
Ctrl+C stops the server/tunnel. Run from BookMyTurn rather than C:\Users\pc.
The original npm start -- --tunnel --go command remains supported.

## Cause and fix

On this machine npm has already installed @expo/ngrok 4.1.3 globally and the
module loads successfully by absolute path. Expo SDK 57's global resolver fails
to find it: its Windows default path uses LocalAppData, while this npm prefix
is in AppData/Roaming. Its global-prefix discovery also spawns npm.cmd directly,
which is not a supported executable spawn on this Node/Windows combination.
After installation, Expo repeats the same failed lookup and reports that the
successful install is missing.

The Customer start script now launches Expo with npm's global root added to the
child process's NODE_PATH, only for Windows tunnel mode. It discovers a custom
prefix using npm's JS CLI entry point through Node and includes the standard
APPDATA fallback. Existing NODE_PATH entries and local dependency precedence are
preserved. Expo's own CLI still manages the server, ngrok version checks and QR.

No package is installed, node_modules file patched, global config changed or
path specific to this user's machine embedded in the launcher. Ordinary LAN/web
startup continues to use the installed Expo CLI. A fresh machine still needs a
compatible ngrok package; this fix addresses discovering an existing install.

## Verification

- Reproduced: global module loads, Expo resolver returns missing.
- Confirmed: exposing the existing global module root makes Expo's resolver find it.
- Actual root command reached Tunnel connected / Tunnel ready on isolated port
  8083 without installing anything or prompting for ngrok.
- Public Metro status and iPhone Expo Go manifest both returned HTTP 200 through
  the advertised Expo Go tunnel transport.
- Lint/TypeScript and forwarding through both root commands passed.
- Ctrl+C closed the tunnel and Metro cleanly; the test port was no longer listening.
- Feature PR/CI results are recorded on the fix PR.

This startup fix is a separate PR stacked on the authentication feature. It does
not change Auth settings or resolve the separately tracked signup-setting gate.
