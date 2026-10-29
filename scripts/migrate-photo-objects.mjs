import {createHash} from 'node:crypto';
export async function migratePhotoObjects(db,{fetchImage=fetch,sourceOrigin='https://sadrosvet.cz'}={}){
 const photos=(await db.query("SELECT image FROM photos UNION SELECT image FROM products WHERE image<>''")).rows.map(r=>r.image);
 const galleries=(await db.query("SELECT images FROM products")).rows.flatMap(r=>JSON.parse(r.images||'[]'));
 const keys=[...new Set([...photos,...galleries].map(url=>/^\/api\/images\/([a-z0-9-]+)$/.exec(url)?.[1]).filter(Boolean))].sort();
 let totalBytes=0;
 for(const key of keys){
  const existing=(await db.query('SELECT bytes,sha256,size_bytes FROM photo_objects WHERE key=$1',[key])).rows[0];
  if(existing){if(createHash('sha256').update(existing.bytes).digest('hex')!==existing.sha256||existing.bytes.length!==existing.size_bytes)throw Error('Photo verification failed');totalBytes+=existing.size_bytes;continue;}
  const response=await fetchImage(sourceOrigin+'/api/images/'+key,{signal:AbortSignal.timeout(30000)});
  if(!response.ok||new URL(response.url||sourceOrigin).origin!==sourceOrigin)throw Error('Source photo could not be downloaded');
  const bytes=Buffer.from(await response.arrayBuffer());
  const type=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!type||bytes.length>12*1024*1024)throw Error('Invalid source photo');
  const hash=createHash('sha256').update(bytes).digest('hex');
  await db.query('INSERT INTO photo_objects(key,bytes,content_type,sha256,size_bytes) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[key,bytes,type,hash,bytes.length]);
  const saved=(await db.query('SELECT bytes,sha256 FROM photo_objects WHERE key=$1',[key])).rows[0];
  if(!saved||createHash('sha256').update(saved.bytes).digest('hex')!==hash||saved.sha256!==hash)throw Error('Photo copy verification failed');
  totalBytes+=bytes.length;
  if(totalBytes>100*1024*1024)throw Error('Photo migration exceeds configured size limit');
 }
 return {photos:keys.length,totalBytes,checksumsVerified:true};
}
