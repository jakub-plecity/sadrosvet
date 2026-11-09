import {z} from "zod";

export const editablePageNames={
 "doprava-a-platba":"Doprava a platba",
 "obchodni-podminky":"Obchodní podmínky",
 "ochrana-osobnich-udaju":"Ochrana osobních údajů",
 "material-a-bezpecnostni-informace":"Materiál a bezpečnostní informace"
} as const;
export type EditablePageId=keyof typeof editablePageNames;
export const editablePageIdSchema=z.enum(["doprava-a-platba","obchodni-podminky","ochrana-osobnich-udaju","material-a-bezpecnostni-informace"]);
export const inlineRunSchema=z.object({
 text:z.string().max(8000),
 bold:z.boolean().optional(),
 italic:z.boolean().optional(),
 underline:z.boolean().optional(),
 href:z.string().max(400).refine(v=>/^(https:\/\/[^\s<>"]+|mailto:[^\s<>"]+|\/(?!\/)[^\s<>"]*)$/.test(v),"Neplatný odkaz").optional()
}).strict();
export const pageBlockSchema=z.object({
 key:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
 kind:z.enum(["h1","h2","h3","p","li","address","shippingRates","paymentAvailability"]),
 runs:z.array(inlineRunSchema).min(1).max(150),
 align:z.enum(["left","center","right","justify"]).default("left"),
 font:z.enum(["default","serif","sans"]).default("default"),
 size:z.enum(["normal","small","large","xlarge"]).default("normal"),
 anchor:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/).optional()
}).strict();
export const pageDocumentSchema=z.object({blocks:z.array(pageBlockSchema).min(1).max(350)}).strict().refine(
 doc=>JSON.stringify(doc).length<=170000&&doc.blocks.some(b=>b.kind==="h1"),
 "Dokument je příliš dlouhý nebo nemá hlavní nadpis."
);
export type PageBlock=z.infer<typeof pageBlockSchema>;
export type PageDocument=z.infer<typeof pageDocumentSchema>;
export const pageSettingKey=(id:EditablePageId)=>"editable-page:"+id;
