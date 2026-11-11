import {database,isAdmin} from "@/lib/server";
export const dynamic="force-dynamic";

type Daily={date:string;clicks:string|number;impressions:string|number;ctr:number;position:number};
export async function GET(){
  if(!await isAdmin())return Response.json({error:"Přístup odepřen."},{status:403});
  try{
    const db=database();
    const [data,latest]=await Promise.all([
      db.prepare("SELECT date::text AS date,clicks,impressions,ctr,position FROM search_console_daily WHERE date>=CURRENT_DATE-INTERVAL '95 days' ORDER BY date ASC").all<Daily>(),
      db.prepare("SELECT sync_date::text AS sync_date,status,started_at,finished_at,error_code FROM search_console_sync ORDER BY sync_date DESC LIMIT 1").first()
    ]);
    const rows=data.results.map(row=>({
      date:row.date,clicks:Number(row.clicks),impressions:Number(row.impressions),
      ctr:Number(row.ctr),position:Number(row.position)
    }));
    return Response.json({rows,sync:latest??null,configured:!!(process.env.GSC_SERVICE_ACCOUNT_EMAIL&&process.env.GSC_PRIVATE_KEY&&process.env.GSC_SITE_URL)},{
      headers:{"Cache-Control":"private, no-store"}
    });
  }catch{
    return Response.json({error:"Statistiky zatím nejsou dostupné. Ověřte databázovou migraci."},{status:503});
  }
}
