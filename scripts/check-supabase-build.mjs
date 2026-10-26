import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const apply = process.env.SUPABASE_MIGRATION_APPLY === 'true';
const status = process.env.SUPABASE_MIGRATION_STATUS === 'true';
const check = process.env.SUPABASE_MIGRATION_CHECK === 'true';
if (apply || check || status) {
  if (process.env.CONTEXT !== 'production') throw new Error('Supabase migration requires production context');
  if (apply && process.env.DATABASE_MAINTENANCE !== 'true') throw new Error('Maintenance must be deployed before copying');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./migrate-to-supabase.mjs', import.meta.url)), status ? '--status' : apply ? '--apply' : '--check'], {stdio:'inherit'});
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}

// Apply the approved catalog correction once, without overriding later admin edits.
if (process.env.CONTEXT === 'production' && process.env.DATABASE_PROVIDER === 'supabase') {
  const {applyCatalogCorrection} = await import('./correct-miska-category.mjs');
  await applyCatalogCorrection(undefined,{closePool:false});
  const {applyFormalCatalogCopy} = await import("./formal-catalog-copy.mjs");
  await applyFormalCatalogCopy();
}
