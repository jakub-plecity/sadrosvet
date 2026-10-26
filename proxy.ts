import {NextResponse} from 'next/server';
export function proxy() {
  if (process.env.DATABASE_MAINTENANCE === 'true') {
    return NextResponse.json({error:'Probíhá krátká údržba e-shopu. Zkuste to prosím za několik minut.'},
      {status:503,headers:{'Retry-After':'120','Cache-Control':'no-store'}});
  }
  return NextResponse.next();
}
export const config = {matcher:['/api/:path*']};
