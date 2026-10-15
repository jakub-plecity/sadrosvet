import {isAdmin} from "@/lib/server";
import {AdminLogin,AdminLogout} from "@/components/admin/login";
import Admin from "./portal";
export const dynamic="force-dynamic";
export const metadata={title:"Administrace · SádroSvět"};
export default async function Page(){if(!await isAdmin())return <AdminLogin/>;return <><div style={{padding:"1rem",textAlign:"right"}}><AdminLogout/></div><Admin adminRestricted={true}/></>;}
