# SádroSvět — Netlify

Samostatná verze původního webu připravená pro Netlify. Next.js App Router, Netlify Database (PostgreSQL), Netlify Blobs a serverové odesílání přes Resend.

**Košík zůstává zkušební. Tato migrace nezapíná skutečné objednávky ani platby.**

## Co se přenáší

- Vzhled, texty, veřejné stránky, administrace, galerie a session košík.
- Stav 21 produktů, 3 záznamů fotografií a kategorií získaný z původního webu dne 15. 10. 2026.
- Obě původní nahrané fotografie v `public/imported-images/`. Jejich dosavadní adresy `/api/images/<id>` přesměrují na tyto soubory na novém webu. Nové fotografie se ukládají do Netlify Blobs.
- Zkušební objednávky, provozní počítadla a přihlašovací relace se nepřenášejí. V repozitáři nejsou zákaznické údaje, hesla ani API klíče.

Po vytvoření snímku se změny v původní administraci automaticky nepřenášejí. Před finálním přepnutím domény je nutné ověřit, že mezitím nedošlo ke změnám katalogu.

## Nasazení

1. Nahrajte tento projekt do soukromého repozitáře `jakub-plecity/sadrosvet`.
2. V Netlify zvolte **Add new project → Import an existing project → GitHub** a vyberte tento repozitář.
3. Sestavení určuje `netlify.toml`: `npm run build`, výstup `.next`, Node.js 22. Netlify automaticky použije svůj adaptér Next.js.
4. Netlify Database je deklarovaná závislostí `@netlify/database` a migracemi v `netlify/database/migrations/`. Podle dokumentace se vytvoří a migrace aplikují při nasazení. Je-li potřeba databázi založit ručně, otevřete v projektu **Data & Storage → Database → Create a database**. Nezakládejte místo ní Blobs databázi pro transakční data.
5. V **Project configuration → Environment variables** nastavte serverové proměnné podle `.env.example`. Po změně proměnných proveďte nové nasazení. Přístupové údaje přepisujte přímo v bezpečném nastavení Netlify, ne do souboru v GitHubu ani do chatu.
6. Nejprve ověřte web na přidělené adrese `*.netlify.app`. DNS domény zatím neměňte.

| Proměnná | Hodnota |
| --- | --- |
| `LOCAL_ADMIN_USERNAME` | Zvolené jméno správce |
| `LOCAL_ADMIN_PASSWORD` | Heslo správce; zadat pouze v Netlify |
| `ADMIN_SESSION_SECRET` | Nový náhodný řetězec alespoň 32 bajtů, např. výstup `openssl rand -hex 32` |
| `RESEND_API_KEY` | Platný klíč Resend pro ověřenou doménu |
| `ORDER_EMAIL_FROM` | `SádroSvět <objednavky@sadrosvet.cz>` |
| `ORDER_EMAIL_REPLY_TO` | `sadrosvet@seznam.cz` |
| `PACKETA_API_KEY` | Veřejný 16znakový klíč widgetu Packeta, nikoli privátní heslo API |
| `SITE_ORIGIN` | Nejprve přesná adresa Netlify s `https://`; po připojení domény `https://sadrosvet.cz` |

Databázové připojení `NETLIFY_DB_URL` i přístup k Blobs spravuje Netlify automaticky. Nepřidávejte tajné proměnné s prefixem `NEXT_PUBLIC_`. Zabezpečené hodnoty původní platformy se do tohoto projektu automaticky nekopírují.

## Ověření před přepojením domény

- Veřejný katalog obsahuje přenesené produkty a galerie zobrazují všechny fotografie.
- `/admin` vyžaduje jméno a heslo; ověřit přihlášení, odhlášení, úpravu produktu i odmítnutí přímého neoprávněného zápisu.
- Nová fotografie do 3 MB se nahraje do Blobs a zůstane po dalším nasazení. Limit 3 MB nechává rezervu pro velikost multipart požadavku na Netlify.
- Kontaktní formulář doručí přes Resend do `sadrosvet@seznam.cz`, odesílatelem je `objednavky@sadrosvet.cz`, odpověď míří návštěvníkovi.
- Widget Zásilkovny a mapa Balíkovny fungují na mobilu i počítači.
- Košík přežije přechod mezi stránkami a stále zřetelně označuje zkušební režim.

Teprve poté přidejte vlastní doménu v Netlify a nastavte předepsané DNS záznamy u Webglobe. Zachovejte záznamy e-mailu, SPF, DKIM, DMARC i další ověřovací záznamy. Konkrétní cíle DNS se řídí údaji daného projektu v Netlify. Ověřte HTTPS a znovu přihlášení a zápisy na vlastní doméně.

## Co ještě chybí pro ostrý prodej

Skutečné objednávky se zákaznickými údaji, atomický odečet skladu, stavy objednávek, automatická potvrzení, schválené ceny Zásilkovny a doplnění právních a bezpečnostních informací. Platební brána zůstává mimo aktuální rozsah podle zadání provozovatele. Dokončením košíku v této verzi skutečná objednávka nevznikne.

Informace o soukromí byly upraveny pro zamýšlený hosting Netlify. Před ostrým provozem je potřeba ověřit zpracovatelské podmínky, umístění dat, cookies a lhůty uchování. Nastavení zde neslibuje výhradní zpracování v EHP.

## Lokální ověření

```sh
npm ci
npm test
npm run build
```

Testy používají skutečné PostgreSQL dotazy přes PGlite. Ověřují migrace katalogu, transakční rollback, ochranu administrace, přihlašovací limity, souběžnou editaci produktů, fotografie, idempotenci zkušebního košíku a parametry Resend. Externí e-mail ani produkční úložiště v testech nevolají.

Lokální sestavení a integrační testy nenahrazují ověření nasazené aplikace na Netlify. Výsledné fungování adaptéru, databázové připojení, Blobs, skutečné doručení e-mailů a prohlížeč je nutné potvrdit po nasazení.

## Tarif

Netlify Free má společný měsíční kreditový limit. Databázové výpočty, přenos dat a nasazování spotřebovávají kredity. Při vyčerpání může být web pozastaven; nelze zaručit nepřetržitý ostrý provoz zdarma. Sledujte Usage & billing.

Dokumentace: [Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Database](https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/), [Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).


## Přesun databáze do Supabase

Postup je v [docs/supabase-migration.md](docs/supabase-migration.md).
Pouhé nastavení `SUPABASE_DATABASE_URL` nic nepřepíná. Všechny webové endpointy
včetně Comgate callbacků a obou plánovaných úloh sdílejí přepínač
`DATABASE_PROVIDER` (výchozí `netlify`). Fotografie v Netlify Blobs zůstávají na místě.
