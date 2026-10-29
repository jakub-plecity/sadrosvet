import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
if(['SUPABASE_MIGRATION_APPLY','SUPABASE_MIGRATION_STATUS','SUPABASE_MIGRATION_CHECK'].some(key=>process.env[key]==='true'))throw Error('Initial migration is complete; disable legacy migration flags');
if(process.env.CONTEXT==='production'){
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./verify-supabase-production.mjs',import.meta.url))],{stdio:'inherit'});
 if(result.error||result.status!==0)process.exit(result.status||1);
}
