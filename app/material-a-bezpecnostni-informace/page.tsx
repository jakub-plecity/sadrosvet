import {LegalPage} from "@/components/legal-page";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"Materiál a bezpečnostní informace · SádroSvět",
 description:"Informace o použitých materiálech a bezpečnostní pokyny pro svíčky a dekorace SádroSvět."
};

const safetyInstructions=[
 "Všechny svíčky SádroSvět jsou výhradně dekorativní. Nezapalujte je, a to ani po odstranění ozdob.",
 "Knot je součástí dekorace a není určen k zapálení.",
 "Výrobky uchovávejte mimo dosah dětí a domácích zvířat. Nejsou to hračky a nejsou určeny ke konzumaci.",
 "Dekoraci umístěte na stabilní a rovný povrch, kde nemůže spadnout.",
 "Chraňte výrobky před otevřeným ohněm, zdroji tepla a přímým slunečním zářením. Při vysokých teplotách může vosk měknout a deformovat se.",
 "Se sádrovými výrobky zacházejte opatrně. Pád nebo náraz je může poškodit.",
 "Sádrové výrobky čistěte jemně navlhčeným hadříkem. Neponořujte je do vody a nedávejte je do myčky.",
 "Dodržujte také pokyny uvedené u konkrétního výrobku a na jeho štítku."
];

export default function Page(){
 return <LegalPage title="Materiál a bezpečnostní informace">
  <section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
   <h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Informace o použitých materiálech</h2>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Jak náš název napovídá, SádroSvět pro Vás vyrábí především sádrové dekorace. Některé naše výrobky plníme voskem nebo malujeme, a přinášíme tak další dílek k vytvoření Vaší ideální výzdoby.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Keramická sádra</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">K tvoření našich výrobků používáme nevypalovanou keramickou sádru, která je oproti běžné sádře těžší, pevnější a bělejší. Výrobky nejsou určeny pro kontakt s otevřeným ohněm ani k použití jako svícny.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Sójový vosk a knoty</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Svíčky vyrábíme z přírodního sójového vosku s bavlněnými nebo dřevěnými knoty. Vosk používáme k výrobě ozdobných výrobků. Přítomnost knotu neznamená, že je výrobek určen k zapálení. Vonné směsi do našich svíček nepoužíváme.</p>
   <h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Dekorativní svíčky</h3>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Všechny naše svíčky slouží výhradně jako dekorace. Mohou obsahovat sušené přírodní materiály a voskové ozdoby. <strong>Svíčky nezapalujte. Nejsou určeny jako zdroj světla ani tepla.</strong></p>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Podle informací výrobce jsou všechny používané materiály zdravotně nezávadné.</p>
  </section>
  <section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
   <h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Bezpečné používání dekorací</h2>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Následující pokyny platí pro dekorativní výrobky SádroSvět. <strong>Žádná naše svíčka není určena k hoření.</strong></p>
   <ul className="my-5 list-disc space-y-3 rounded-xl bg-stone-50 py-5 pl-10 pr-5 text-base leading-7 text-stone-800">
    {safetyInstructions.map(instruction=><li key={instruction}>{instruction}</li>)}
   </ul>
   <p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Na štítcích umístěných na svíčkách se můžete setkat s bezpečnostními symboly. Vždy dodržujte jejich význam i konkrétní pokyny uvedené na štítku.</p>
  </section>
 </LegalPage>;
}
