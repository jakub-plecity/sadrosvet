import pg from 'pg';
import {copyToSupabase, savePrivateBackup} from './supabase-copy.mjs';

const status = process.argv.includes('--status');
const apply = process.argv.includes('--apply');
if (!status && !apply && !process.argv.includes('--check')) throw new Error('Choose --check (copy then roll back) or --apply');
if (process.env.DATABASE_PROVIDER === 'supabase') throw new Error('Migration requires Netlify as the current provider');
if (apply && process.env.MIGRATION_WRITES_PAUSED !== 'true') throw new Error('Pause all source writes before setting MIGRATION_WRITES_PAUSED=true');
if (!process.env.SUPABASE_DATABASE_URL) throw new Error('SUPABASE_DATABASE_URL is missing');
const url = new URL(process.env.SUPABASE_DATABASE_URL);
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
if (url.port === '6543') throw new Error('Use session pooler port 5432 or direct connection for migration');
if (!process.env.LEGACY_SOURCE_DATABASE_URL) throw new Error('LEGACY_SOURCE_DATABASE_URL is required for historical import');
const sourcePool = new pg.Pool({connectionString:process.env.LEGACY_SOURCE_DATABASE_URL,max:1,ssl:{rejectUnauthorized:true}});
const targetPool = new pg.Pool({connectionString: url.toString(), max: 1, connectionTimeoutMillis: 10000,
  ssl: {rejectUnauthorized: true, ...(process.env.SUPABASE_DATABASE_CA?.replaceAll('\\n', '\n') ? {ca: process.env.SUPABASE_DATABASE_CA?.replaceAll('\\n', '\n')} : {})}});
let source, target;
try {
  source = await sourcePool.connect(); target = await targetPool.connect();
  const saveBackup = async snapshot => {await savePrivateBackup(target,snapshot); console.log('Verified snapshot saved in private sadrosvet_backups schema');};
  if (status) {
    const targetTables = (await target.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(row=>row.tablename);
    console.log(JSON.stringify({targetTables,backupEnvironmentConfigured:Boolean(process.env.NETLIFY_BLOBS_CONTEXT)}));
    if(targetTables.includes('products')) console.log('Target products:',(await target.query('SELECT count(*)::int AS n FROM products')).rows[0].n);
  } else console.log(JSON.stringify(await copyToSupabase(source, target, {apply,saveBackup}), null, 2));
} catch (error) {
  // No driver messages, row data, or credentials in Netlify build logs.
  console.error('Migration failed; target transaction rolled back. Error code:', error?.code || error?.name || 'CHECK_FAILED');
  process.exitCode = 1;
} finally {
  source?.release(); target?.release();
  await targetPool.end(); await sourcePool.end();
}
