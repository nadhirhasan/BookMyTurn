import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const expoCli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const args = process.argv.slice(2);
if (!args.includes('--port')) args.unshift('--port', '8084');
const environment = { ...process.env };

const tunnelRequested = args.includes('--tunnel') || args.some((arg, index) =>
  ((arg === '--host' || arg === '-m') && args[index + 1] === 'tunnel') || arg === '--host=tunnel');
if (process.platform === 'win32' && tunnelRequested) {
  const globalRoots = [];
  // npm supplies its JS entry point to lifecycle scripts. Invoke it with Node:
  // spawning npm.cmd directly fails on current Windows Node versions unless a
  // shell is used, which is why Expo's global-prefix probe misses this install.
  if (environment.npm_execpath) {
    const result = spawnSync(process.execPath, [environment.npm_execpath, 'root', '--global'], {
      encoding: 'utf8', timeout: 10000, windowsHide: true,
    });
    const root = result.stdout?.trim();
    if (result.status === 0 && root && path.isAbsolute(root)) globalRoots.push(root);
  }
  // Also support invoking this script directly, outside an npm lifecycle.
  if (environment.APPDATA) globalRoots.push(path.join(environment.APPDATA, 'npm', 'node_modules'));
  const existing = environment.NODE_PATH?.split(path.delimiter).filter(Boolean) ?? [];
  environment.NODE_PATH = [...new Set([...globalRoots, ...existing])].join(path.delimiter);
}

// A fresh Node process reads NODE_PATH before loading Expo. Local project
// dependencies still take precedence. Nothing is installed, patched or written
// to the user's global configuration. Inherit the terminal for Expo's QR/input.
const child = spawn(process.execPath, [expoCli, 'start', ...args], {
  cwd: projectRoot, env: environment, stdio: 'inherit', windowsHide: true,
});
child.once('error', () => {
  console.error('Could not start Expo. Check that Node and the project dependencies are available.');
  process.exitCode = 1;
});
child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
// Console Ctrl+C reaches the child too. Let Expo finish closing its tunnel
// before this launcher exits; do not send it a second interrupt.
process.once('SIGINT', () => {});
process.once('SIGTERM', () => { child.kill('SIGTERM'); });
