# SádroSvět: Netlify Database → Supabase

## Stav a bezpečný výchozí režim

Kód podporuje oba poskytovatele. `DATABASE_PROVIDER` chybějící nebo `netlify`
ponechá všechny požadavky na původní databázi. Samotná existence tajné
`SUPABASE_DATABASE_URL` nezmění produkční provoz. Režim `supabase` vyžaduje
platné připojení; při chybě se nikdy nevrací k Netlify (aby se nerozdělily objednávky).
Kód nepřenáší fotografie: ty dál používají stávající Netlify Blobs.

## 1. Tajné proměnné a nasazení přípravy

- `SUPABASE_DATABASE_URL`: řetězec Session pooler, port 5432, z panelu Connect.
  Heslo se speciálními znaky musí být v URI správně percent-encoded.
- Nastavit jako tajnou proměnnou v Netlify pro **Builds a Functions** produkčního
  kontextu. Nepoužívat prefix `NEXT_PUBLIC_`, nepsat do Git ani build commandu.
- Ponechat `DATABASE_PROVIDER=netlify` nebo nenastavené.
- TLS vždy ověřuje server. Pokud řetězec certifikátů není systémově důvěryhodný,
  vložit PEM kořenového certifikátu z Supabase do `SUPABASE_DATABASE_CA`.
  Nevypínat ověřování TLS.
- Nechat nasadit tuto přípravu. Neodpojovat Netlify Database.

## 2. Ověření na skutečných připojeních

V produkčním kontextu Netlify (ne v deploy preview, které má vlastní databázovou
větev) dočasně použít build command:

```sh
npm run db:supabase:check && npm run build
```

Kontrola ve skutečné cílové databázi vytvoří schéma, přenese konzistentní snapshot,
porovná počty a otisky všech řádků a **celou cílovou transakci vrátí zpět**.
Cíl tedy zůstane prázdný. Výpis obsahuje pouze názvy tabulek, počty a výsledek.
Odmítá neprázdný cíl, neočekávané tabulky a rozdíly schématu. Žádné heslo není ve výpisu.
Kontrola neslouží jako záloha; před ostrou kopií pořídit také samostatný export
produkční databáze a uložit jej mimo dočasné build prostředí.

## 3. Ostrý přenos

Nejdříve pozastavit **všechny zápisy** do zdrojové databáze po celou dobu přenosu
AŽ DO přepnutí: objednávky, administraci, e-mailové úlohy, platební callbacky,
rekonciliaci a další zapisující cesty. Samotné vypnutí checkoutu nestačí.
Pokud nejsou vypořádané platby, naplánovat odstávku a zachování/opakování callbacků.
Bez údržbového režimu a zálohy přenos nespouštět. `MIGRATION_WRITES_PAUSED=true`
je potvrzení operátora, nikoliv mechanismus blokování zápisů.

V produkčním kontextu Netlify, stále s `DATABASE_PROVIDER=netlify`, nastavit
`MIGRATION_WRITES_PAUSED=true` a dočasný build command:

```sh
npm run db:supabase:copy && npm run build
```

Skript čte zdroj v read-only repeatable-read transakci a nemění jeho data.
Cíl vytvoří v jedné transakci; nahradí historické seed záznamy skutečnými daty,
zkontroluje všechny řádky a zachová pořadové číslo objednávek i stav identity sekvence.
Zapne RLS a odebere přístup veřejným rolím `anon`/`authenticated`.
Serverové připojení musí používat roli s potřebnými oprávněními (typicky postgres).
Při chybě před potvrzením se cíl vrátí zpět. Úspěšný přenos je neopakovatelný:
jakýkoliv neprázdný cíl skript odmítne. Pokud po kopii selže samotný build,
nejprve zkontrolovat výsledek; kopii znovu nespouštět ani cíl nemažte naslepo.

## 4. Přepnutí a kontrola

- Vrátit build command na `npm run build`, odstranit `MIGRATION_WRITES_PAUSED`.
- Nastavit `DATABASE_PROVIDER=supabase` pro Functions i Builds v produkčním kontextu.
- Znovu nasadit, aby se přepnuly i obě plánované funkce.
- Během odstávky ověřit přihlášení, produkty, fotografie, sklad a administraci.
- Ověřit objednávku a její položky, změnu skladu, platby Comgate, e-mailovou frontu
  a dopravní operace. Kontrolovat záznamy přímo v Supabase, ne jen HTTP 200.
- Teprve pak obnovit provoz. Původní databázi zatím ponechat jako zálohu.

Návrat na `DATABASE_PROVIDER=netlify` je bezpečný jen dokud Supabase nepřijala nové
zápisy. Po nových objednávkách je nejdříve potřeba data sjednotit; prosté přepnutí
by tyto objednávky skrylo. Netlify Database zrušit až po ověření a uchování zálohy.

## Další změny schématu

Netlify automatické migrace po přepnutí neupravují Supabase. Kopie uloží názvy
a SHA-256 provedených migrací do `sadrosvet_schema_migrations`. Budoucí změny
je potřeba samostatně aplikovat do Supabase v řízené migraci včetně RLS nových
tabulek; nepoužívat opětovně skript pro prvotní kopii.

## Lokální ověření bez produkčních hesel

```sh
npm test
npm run typecheck
npm run build
```

Testy přenosu ověřují skutečné SQL nad PGlite, vrácení změn při chybě, odmítnutí
neprázdného cíle, zachování aktuálních dat a identity, RLS i explicitní přepínač.
PGlite nenahrazuje test s reálným Supabase TLS/poolerem; ten provede krok 2.
