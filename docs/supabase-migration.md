# SádroSvět: přenos do Supabase

## Provozní přepínače (Netlify, produkční kontext)

- `DATABASE_PROVIDER`: `netlify` (výchozí) nebo `supabase`. Při chybě se nikdy automaticky nevrací k jinému poskytovateli.
- `SUPABASE_DATABASE_URL`: tajný serverový řetězec připojení.
- `SUPABASE_DATABASE_CA`: PEM certifikát Supabase; podporuje skutečné i escapované konce řádků (`\n`). TLS ověřuje server.
- `DATABASE_MAINTENANCE=true`: proxy vrací 503 pro API a obě plánované úlohy nezapisují.
- `SUPABASE_MIGRATION_CHECK=true`: build provede úplnou kopii a kontrolu, pak cílovou transakci vrátí zpět.
- `SUPABASE_MIGRATION_STATUS=true`: build pouze vypíše názvy existujících cílových tabulek a dostupnost prostředí pro zálohu.
- `SUPABASE_MIGRATION_APPLY=true` a `MIGRATION_WRITES_PAUSED=true`: build potvrdí ověřenou kopii. Vyžaduje již nasazený a ověřený údržbový režim a prázdný cíl.

Všechny migrační režimy jsou výhradně pro produkční Netlify kontext; deploy preview používá jinou zdrojovou databázi. Spouštějí se v prebuild hooku, build command zůstává `npm run build`.

## Postup prvotního přenosu

1. Nastavit tajné připojení a CA, ponechat Netlify jako poskytovatele.
2. Spustit CHECK a ověřit shodu všech tabulek; vypnout CHECK.
3. Zapnout a nasadit MAINTENANCE. Ověřit 503 na živém API a zastavení obou workerů; zohlednit rozpracované platby a příchozí callbacky.
4. Teprve poté potvrdit WRITES_PAUSED a jednorázově spustit APPLY.
5. Ověřit `applied:true`, shodu všech řádků a uloženou zálohu. Vypnout APPLY, CHECK, STATUS.
6. Nastavit PROVIDER=supabase, vypnout MAINTENANCE a WRITES_PAUSED; znovu nasadit.
7. Ověřit katalog, fotografie, administraci, sklad a objednávky. Platby a maily ověřovat kontrolovaně, aby nevznikly nechtěné reálné transakce.

## Záloha a bezpečnost

Ostrá kopie uloží export zdrojového snapshotu včetně migrací a identity sekvence do `sadrosvet_backups.exports`. Export obsahuje původní JSON záznamy jako text, SHA-256 a čas. Před potvrzením se znovu načte a ověří. Schéma je oddělené od měněných aplikačních tabulek, nemá veřejná oprávnění a tabulka používá RLS. Backup se potvrzuje ve stejné transakci jako kopie; bez ověření backupu se přenos nepotvrdí.

Aplikační tabulky mají RLS a odebraný přístup rolím PUBLIC, anon, authenticated. Server používá privilegované připojení. Migrační skripty nevypisují řádky zákazníků ani připojovací řetězce. Původní Netlify databáze zůstává zachovaná. Fotografie dál používají Netlify Blobs.

Po prvních zápisech do Supabase nelze bezpečně vrátit PROVIDER=netlify bez sjednocení nových dat. Původní databázi rušit až po kontrole a uchování zálohy. Opakovaný APPLY na neprázdný cíl skript odmítne.

## Budoucí migrace

Netlify automatické migrace neupravují Supabase. Provedené názvy a SHA-256 jsou v `public.sadrosvet_schema_migrations`. Nové změny schématu je nutné samostatně aplikovat do Supabase včetně oprávnění a RLS. Skript prvotního přenosu se k tomu nepoužívá.

Lokální kontroly: `npm test`, `npm run typecheck`, `npm run build`.
