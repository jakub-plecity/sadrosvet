import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Děkujeme za objednávku · Stav platby · SádroSvět",robots:{index:false,follow:false}};
export default function PaymentResult(){
 return <main style={{maxWidth:680,margin:"5rem auto",padding:"2rem 1.5rem",textAlign:"center"}}>
  <div style={{fontSize:34,marginBottom:"1rem"}} aria-hidden="true">♡</div>
  <h1>Děkujeme za objednávku!</h1>
  <p style={{fontSize:"1.15rem",lineHeight:1.7}}>Byli jste přesměrováni zpět z platební brány Comgate. Výsledek platby nyní bezpečně ověřujeme.</p>
  <div style={{margin:"1.5rem 0",padding:"1.25rem",border:"1px solid #ddd",borderRadius:12,textAlign:"left"}}>
   <h2 style={{fontSize:"1.15rem",marginTop:0}}>Co bude následovat?</h2>
   <p>Jakmile Comgate potvrdí úhradu, objednávku označíme jako zaplacenou a odešleme vám potvrzovací e-mail.</p>
   <p>Pokud jste platbu zrušili nebo nedokončili, objednávku zatím nepovažujeme za uhrazenou. Výsledek může chvíli trvat.</p>
  </div>
  <p style={{fontSize:14,opacity:0.8}}>Samotný návrat na tuto stránku není dokladem o zaplacení. Pokud potvrzení nepřijde nebo si nejste jistí stavem objednávky, napište nám na <a href="mailto:sadrosvet@seznam.cz">sadrosvet@seznam.cz</a> a přiložte číslo objednávky.</p>
  <p><Link className="button blue" href="/">Pokračovat v nákupu</Link></p>
 </main>;
}
