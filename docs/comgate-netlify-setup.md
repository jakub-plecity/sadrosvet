# Comgate — nastavení v Netlify (příprava, ne zapnutí ostrých plateb)

## Co je implementováno
- Server-only klient pro Comgate API HTTP POST v1.0: založení transakce a serverové ověření stavu.
- Kontrolní endpoint `GET /api/comgate/readiness` zveřejňuje pouze údaj o přítomnosti konfigurace.
- Zatím **neexistuje veřejný endpoint zakládání online plateb**; ostrá brána se nezapne pouhým uložením klíčů.

## Netlify > Project configuration > Environment variables

| Klíč | Účel |
|---|---|
| `COMGATE_MERCHANT` | Merchant ID konkrétního e-shopu z portálu Comgate |
| `COMGATE_SECRET` | Tajné heslo pro komunikaci na pozadí z portálu Comgate |
| `COMGATE_TEST` | `true` při testování; po dokončení E2E testu a schválení teprve `false` |
| `SITE_ORIGIN` | `https://sadrosvet.cz` |
| `ENABLE_REAL_CHECKOUT` | Zatím **neměnit** pouze kvůli Comgate; zapíná existující dobírkové objednávky, ne platební bránu |

Hodnoty nastavte jen do prostředí **Production** v Netlify. `COMGATE_SECRET` patří pouze do Netlify, ne do chatu, GitHubu ani do proměnných `NEXT_PUBLIC_`. Po změnách spusťte nový deploy.

## Nastavení portálu Comgate

1. V portálu otevřete **Integrace → Nastavení obchodů → Propojení obchodu** a zkontrolujte Merchant ID a heslo pro komunikaci na pozadí.
2. Prověřte **IP whitelist**. Netlify Functions nemusí mít garantovanou pevnou odchozí IP adresu. Pokud Comgate vyžaduje whitelist, domluvte s Comgate podporu/variantní integrační cestu; **nelze zadat doménu místo odchozí IP**.
3. Pro budoucí notifikace bude třeba bezpečná URL např. `https://sadrosvet.cz/api/comgate/notify`. **Endpoint pro příjem notifikací zatím není hotový — tuto URL zatím NEZADÁVEJTE jako funkční.**
4. Otestujte platbu s `test=true`: PAID, CANCELLED, PENDING, opakované doručení notifikace, nemožnost falešného označení zaplacení ze strany zákazníka a refundaci.
5. Až bude správně potvrzený stav bankovních tlačítek a karetní společnosti VISA a Mastercard schválí platby, zobrazte uživatelům jen skutečně dostupné metody.

## Blokátory dokončení
- Rozšíření schématu objednávek o Comgate platbu a bezpečné uložení `transId`.
- Návrh a implementace idempotentního spárování notifikace s objednávkou, včetně serverového status dotazu a kontroly částky/currency/refId.
- Obnova zásob po propadlé/zamítnuté transakci a bezpečný opakovaný pokus o úhradu.
- Odesílání správných e-mailů pro čekající/zaplacené objednávky.
- Nastavení Comgate redirect URLs pro zaplaceno/nezaplaceno/čeká se po vytvoření odpovídajících stránek.
- Závěrečný E2E test a explicitní zapnutí ostré integrace.

Dokumentace: https://apidoc.comgate.cz/api/post/ a https://help.comgate.eu/docs/navod-k-pouziti
