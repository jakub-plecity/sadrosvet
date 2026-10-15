# Transakční objednávky — stav implementace

Tato větev připravuje `POST /api/checkout` a správou chráněné `GET/POST /api/admin/order-emails`.

**DŮLEŽITÉ: `ENABLE_REAL_CHECKOUT` nechte nedefinované!** Veřejný košík stále používá zkušební `/api/orders`. Neexistuje hotové zákaznické UI pro ostrý prodej. Přepínač se nesmí aktivovat před dokončením UI, právních textů a end-to-end testů.

- Skutečný endpoint používá PostgreSQL transakci, řádkové zámky produktů, kontrolu ceny a odečet skladu.
- Opakovaná žádost se stejným UUID a shodným obsahem vrací stejnou objednávku; změněný obsah končí 409.
- Při přijetí objednávky se atomicky vytvoří položky a dvě frontové e-mailové zprávy (zákazník a provozovatel).
- Administrátorský endpoint postupně odesílá zprávy z fronty přes Resend. Nejde ještě o automatické plánování ani hotové administrační rozhraní. Je potřeba naplánovat zabezpečené periodické zpracování a monitorování neúspěchů.
- Osobní odběr zůstává dostupný. U Zásilkovny se zakazuje ostré uložení objednávky, dokud má ukázkové sazby.
- Zatím nejsou platby kartou, DPD, změny stavů objednávek ani dobropisy/refundace.
- Nejsou dokončené integrační testy nových endpointů ani produkční test objednávky. **Bez jejich doplnění není nasazení připraveno k ostrému provozu.**
- Potvrzovací e-mail momentálně obsahuje odkazy na právní dokumenty, nikoli jejich trvalou kopii nebo přílohu. Před spuštěním zajistit odpovídající trvalé předání zákazníkovi.
- Tabulky obsahují osobní údaje; před spuštěním musí být dokončena doba uchování, přístupová práva, zálohy a proces odstranění dat.

Potvrzené provozní ověření: Resend testovací e-mail byl uživateli doručen 15. 10. 2026. To ale samo nepotvrzuje transakční potvrzení skutečné objednávky.
