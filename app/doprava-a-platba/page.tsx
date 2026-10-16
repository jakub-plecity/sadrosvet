import {LegalPage} from "@/components/legal-page";
import {shippingServices} from "@/lib/checkout";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Doprava a platba · SádroSvět",description:"Doručení objednávek a způsoby platby v e-shopu SádroSvět. Informace o online platbách přes Comgate."};
export default function Page(){return <LegalPage title="Doprava a platba">
<section>
<h2>Doprava</h2>
<p>Objednávky doručujeme prostřednictvím níže uvedených služeb. Aktuální cena dopravy se vždy zobrazí v košíku před odesláním objednávky.</p>
<ul>{shippingServices.filter(service=>service.available).map(service=><li key={service.id}><strong>{service.carrier} – {service.label}:</strong> {(service.priceMinor/100).toLocaleString("cs-CZ")} Kč{service.codMinor>0?` (dobírka +${(service.codMinor/100).toLocaleString("cs-CZ")} Kč)`:""}.</li>)}</ul>
<p>Zboží předáváme dopravci nejpozději do 7 pracovních dnů od odeslání objednávky.</p>
</section>
<section>
<h2>Způsoby platby</h2>
<h3>Online bankovní platby</h3>
<p>Platby pomocí bankovních tlačítek zajišťuje platební brána <a href="https://www.comgate.eu/cs/platebni-brana" target="_blank" rel="noopener noreferrer">Comgate</a>. Po výběru příslušné banky je zákazník přesměrován do jejího bezpečného prostředí, kde platbu potvrdí podle pokynů své banky. Dostupnost bank se řídí nabídkou platební brány.</p>
<p><strong>Důležité:</strong> Bankovní tlačítka jsou u poskytovatele aktivovaná, jejich dokončení přímo z košíku SádroSvět však zpřístupníme až po ověření integrace.</p>
<h3>Platba kartou Visa a Mastercard</h3>
<p>Po aktivaci karetních plateb bude zákazník přesměrován na zabezpečenou platební bránu Comgate, kde vyplní údaje o kartě a případně potvrdí platbu u své banky. <strong>Platby kartou zatím čekají na schválení karetními společnostmi Visa a Mastercard a nejsou dostupné.</strong></p>
<h3>Dobírka</h3>
<p>U doručovaných zásilek lze využít dobírku. Příplatek je uveden u jednotlivých dopravních služeb a v košíku. U samoobslužných boxů postupujte podle pokynů dopravce pro bezhotovostní zaplacení dobírky.</p>
<h3>Hotově při osobním převzetí</h3>
<p>Pokud je v košíku nabízena možnost osobního převzetí, lze zaplatit hotově při převzetí.</p>
</section>
<section>
<h2>Poskytovatel online plateb a reklamace plateb</h2>
<p>Online platby pro nás zajišťuje platební brána <a href="https://www.comgate.eu/cs/platebni-brana" target="_blank" rel="noopener noreferrer">Comgate</a>. Poskytovatelem je společnost Comgate, a.s., licencovaná platební instituce pod dohledem České národní banky. Platební komunikace je zabezpečená a přenášené údaje jsou šifrované.</p>
<address style={{fontStyle:"normal"}}><strong>Comgate, a.s.</strong><br/>Gočárova třída 1754/48b<br/>Hradec Králové<br/>E-mail: <a href="mailto:podpora@comgate.cz">podpora@comgate.cz</a><br/>Telefon: <a href="tel:+420228224267">+420 228 224 267</a></address>
<p>S dotazy nebo reklamacemi samotné online platby se můžete obrátit na Comgate. Ve věcech objednávek a zboží kontaktujte SádroSvět.</p>
<p>Více informací: <a href="https://help.comgate.eu/v1/docs/cs/platby-kartou" target="_blank" rel="noopener noreferrer">Jak fungují platby kartou</a> a <a href="https://help.comgate.eu/docs/bankovni-prevody" target="_blank" rel="noopener noreferrer">Jak fungují bankovní platby</a>.</p>
</section>
</LegalPage>}
