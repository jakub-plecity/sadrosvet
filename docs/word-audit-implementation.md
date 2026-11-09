# SádroSvět – implementace požadavků z Wordu (9. 11. 2026)

Zdroj: **Poznámky k úpravě webu.docx**, strany 1–5. Tato větev není nasazena do produkce.

## Změny v této větvi
- Zápatí: sociální odkazy vlevo, mapa stránek uprostřed, kompletní identifikace provozovatele vpravo; odstraněn slogan a veřejný odkaz na administraci.
- Společné šířky obsahu, větší čitelnost právních stránek, responsivní rozložení zápatí.
- O nás: odstraněna dodatečná výzva sledovat sociální sítě; fotografii ponechat až do vizuálního schválení, protože podklady obsahují jen koncept, nikoliv nový originální obrázek.
- Katalog: fotografie v barvě a v rámečku; v kartách bez šipek, teček a čísel; v detailu náhledy ostatních fotek.
- Podle schváleného rozhodnutí je kontaktní formulář z katalogu odstraněn; e-mail, telefon a identifikační údaje zůstávají v zápatí. Kontaktní backend zatím zůstává zachován.
- Administrace: již existující duplikace, posun šipkami a drag-and-drop; pořadí se nesmí upravovat při aktivním vyhledávání či filtru.
- Košík: sjednocení cen, poplatek za dobírku až v kroku Platba, odstranění nepoužívané cesty pro zkušební objednávku ze zákaznického košíku.
- Pod hlavičkou: doprava zdarma od 1 500 Kč pro všechny způsoby doručení; dobírka zůstává samostatným poplatkem.
- Texty: jednotné vykání v zásadách osobních údajů a na dotčených zákaznických stránkách; lhůta doručení do 7 pracovních dnů od objednání.

## Produkční úkony vyžadující kontrolu mimo Git
1. **Kuba test miska**: vlastník výslovně schválil trvalé smazání, nikoli archivaci. Přesný produkční záznam ale nebyl prozatím přes dostupný GitHub connector čitelný; nejprve jej najděte v administraci, ověřte ID a vazby na historické objednávky, poté použijte **Odstranit**. **Zatím nesmazáno; tato větev neprovádí žádnou destruktivní databázovou migraci.**
2. Projděte databázové popisy a označení „Ukázka“, „Ilustrační fotografie“; změňte pouze testovací údaje, ne pravdivé informace o vzorkových produktech. Pokud nejsou originální barevné fotografie, je nutné je dodat.
3. Fotografie na stránce O nás je podle potvrzeného rozhodnutí ponechána beze změny.
4. Ověřte znění GDPR a obchodních podmínek proti skutečným službám, cenám a procesům s provozovatelem.
5. Otestujte objednávku s online platbou a dobírkou pro 1 499 Kč, 1 500 Kč a 1 501 Kč; při dopravení na adresu i výdejní místo.
6. Zkontrolujte responsivitu na šířkách 360, 390, 768, 1024 a 1440 px.
7. Potvrďte úspěšné GitHub Actions kontroly, teprve poté slučte do main a zkontrolujte následné nasazení.

## Testovací příkazy
```sh
npm ci
npm run typecheck
npm test
npm run build
```

## Poznámka
Na GitHubu jsou změny kódu, nikoliv produkční data. Smazání testovacího produktu nebo výměna reálných fotek bez přímé autorizované správy databáze by bylo nepodložené.

## Podklady pro rozhodnutí o ukázkových produktech

V repozitáři `lib/catalog.ts` je **20 historických demonstračních seed produktů** s `sample:1`. Jejich přítomnost v aktuální produkční databázi **nelze z tohoto souboru potvrdit**. Schválení seznamu je nutné před jakoukoli hromadnou změnou.

| Kategorie | Ukázkové názvy v původních seed datech |
|---|---|
| Vázy | Váza Linie, Váza Linie Mini, Váza Linie Maxi, Váza Přírodní |
| Misky | Miska Mušle, Miska Perla, Miska Mušle Mini, Miska Mušle Maxi |
| Podnosy | Podnos Oblouk, Podnos Oblouk Mini, Podnos Oblouk Maxi, Podnos Kámen |
| Vonné svíčky | Vonná svíčka Forma, Vonná svíčka Vanilka, Vonná svíčka Levandule, Vonná svíčka Bavlna |
| Sety | Set Domov, Set Šperkovnice, Set Klidný večer, Dárkový set SádroSvět |

**Žádný z těchto 20 záznamů nyní automaticky nemažte.** Nejdříve porovnejte produkční `products` proti seed identifikátorům a atributu `sample`, zkontrolujte vazby objednávek, exportujte seznam a vyžádejte schválení konkrétních ID.

## Potvrzená rozhodnutí provozovatele
- Fotografie na O nás: ponechat nynější.
- Ukázkové produkty: ukázat konkrétní seznam ke schválení, bez mazání.
- Kuba test miska: trvale odstranit po ověření produkčního záznamu a oprávněného přístupu.
- Kontaktní formulář pod katalogem: odstranit, kontakt ponechat v zápatí.
