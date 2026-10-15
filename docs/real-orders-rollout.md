# SádroSvět — přechod ze zkušebního na skutečný checkout

Stav: **PŘÍPRAVA**. Nasazení této databázové migrace samo o sobě nezapíná příjem objednávek.
Veřejné `/api/orders` a košík nadále pracují jen se zkušebními objednávkami v `demo_orders`.

## Potvrzené rozhodnutí

- Osobní odběr ponechat: Na Kopci 1083, Chrudim, po domluvě, platba hotově.
- Přeprava: Balíkovna a Zásilkovna, při doručování dobírka.
- Resend: uživatel potvrdil ověření domény a nastavení API klíče, **doručení testovacího e-mailu ještě nebylo ověřeno**.
- Zásilkovna má stále pouze ilustrační ceny. Nepoužít je v ostrém checkoutu bez potvrzení provozovatelem.
- Karta, Apple Pay a Google Pay zatím nejsou aktivní. DPD není implementováno.

## Implementační kroky před zapnutím

1. Vytvořit serverové `POST /api/checkout`, které přísně validuje údaje zákazníka, adresy, zásilkový bod a zvolený způsob platby. Žádná cena ani skladová dostupnost se nesmí důvěřovat vstupu klienta.
2. V jedné transakci ověřit aktuální stav a ceny produktů, pro každý produkt provést podmíněný odečet `UPDATE products SET stock=stock-$1 WHERE id=$2 AND status='active' AND stock >= $1 RETURNING ...`, zapsat hlavičku objednávky, položky a `placed` událost do outboxu. Při nedostatku zásob rollback. Opakování se stejným UUID musí vrátit stejnou objednávku bez druhého odečtu, změněný obsah se stejným UUID musí dostat 409.
3. Implementovat doručení e-mailu z `order_email_outbox` přes Resend s idempotentním klíčem. Případný výpadek e-mailu nesmí zrušit úspěšně uloženou objednávku, ale musí umožnit opakování bez duplikace.
4. Zapojit zákaznický formulář a souhlasy / zákonné informace. V potvrzení objednávky uvést souhrn, cenu, dopravce, platbu, obchodní podmínky a formulář pro odstoupení v trvalé podobě.
5. Pro administraci přidat seznam objednávek, oprávněné změny stavů, storno s kontrolovaným vrácením zásob, auditní záznamy a export nezbytný pro expedici.
6. Doplnit testy transakční souběžnosti posledního kusu, rollbacku, idempotence, chybných cen, dvojitého e-mailu, ochrany osobních údajů a mobilního košíku.
7. Zrevidovat zásady zpracování a dobu uchování osobních údajů. Ověřit zálohování databáze a obnovu.
8. Teprve po úspěšných produkčních end-to-end testech zapnout skutečný checkout a jasně odstranit štítky demo režimu.

## Provozní test Resend (bez sdílení tajných údajů)

Na `https://sadrosvet.netlify.app/admin` otevřít nastavení e-mailů a spustit zkušební odeslání.
Ověřit doručení na `sadrosvet@seznam.cz` a zároveň událost v Resend.
Pokud test selže, zkontrolovat proměnné `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, `ORDER_EMAIL_REPLY_TO` v Production a znovu nasadit.

## Databáze

Migrace `20261015190000_orders_foundation.sql` zakládá pouze prázdné tabulky
`customer_orders`, `customer_order_items` a `order_email_outbox`.
Nemění katalog ani stávající zkušební objednávky. Do produkčních tabulek zatím nesmí zapisovat žádné veřejné API.
