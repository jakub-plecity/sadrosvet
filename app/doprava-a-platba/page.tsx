import {LegalPage} from "@/components/legal-page";
import {shippingServices} from "@/lib/checkout";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Doprava a platba · SádroSvět",description:"Doručení objednávek a způsoby platby v e-shopu SádroSvět. Informace o online platbách přes Comgate."};
export default function Page(){return <LegalPage title="Doprava a platba">
<section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
<h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Doprava</h2>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Objednávky doručujeme prostřednictvím níže uvedených služeb. Aktuální cena dopravy se vždy zobrazí v košíku před odesláním objednávky.</p>
<ul className="my-5 space-y-3 rounded-xl bg-stone-50 p-5 text-base leading-7 text-stone-800">{shippingServices.filter(service=>service.available).map(service=><li key={service.id}><strong>{service.carrier} – {service.label}:</strong> {(service.priceMinor/100).toLocaleString("cs-CZ")} Kč{service.codMinor>0?` (dobírka +${(service.codMinor/100).toLocaleString("cs-CZ")} Kč)`:""}.</li>)}</ul>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Zboží předáváme dopravci nejpozději do 7 pracovních dnů od odeslání objednávky.</p>
</section>
<section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
<h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Způsoby platby</h2>
<h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Online bankovní platby</h3>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Platby pomocí bankovních tlačítek zajišťuje platební brána <a href="https://www.comgate.eu/cs/platebni-brana" target="_blank" rel="noopener noreferrer">Comgate</a>. Po výběru příslušné banky je zákazník přesměrován do jejího bezpečného prostředí, kde platbu potvrdí podle pokynů své banky. Dostupnost bank se řídí nabídkou platební brány.</p>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700"><strong>Důležité:</strong> Bankovní tlačítka jsou u poskytovatele aktivovaná, jejich dokončení přímo z košíku SádroSvět však zpřístupníme až po ověření integrace.</p>
<h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Platba kartou Visa a Mastercard</h3>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Po aktivaci karetních plateb bude zákazník přesměrován na zabezpečenou platební bránu Comgate, kde vyplní údaje o kartě a případně potvrdí platbu u své banky. <strong>Platby kartou zatím čekají na schválení karetními společnostmi Visa a Mastercard a nejsou dostupné.</strong></p>
<h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Dobírka</h3>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">U doručovaných zásilek lze využít dobírku. Příplatek je uveden u jednotlivých dopravních služeb a v košíku. U samoobslužných boxů postupujte podle pokynů dopravce pro bezhotovostní zaplacení dobírky.</p>
<h3 className="mt-7 mb-3 text-lg font-semibold leading-snug text-stone-900 sm:text-xl">Hotově při osobním převzetí</h3>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Pokud je v košíku nabízena možnost osobního převzetí, lze zaplatit hotově při převzetí.</p>
</section>
<section className="mb-10 rounded-2xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
<h2 className="mb-5 border-b border-stone-200 pb-4 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Poskytovatel online plateb a reklamace plateb</h2>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Online platby pro nás zajišťuje platební brána <a href="https://www.comgate.eu/cs/platebni-brana" target="_blank" rel="noopener noreferrer">Comgate</a>. Poskytovatelem je společnost Comgate, a.s., licencovaná platební instituce pod dohledem České národní banky. Platební komunikace je zabezpečená a přenášené údaje jsou šifrované.</p>
<address className="my-5 rounded-xl bg-stone-50 p-5 text-base leading-8 text-stone-800" style={{fontStyle:"normal"}}><strong>Comgate, a.s.</strong><br/>Gočárova třída 1754/48b<br/>Hradec Králové<br/>E-mail: <a href="mailto:podpora@comgate.cz">podpora@comgate.cz</a><br/>Telefon: <a href="tel:+420228224267">+420 228 224 267</a></address>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">S dotazy nebo reklamacemi samotné online platby se můžete obrátit na Comgate. Ve věcech objednávek a zboží kontaktujte SádroSvět.</p>
<p className="mb-4 max-w-prose text-base leading-8 text-stone-700">Více informací: <a href="https://help.comgate.eu/v1/docs/cs/platby-kartou" target="_blank" rel="noopener noreferrer">Jak fungují platby kartou</a> a <a href="https://help.comgate.eu/docs/bankovni-prevody" target="_blank" rel="noopener noreferrer">Jak fungují bankovní platby</a>.</p>
</section>
</LegalPage>}
