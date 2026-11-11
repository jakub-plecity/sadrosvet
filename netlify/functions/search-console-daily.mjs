import {createPrivateKey, sign} from "node:crypto";
import {getDatabase} from "../../lib/database-pool.mjs";

// Scheduled only once per day. Unique sync_date also protects against concurrent retries.
export const config = {schedule:"15 5 * * *"};
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const date = d => d.toISOString().slice(0,10);

async function accessToken(email,key){
  const now=Math.floor(Date.now()/1000);
  const assertion=[encode({alg:"RS256",typ:"JWT"}),encode({
    iss:email,scope:"https://www.googleapis.com/auth/webmasters.readonly",
    aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600
  })].join(".");
  const signature=sign("RSA-SHA256",Buffer.from(assertion),createPrivateKey(key)).toString("base64url");
  const response=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:assertion+"."+signature}),
    signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw new Error("oauth_"+response.status);
  const json=await response.json();
  if(typeof json.access_token!=="string")throw new Error("oauth_missing_token");
  return json.access_token;
}

export default async function(){
  if(process.env.DATABASE_MAINTENANCE==="true")return new Response(null,{status:204});
  const pool=getDatabase().pool;
  const today=date(new Date());
  // The insert is committed BEFORE any Google request. Even an error cannot trigger a second request that day.
  const claimed=await pool.query(
    "INSERT INTO search_console_sync(sync_date,status) VALUES ($1,'started') ON CONFLICT DO NOTHING RETURNING sync_date",[today]
  );
  if(claimed.rowCount===0)return new Response(null,{status:204});
  try {
    const email=process.env.GSC_SERVICE_ACCOUNT_EMAIL?.trim();
    const key=process.env.GSC_PRIVATE_KEY?.replaceAll("\\n","\n");
    const property=process.env.GSC_SITE_URL?.trim();
    if(!email||!key||!property)throw new Error("not_configured");
    const token=await accessToken(email,key);
    const end=new Date();end.setUTCDate(end.getUTCDate()-1);
    const start=new Date(end);start.setUTCDate(start.getUTCDate()-89);
    // Exactly one Search Analytics request. Include provisional recent data; subsequent daily runs reconcile it.
    const response=await fetch(
      "https://www.googleapis.com/webmasters/v3/sites/"+encodeURIComponent(property)+"/searchAnalytics/query",{
      method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({startDate:date(start),endDate:date(end),dimensions:["date"],rowLimit:25000,dataState:"all"}),
      signal:AbortSignal.timeout(30000)
    });
    if(!response.ok)throw new Error("gsc_"+response.status);
    const payload=await response.json();
    const rows=Array.isArray(payload.rows)?payload.rows:[];
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      for(const row of rows){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(row.keys?.[0]??""))continue;
        await client.query(`INSERT INTO search_console_daily(date,clicks,impressions,ctr,position)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT(date) DO UPDATE SET clicks=EXCLUDED.clicks,impressions=EXCLUDED.impressions,
          ctr=EXCLUDED.ctr,position=EXCLUDED.position,updated_at=now()`,[
          row.keys[0],Math.max(0,Math.round(Number(row.clicks)||0)),
          Math.max(0,Math.round(Number(row.impressions)||0)),
          Number(row.ctr)||0,Number(row.position)||0
        ]);
      }
      await client.query("UPDATE search_console_sync SET status='success',finished_at=now(),row_count=$2 WHERE sync_date=$1",[today,rows.length]);
      await client.query("COMMIT");
    }catch(err){await client.query("ROLLBACK");throw err;}finally{client.release();}
  }catch(err){
    const code=err instanceof Error?err.message:"unexpected_error";
    console.error("Search Console daily sync failed:",code.replace(/[^a-zA-Z0-9_]/g,"").slice(0,60));
    await pool.query("UPDATE search_console_sync SET status='error',error_code=$2,finished_at=now() WHERE sync_date=$1",[
      today,code.replace(/[^a-zA-Z0-9_]/g,"").slice(0,60)
    ]);
  }
  return new Response(null,{status:204});
}
