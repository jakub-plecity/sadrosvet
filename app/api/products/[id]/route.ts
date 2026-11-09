import {database,guard,productInput,failure} from "@/lib/server";
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{const denied=await guard(request);if(denied)return denied;const {id}=await params;const p=productInput.parse(await request.json());if(!p.revision)return Response.json({error:"Chybí verze produktu."},{status:400});const r=await database().prepare("UPDATE products SET name=$1,description=$2,detailed_description=$3,dimensions=$4,weight=$5,category=$6,price_minor=$7,stock=$8,image=$9,images=$10,status=$11,sample=$12,revision=revision+1,updated_at=$13 WHERE id=$14 AND revision=$15").bind(p.name,p.description,p.detailedDescription,p.dimensions,p.weight,p.category,p.priceMinor,p.stock,p.images?.[0]??p.image,JSON.stringify(p.images??(p.image?[p.image]:[])),p.status,p.sample,new Date().toISOString(),id,p.revision).run();if(!r.meta.changes)return Response.json({error:"Produkt mezitím upravil jiný uživatel. Obnovte seznam a otevřete jej znovu."},{status:409});return Response.json({id});}catch(e){return failure(e);}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const denied=await guard(request);if(denied)return denied;
  const {id}=await params;
  const body=await request.json() as {revision?:number;permanent?:boolean};
  if(!Number.isInteger(body.revision))return Response.json({error:"Chybí verze produktu."},{status:400});
  const db=database();
  if(body.permanent===true){
   const linked=await db.prepare("SELECT 1 AS linked FROM customer_order_items WHERE product_id=$1 LIMIT 1").bind(id).first<{linked:number}>();
   if(linked)return Response.json({error:"Produkt je součástí historické objednávky. Pro zachování objednávek jej můžete archivovat.",canArchive:true},{status:409});
  }
  const statement=body.permanent===true
   ? db.prepare("DELETE FROM products WHERE id=$1 AND revision=$2").bind(id,body.revision)
   : db.prepare("UPDATE products SET status='archived',revision=revision+1,updated_at=$1 WHERE id=$2 AND revision=$3").bind(new Date().toISOString(),id,body.revision);
  try{
   const result=await statement.run();
   if(!result.meta.changes)return Response.json({error:"Produkt se změnil. Obnovte seznam."},{status:409});
   return Response.json({id,archived:body.permanent!==true});
  }catch(error){
   // Handle a concurrent order inserted after our reference check.
   if(body.permanent===true&&typeof error==="object"&&error!==null&&"code" in error&&error.code==="23503"){
    return Response.json({error:"Produkt je součástí objednávky a nelze jej trvale smazat. Můžete jej archivovat.",canArchive:true},{status:409});
   }
   throw error;
  }
 }catch(e){return failure(e);}
}
