import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';

const identifier = value => '"' + value.replaceAll('"', '""') + '"';
const qualified = table => 'public.' + identifier(table);
const fingerprint = rows => createHash('sha256').update(rows.map(row => row.record).sort().join('\n')).digest('hex');
const tableNames = async client => (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(row => row.tablename);

// Both connections are held for the full transaction. No outgoing email or payment calls.
export async function copyToSupabase(source, target, {apply = false, saveBackup, migrationDirectory = new URL('../netlify/database/migrations/', import.meta.url)} = {}) {
  const files = (await readdir(migrationDirectory)).filter(name => name.endsWith('.sql')).sort();
  const migrations = await Promise.all(files.map(async name => ({name, sql: await readFile(new URL(name, migrationDirectory), 'utf8')})));
  const expected = [...new Set(migrations.flatMap(({sql}) => [...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z_0-9]*)/gi)].map(match => match[1])))].sort();
  let sourceBegun = false, targetBegun = false;
  try {
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); sourceBegun = true;
    await source.query("SET LOCAL TIME ZONE 'UTC'");
    await target.query('BEGIN'); targetBegun = true;
    await target.query("SET LOCAL TIME ZONE 'UTC'");
    await target.query("SET LOCAL lock_timeout = '10s'");
    await target.query("SELECT pg_advisory_xact_lock(hashtext('sadrosvet-supabase-migration'))");
    if ((await tableNames(target)).length) throw new Error('Target public schema is not empty; no data changed');
    const actual = await tableNames(source);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Source tables differ from repository migrations; inspect schema before copying');
    for (const migration of migrations) await target.query(migration.sql);
    const created = await tableNames(target);
    if (JSON.stringify(created) !== JSON.stringify(expected)) throw new Error('Unexpected migration tables');
    // Only tables created by this transaction are emptied, removing historical seeds.
    await target.query('TRUNCATE ' + expected.map(qualified).join(', ') + ' RESTART IDENTITY');
    const dependencies = (await target.query(`SELECT child.relname AS child, parent.relname AS parent
      FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid
      JOIN pg_class parent ON parent.oid=c.confrelid JOIN pg_namespace n ON n.oid=child.relnamespace
      WHERE c.contype='f' AND n.nspname='public'`)).rows;
    const ordered = [];
    while (ordered.length < expected.length) {
      const next = expected.find(table => !ordered.includes(table) && dependencies.filter(d => d.child === table).every(d => ordered.includes(d.parent)));
      if (!next) throw new Error('Cyclic or unsupported foreign keys');
      ordered.push(next);
    }
    const report = [];
    const backupTables = {};
    for (const table of ordered) {
      const columns = async client => (await client.query(`SELECT column_name,data_type,udt_name,is_identity,is_generated
        FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table])).rows;
      if (JSON.stringify(await columns(source)) !== JSON.stringify(await columns(target))) throw new Error('Schema mismatch: ' + table);
      const rows = (await source.query(`SELECT to_jsonb(t)::text AS record FROM ${qualified(table)} t LIMIT 100001`)).rows;
      backupTables[table] = rows.map(row => row.record);
      if (rows.length > 100000) throw new Error('Table exceeds bounded migration size: ' + table);
      if (rows.length) await target.query(`INSERT INTO ${qualified(table)} OVERRIDING SYSTEM VALUE SELECT * FROM jsonb_populate_recordset(NULL::${qualified(table)}, $1::jsonb)`, ['[' + rows.map(row => row.record).join(',') + ']']);
      const copied = (await target.query(`SELECT to_jsonb(t)::text AS record FROM ${qualified(table)} t`)).rows;
      if (copied.length !== rows.length || fingerprint(copied) !== fingerprint(rows)) throw new Error('Data verification failed: ' + table);
      report.push({table, rows: rows.length, verified: true});
    }
    // Preserve the identity counter including gaps from cancelled/rolled-back orders.
    const seq = (await source.query("SELECT pg_get_serial_sequence('public.customer_orders', 'order_number') AS name")).rows[0].name;
    if (!/^public\.[a-z_][a-z_0-9]*$/.test(seq)) throw new Error('Unexpected order sequence');
    const sequence = (await source.query('SELECT last_value::text AS value, is_called FROM ' + qualified(seq.slice(7)))).rows[0];
    await target.query("SELECT setval(pg_get_serial_sequence('public.customer_orders','order_number'), $1::bigint, $2::boolean)", [sequence.value, sequence.is_called]);
    // Supabase Data API must not expose customer/order tables to anonymous clients.
    for (const table of expected) {
      await target.query('ALTER TABLE ' + qualified(table) + ' ENABLE ROW LEVEL SECURITY');
      await target.query('REVOKE ALL ON TABLE ' + qualified(table) + ' FROM PUBLIC, anon, authenticated');
    }
    await target.query('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated');
    await target.query('CREATE TABLE public.sadrosvet_schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    await target.query('ALTER TABLE public.sadrosvet_schema_migrations ENABLE ROW LEVEL SECURITY');
    await target.query('REVOKE ALL ON public.sadrosvet_schema_migrations FROM PUBLIC, anon, authenticated');
    for (const {name, sql} of migrations) await target.query('INSERT INTO public.sadrosvet_schema_migrations(name,sha256) VALUES($1,$2)', [name, createHash('sha256').update(sql).digest('hex')]);
    if (apply) {
      if (!saveBackup) throw new Error('Durable backup is required before commit');
      await saveBackup({format:1, createdAt:new Date().toISOString(), migrations, tables:backupTables, orderSequence:{name:seq,...sequence}});
    }
    await target.query(apply ? 'COMMIT' : 'ROLLBACK'); targetBegun = false;
    await source.query('ROLLBACK'); sourceBegun = false;
    return {applied: apply, tables: report};
  } finally {
    if (targetBegun) await target.query('ROLLBACK').catch(() => {});
    if (sourceBegun) await source.query('ROLLBACK').catch(() => {});
  }
}

// Durable, access-restricted export, separate from the mutable application tables.
// Uses the same target transaction: copying cannot commit without its backup.
export async function savePrivateBackup(target,snapshot) {
  const data=JSON.stringify(snapshot);
  const digest=createHash('sha256').update(data).digest('hex');
  const id='before-supabase-'+Date.now();
  await target.query('CREATE SCHEMA IF NOT EXISTS sadrosvet_backups');
  await target.query('REVOKE ALL ON SCHEMA sadrosvet_backups FROM PUBLIC, anon, authenticated');
  await target.query('CREATE TABLE IF NOT EXISTS sadrosvet_backups.exports (id text PRIMARY KEY, sha256 text NOT NULL, snapshot text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())');
  await target.query('ALTER TABLE sadrosvet_backups.exports ENABLE ROW LEVEL SECURITY');
  await target.query('REVOKE ALL ON sadrosvet_backups.exports FROM PUBLIC, anon, authenticated');
  await target.query('INSERT INTO sadrosvet_backups.exports(id,sha256,snapshot) VALUES($1,$2,$3)',[id,digest,data]);
  const stored=(await target.query('SELECT snapshot FROM sadrosvet_backups.exports WHERE id=$1',[id])).rows[0]?.snapshot;
  if(typeof stored!=='string'||createHash('sha256').update(stored).digest('hex')!==digest) throw new Error('Backup verification failed');
}
