// Internal database state keys remain unchanged; only administrator-facing labels are Czech.
export const orderStatusLabels={
 pending:"Nová – čeká na potvrzení",
 confirmed:"Potvrzená",
 processing:"Připravuje se",
 shipped:"Odeslaná",
 ready_for_pickup:"Připravená k vyzvednutí",
 completed:"Dokončená",
 cancelled:"Stornovaná"
} as const;
export type OrderState=keyof typeof orderStatusLabels;
export const orderTransitions:Record<OrderState,OrderState[]>={
 pending:["confirmed","cancelled"],
 confirmed:["processing","cancelled"],
 processing:["shipped","ready_for_pickup","cancelled"],
 shipped:["completed"],
 ready_for_pickup:["completed","cancelled"],
 completed:[],
 cancelled:[]
};
export const orderStateLabel=(state:string)=>orderStatusLabels[state as OrderState]??"Neznámý stav";
export const paymentMethodLabels:Record<string,string>={comgate:"Online platba Comgate",cod:"Dobírka",cash:"Hotově při převzetí"};
export const paymentStatusLabels:Record<string,string>={paid:"Zaplaceno",unpaid:"Nezaplaceno",pending:"Čeká na platbu",failed:"Platba se nezdařila",refunded:"Vráceno",cancelled:"Zrušeno"};
export const paymentMethodLabel=(method:string)=>paymentMethodLabels[method]??"Jiná metoda";
export const paymentStatusLabel=(status:string)=>paymentStatusLabels[status]??"Neznámý stav platby";
