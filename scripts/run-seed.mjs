// Bundles scripts/seed.ts with esbuild and runs it with .env loaded.
import { build } from 'esbuild';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Load .env into process.env
try {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // no .env — rely on existing environment
}

const outfile = join(mkdtempSync(join(tmpdir(), 'seed-')), 'seed.mjs');
await build({
  entryPoints: [join(root, 'scripts/seed.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});
await import(pathToFileURL(outfile).href);
