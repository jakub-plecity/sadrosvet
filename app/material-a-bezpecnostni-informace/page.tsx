import {LegalPage} from "@/components/legal-page";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"Materiál a bezpečnostní informace · SádroSvět",
 description:"Informace o použitých materiálech a bezpečnostní pokyny pro svíčky a dekorace SádroSvět."
};

const safetyInstructions=[
 "Všechny svíčky jsou určeny pro dospělé svéprávné osoby.",
 "Udržujte svíčku mimo dosah dětí a domácích zvířat, mimo přímé sluneční záření (při vysokých teplotách může vosk měknout).",
 "Svíčky nejsou určeny ke konzumaci.",
 "Svíčku vždy umístěte na stabilní, rovný a nehořlavý povrch.",
 "Pokud svíčka obsahuje sušené květiny, bylinky nebo jiné přírodní dekorace, které by mohly zasahovat do ohně, před zapálením je odstraňte.",
 "Při prvním zapálení nechte vosk rozpustit v celé ploše nádoby, aby svíčka mohla využít všechen vosk a nedocházelo k tunelování.",
 "Knot před každým zapálením zkraťte na cca 3–5 mm, aby nebyl plamen příliš vysoký a svíčka zbytečně nekouřila.",
 "Udržujte povrch svíčky bez nečistot.",
 "Po zapálení se svíčkou nemanipulujte a nepřenášejte ji; nádoba i vosk mohou být velmi horké.",
 "Nenechávejte svíčku hořet bez dozoru, v průvanu nebo poblíž hořlavých předmětů.",
 "Doporučená doba hoření je 2–4 hodiny.",
 "Nikdy nehaste svíčku vodou. Horký vosk může vystříknout."
];

export default function Page(){
 return <LegalPage title="Materiál a bezpečnostní informace">
  <section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
   <h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Informace o použitých materiálech</h2>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Jak náš název napovídá, SádroSvět pro Vás vyrábí především sádrové dekorace. Některé naše výrobky plníme voskem nebo malujeme, a přinášíme tak další dílek k vytvoření Vaší ideální výzdoby.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Keramická sádra</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">K tvoření našich výrobků používáme nevypalovanou keramickou sádru, která je oproti běžné sádře těžší, pevnější a bělejší. Snáší také zahřátí při používání svíčky.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Sójový vosk a knoty</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Svíčky vyrábíme z přírodního sójového vosku s bavlněnými nebo dřevěnými knoty. Jedná se o rostlinný vosk bez ropných produktů, který hoří pomaleji a produkuje méně sazí. Vonné směsi do našich svíček nepoužíváme.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Dekorativní svíčky</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Některé naše svíčky mají především dekorační účel a jsou zdobeny námi sbíranými a sušenými přírodními materiály a voskovými ozdobami. <strong>Dekorativní svíčky označené jako výhradně ozdobné nezapalujte.</strong> U svíček výslovně určených k hoření si před zapálením pečlivě přečtěte bezpečnostní informace níže i pokyny přiložené k výrobku.</p>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Podle informací výrobce jsou všechny používané materiály zdravotně nezávadné.</p>
  </section>
  <section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
   <h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Bezpečnostní informace pro používání svíček</h2>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Následující pokyny vycházejí z bezpečnostních informací přiložených k výrobkům. Pokyny pro hoření platí pouze pro svíčky, u kterých je zapálení výslovně povoleno. <strong>Výhradně dekorativní svíčky nezapalujte.</strong></p>
   <ul className="my-5 list-disc space-y-3 rounded-xl bg-stone-50 py-5 pl-10 pr-5 text-base leading-7 text-stone-800">
    {safetyInstructions.map(instruction=><li key={instruction}>{instruction}</li>)}
   </ul>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Na štítcích umístěných na svíčkách se můžete setkat s bezpečnostními symboly. Vždy dodržujte jejich význam i konkrétní pokyny uvedené na štítku.</p>
  </section>
 </LegalPage>;
}
