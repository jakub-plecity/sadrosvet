import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
import {getDatabase} from '@netlify/database';
import pg from 'pg';
import {copyToSupabase} from './supabase-copy.mjs';

const apply = process.argv.includes('--apply');
if (!apply && !process.argv.includes('--check')) throw new Error('Choose --check (copy then roll back) or --apply');
if (process.env.DATABASE_PROVIDER === 'supabase') throw new Error('Migration requires Netlify as the current provider');
if (apply && process.env.MIGRATION_WRITES_PAUSED !== 'true') throw new Error('Pause all source writes before setting MIGRATION_WRITES_PAUSED=true');
if (!process.env.SUPABASE_DATABASE_URL) throw new Error('SUPABASE_DATABASE_URL is missing');
const url = new URL(process.env.SUPABASE_DATABASE_URL);
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
if (url.port === '6543') throw new Error('Use session pooler port 5432 or direct connection for migration');
const sourcePool = getDatabase().pool;
const targetPool = new pg.Pool({connectionString: url.toString(), max: 1, connectionTimeoutMillis: 10000,
  ssl: {rejectUnauthorized: true, ...(process.env.SUPABASE_DATABASE_CA?.replaceAll('\\n', '\n') ? {ca: process.env.SUPABASE_DATABASE_CA?.replaceAll('\\n', '\n')} : {})}});
let source, target;
try {
  source = await sourcePool.connect(); target = await targetPool.connect();
  const saveBackup = async snapshot => {
    const store = getStore({name:'database-migration-backups',consistency:'strong'});
    const data = JSON.stringify(snapshot);
    const digest = createHash('sha256').update(data).digest('hex');
    const key = 'before-supabase-' + Date.now() + '.json';
    await store.set(key,data,{metadata:{sha256:digest,source:'Netlify Database'}});
    const restored = await store.get(key,{type:'text',consistency:'strong'});
    if (typeof restored !== 'string' || createHash('sha256').update(restored).digest('hex') !== digest) throw new Error('Backup verification failed');
    console.log('Verified database backup saved to private Netlify Blobs store:',key);
  };
  console.log(JSON.stringify(await copyToSupabase(source, target, {apply,saveBackup}), null, 2));
} catch (error) {
  // No driver messages, row data, or credentials in Netlify build logs.
  console.error('Migration failed; target transaction rolled back. Error code:', error?.code || 'CHECK_FAILED');
  process.exitCode = 1;
} finally {
  source?.release(); target?.release();
  await targetPool.end(); await sourcePool.end();
}
