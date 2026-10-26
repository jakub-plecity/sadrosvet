import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const apply = process.env.SUPABASE_MIGRATION_APPLY === 'true';
const check = process.env.SUPABASE_MIGRATION_CHECK === 'true';
if (apply || check) {
  if (process.env.CONTEXT !== 'production') throw new Error('Supabase migration requires production context');
  if (apply && process.env.DATABASE_MAINTENANCE !== 'true') throw new Error('Maintenance must be deployed before copying');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./migrate-to-supabase.mjs', import.meta.url)), apply ? '--apply' : '--check'], {stdio:'inherit'});
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
