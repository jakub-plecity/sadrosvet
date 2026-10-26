import "server-only";
import {comgateConfigured} from "./comgate";
export function onlinePaymentsEnabled(){return process.env.ENABLE_REAL_CHECKOUT==="true"&&process.env.ENABLE_COMGATE_CHECKOUT==="true"&&process.env.COMGATE_TEST==="false"&&comgateConfigured();}
export function publicOnlinePaymentsEnabled(){return onlinePaymentsEnabled()&&process.env.COMGATE_ADMIN_ONLY==="false";}
