# Zásilkovna – firemní účet potvrzen (15. 10. 2026)

Provozovatel SádroSvět potvrdil **aktivní firemní účet Zásilkovna**.

Oficiální podklady pro smluvní odesílatele: https://www.zasilkovna.cz/dokumenty-pro-partnery (ceník 1. 9. 2026; VOP 10. 10. 2026).

## Princip správného nacenění

Partnerská **nákupní cena** není totožná s **cenou dopravy pro zákazníka**. Nákupní cena vychází ze smluvního tarifu a příplatků; cenu zákazníkovi stanovuje SádroSvět a musí ji včetně všech poplatků zobrazit před závaznou objednávkou. Nepřebírat ceny služby Mezi námi pro soukromé odesílání.

V kódu byly zneplatněny staré demonstrativní částky 79/109 Kč (+29 Kč dobírka). Do potvrzení konečných prodejních cen nejsou Zásilkovna–výdejna a Zásilkovna–adresa volitelné. Balíkovna a osobní odběr zůstávají samostatně.

## Údaje pro aktivaci

- Konečné zákaznické dopravné včetně DPH/poplatků: Zásilkovna na výdejní místo a Z-BOX, doručení na adresu
- Konečný poplatek za dobírku, anebo potvrzení zahrnutí dobírky v dopravném
- Potvrzení režimu podání (podací místo / depo / svoz), hmotností a rozměrů zásilek
- Ověření, že partner API klíč umožňuje vytváření zásilek a že jsou potvrzené služby doručení na adresu

Následující změna kódu má nahradit null konkrétními, **provozovatelem potvrzenými** cenami v haléřích, nastavit dostupnost a vypnout demoRate. Doplnit ověřený test cen a skutečné založení zásilky/štítku v partnerském API před automatickou expedicí.
