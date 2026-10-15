# Zásilkovna — sazby a podmínky pro SádroSvět (15. 10. 2026)

Oficiální zdroje:
- Partnerské dokumenty a ceník platný od 1. 9. 2026: https://www.zasilkovna.cz/dokumenty-pro-partnery
- Aktuální příplatky: https://www.zasilkovna.cz/ceniky-a-priplatky
- Způsoby úhrady dobírky: https://mapa.zasilkovna.cz/dobirka
- Soukromé odesílání „Mezi námi“: https://pobocky.zasilkovna.cz/odeslani

## Závazná interpretace

Ceny zveřejněné u služby „Mezi námi“ (výdejní místo od 89 Kč; na adresu od 129 Kč; dobírka 26 Kč) jsou ceny spotřebitelské aplikace. **Nepoužívat je jako partnerskou nákupní cenu e-shopu.**

V partnerských dokumentech existuje kompletní ceník od 1. 9. 2026. Výsledná fakturovaná cena může zahrnovat palivový a mýtný příplatek, DPH, službu dobírky, velikost/váhu zásilky a způsob podání. Oficiální stránky uvádějí od 1. 2. 2026 mýtný příplatek 1,10 Kč bez DPH za každý započatý kg. Palivový příplatek se mění měsíčně.

Bez ověření smluvního režimu podání a hodnot z oficiálního partnerského PDF nebo zákaznické klientské sekce nelze prohlásit pevné číslo za skutečnou cenu dopravce. **Konečné sazby účtované zákazníkům určuje provozovatel e-shopu.**

## Přijímání dobírky

- Na výdejně lze platit dle možností výdejny hotově/kartou nebo předem online.
- V Z-BOXu neexistuje terminál ani hotovostní platba. Dobírka se uhradí online přes aplikaci nebo odkaz na sledování.
- Doručení na adresu podporuje platbu online předem nebo při převzetí dle možností dopravce.

## Technický stav

- V checkoutu je implementován widget výběru výdejny Zásilkovny.
- Na ostré objednávky se nyní nesmějí aplikovat původní ilustrační sazby 79/109 Kč a dobírka 29 Kč.
- Do potvrzení partnerského ceníku a konečných cen pro zákazníka musí být možnost výběru Zásilkovny označena „připravujeme“ a zakázána.
- Samotný výběr místa není expedice: napojení zásilky na partnerské API, štítky a předávání balíků musí být odzkoušené odděleně.

## Ke zjištění od prodejce

1. Má SádroSvět aktivní smluvní účet Zásilkovna / Packeta (nejen API klíč pro mapu výdejen)?
2. Podání na kamenném podacím místě, nebo na depu/svozem?
3. Má provozovatel vlastní smluvní ceny, nebo použijeme zveřejněný ceník, a jakou koncovou cenu chce zákazníkům účtovat?
