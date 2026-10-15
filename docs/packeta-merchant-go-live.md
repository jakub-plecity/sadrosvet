# Zásilkovna – potvrzené zákaznické ceny pro SádroSvět (15. 10. 2026)

Provozovatel má aktivní firemní účet Zásilkovna a **výslovně odsouhlasil konečné ceny účtované zákazníkům**:

| Služba | Cena pro zákazníka |
|---|---:|
| Zásilkovna na výdejní místo / Z-BOX | 89 Kč |
| Zásilkovna doručení na adresu | 129 Kč |
| Dobírka při obou variantách | +29 Kč |
| Osobní odběr v Chrudimi | 0 Kč (hotově) |

V kódu se částky ukládají v haléřích a počítají serverově: 8900 / 12900 + 2900. Příznak `demoRate` je vypnutý a volba Zásilkovny je dostupná v košíku.

**Nejde o smluvní nákupní cenu Zásilkovny:** tato koncová maloobchodní cena byla schválena provozovatelem SádroSvět a může se odvíjet od jeho obchodní marže. Oficiální partnerské dokumenty: https://www.zasilkovna.cz/dokumenty-pro-partnery .

Před ostrou expedicí ověřit:
1. API oprávnění vytváření zásilek a generování štítků, nejen widget mapy výdejen.
2. Pravidla a místo podání (depo, podací místo nebo svoz), rozměry a hmotnost zásilky.
3. Funkční doručení objednávky se správným příjemcem a výdejním místem.
4. U Z-BOXu se dobírka hradí online dle pokynů dopravce, nikoliv v hotovosti na boxu.

Nastavení zákaznických cen nepředstavuje samo o sobě aktivaci `ENABLE_REAL_CHECKOUT`.
