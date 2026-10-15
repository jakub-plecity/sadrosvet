# Automatická expedice Zásilkovny — nastavení

Oficiální dokumentace API: https://docs.packeta.com/docs/getting-started/packeta-api
Vytváření zásilek: https://docs.packeta.com/docs/api-reference/api-methods
Tisk A6 štítků: https://docs.packeta.com/docs/label-printing/packeta-label

## Netlify Environment variables — Production

- `PACKETA_API_PASSWORD`: **tajné heslo pro SOAP/REST API Zásilkovny**, nikoli veřejný API klíč widgetu. Nikdy nevkládat do GitHubu ani posílat v chatu.
- `PACKETA_SENDER_INDICATION`: kód odesílatele (Indication) ze sekce *Odesílatelé / Senders* v klientské sekci Packeta.
- `PACKETA_HOME_DELIVERY_CARRIER_ID`: skutečné ID dopravce pro službu doručení na adresu v ČR. Je nutné ověřit v partnerském seznamu dopravců; nehádat. Vytváření zásilek na adresu bez něj vrací chybu.
- `PACKETA_API_KEY`: dosavadní veřejný klíč pro mapu výdejních míst (jiný než heslo API).

Po změně proměnných Netlify znovu nasadit aplikaci.

## Postup

1. V objednávce Zásilkovny v /admin/objednavky vyplnit hmotnost už zabaleného balíku.
2. Kliknout na *Vytvořit zásilku přes API Zásilkovny*. Backend převezme příjemce, telefon, e-mail, službu, ID místa, hodnotu zboží a dobírku z uložené objednávky.
3. Zobrazí se barcode a odkaz na PDF A6 štítek, který je přes backend stažen ze Zásilkovny.
4. Štítek nalepit, balík osobně předat na podacím místě, následně označit objednávku jako odeslanou.

**Důležité:** Po síťové chybě či nejasné odpovědi nelze automatické vytvoření prostě opakovat — API už mohlo zásilku vytvořit. Aplikace přepne požadavek do stavu `review`, aby nevznikly dva přepravní štítky. Zkontrolovat podle čísla objednávky přímo v klientské sekci Zásilkovny, případně údaje ručně uložit a stav vyřešit správcem. Toto je záměrné bezpečnostní opatření.

## Ještě ověřit před využíváním se zákazníky

- Oprávnění firemního účtu pro createPacket a packetLabelPdf
- Funkční spojení s živým partnerským API a skutečný štítek
- Správnou službu a ID doručení na adresu
- Dobírku a její platební pokyny u Z-BOXů
- Nezávislou kontrolu štítku, příjemce a balíku před fyzickým podáním
