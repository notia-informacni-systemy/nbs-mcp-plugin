---
name: orders-shipments
description: Prodejní objednávky, zásilky, e-shopy a prodejny z Notia Business Serveru (NBS). Použij, když se uživatel ptá na objednávky zákazníků, jejich stav, úhradu nebo expedici, na zásilky, dopravce, sledovací čísla a doručení, na napojené e-shopy nebo prodejny (POS), a je připojený konektor Notia Business Server.
---

# Objednávky a zásilky v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Objednávky zákazníků | `sales_orders_query` |
| Zásilky jedné objednávky | `sales_order_shipments_query` s `id` objednávky |
| Všechny zásilky | `shipments_query` |
| Napojené e-shopy | `sales_websites` |
| Prodejny přihlášeného uživatele | `pos_stores` |
| Způsoby dopravy | `shipping_methods_query` |

## Hledání a období

- U `sales_orders_query` nepoužívej `search`. NBS s ním vrátí prázdný seznam, i když objednávka existuje. U zásilek `search` nic nezúží.
- Seznamy jsou seřazené od naposledy zapsaných záznamů a řazení nejde změnit. Pro období procházej stránky od začátku a skonči, když jsou na celé stránce jen záznamy starší než začátek období.
- Konkrétní objednávku podle čísla najdeš tak, že procházíš stránky a porovnáváš `dokl_cis`, číslo z e-shopu `ex_id` nebo číslo zákazníka `dokl_cis_odb`.
- Když bys musel projít víc než zhruba 10 stránek, zastav se a řekni uživateli, kolik záznamů z `total` jsi prošel.

## Pole objednávek

- Číslo: `dokl_cis` (řada `dokl_kod`, rok `dokl_rok`), číslo objednávky z e-shopu `ex_id`, číslo objednávky zákazníka `dokl_cis_odb`. `id` je interní číslo pro `sales_order_shipments_query`.
- `datum`, zákazník `partner` (zkratka) a `partner_nazev`.
- Částky: `castka` bez DPH, `dan`, `celkem` s DPH, měna `mena`. Úhrada: způsob `uhrada`, příznak `uhrazeno`.
- Doprava `doprava`, kanál objednání `zp_objednani`, odeslání `odeslano`, stav zásilky `stav_zasilky2`.
- Stav `stav`: 0 Nová, 1 Částečně potvrzená, 2 Potvrzená, 3 Ukončená, 4 Neřeší se.

## Pole zásilek

- Číslo `dokl_cis`, `datum`, příjemce `prijemce_nazev` a `mesto_pri`, `stat_pri`.
- Dopravce `carrier` / `prepravce`, způsob dopravy `doprava_nastaveni_nazev`, sledovací číslo `dokl_cis_poskyt_sluzby`, odkaz `tracking_url`.
- Částky `castka` bez DPH a `castka_s_dph`, měna `mena`, `hmotnost`.
- Vazby: objednávka `id_objp`, faktura `id_pohl` (pro `receivable_detail`), variabilní symbol `var_sym`.
- Stav `stav_zasilky`: 0 Nová, 1 Odeslaná, 2 Nepřevzatá, 3 Uhrazená, 4 Vrácená, 5 Reklamace, 6 Ztracená, 7 Částečně vrácená, 8 Doručená, 9 Chyba doručení, 10 Čekající na odeslání, 11 Připraveno dopravci, 12 Vrací se zpět, 13 Čeká na vyzvednutí.

## Ostatní nástroje

- `sales_websites` vrací `[{ id, name }]`, kde obě hodnoty jsou kód e-shopu.
- `pos_stores` vrací `{ success, data: { stores: [{ store_id, store_name }] } }`, jen prodejny přidělené přihlášenému uživateli.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- U e-shopových objednávek bývají zákazníci soukromé osoby. Jména a adresy příjemců uváděj, jen když se uživatel ptá na konkrétní objednávku.
- Částky v různých měnách nesčítej. Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem.
- Surový JSON do odpovědi nevkládej. Uveď, jaké období a kolik záznamů jsi prošel.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj dokola. Řekni uživateli, co se nepodařilo.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
