import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Stav platby · SádroSvět",robots:{index:false,follow:false}};
export default function PaymentResult(){return <main style={{maxWidth:720,margin:"5rem auto",padding:"1.5rem",textAlign:"center"}}><h1>Stav online platby</h1><p>Návrat na tuto stránku sám o sobě <strong>nepotvrzuje zaplacení</strong>. Úhradu je nutné ověřit přímo u Comgate.</p><p>Pro ověření objednávky napište na <a href="mailto:sadrosvet@seznam.cz">sadrosvet@seznam.cz</a> a uveďte číslo objednávky.</p><p><Link href="/">Zpět do obchodu SádroSvět</Link></p></main>}
