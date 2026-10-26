import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Opt-in check runs where Netlify injects the production database credentials.
// Target changes are always rolled back; this hook can never apply a migration.
if (process.env.SUPABASE_MIGRATION_CHECK === 'true') {
  if (process.env.CONTEXT !== 'production') throw new Error('Supabase check requires the production Netlify context');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./migrate-to-supabase.mjs', import.meta.url)), '--check'], {stdio: 'inherit'});
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
