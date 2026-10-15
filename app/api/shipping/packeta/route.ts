import "server-only";
const env=process.env;
export function GET(){const key=(env as unknown as {PACKETA_API_KEY?:string}).PACKETA_API_KEY?.trim();return Response.json({apiKey:key&&/^[a-zA-Z0-9]{16}$/.test(key)?key:null},{headers:{"Cache-Control":"no-store"}});}
