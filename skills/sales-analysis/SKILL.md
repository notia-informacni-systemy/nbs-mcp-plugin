---
name: sales-analysis
description: Analýza prodejů, tržeb a obratu z Notia Business Serveru (NBS). Použij, když se uživatel ptá na tržby a jejich vývoj v čase, meziroční nebo měsíční srovnání, prodeje podle obchodníků, zákazníků, skupin zákazníků nebo produktů, nejprodávanější produkty nebo největší zákazníky, a je připojený konektor Notia Business Server.
---

# Analýza prodejů v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.
- Relativní období („minulý měsíc“, „letos“, „Q1“) převeď na konkrétní data podle dnešního dne a v odpovědi je uveď.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Tržby po měsících a meziročně | `report_sales_yoy` |
| Tržby podle obchodníků | `report_sales_partners_yoy` |
| Rychlé srovnání měsíce nebo roku k dnešku | `dashboard_revenue_monthly`, `dashboard_revenue_yearly` |
| Tržby zákazníků (tento a minulý měsíc a rok) | `companies_query` |
| Tržby skupin zákazníků | `company_groups_query` |
| Prodeje produktů (tento a minulý měsíc a rok) | `report_products_evaluation` se `sklad` `0` |
| Komu a za kolik se prodával jeden produkt | `sales_product_sales_history` |
| Zákazníci za libovolné období | `receivables_query` (vystavené faktury) |

Tyto zdroje počítá NBS z různých podkladů, proto se jejich čísla nemusí přesně shodovat. Uveď, z kterého přehledu výsledek pochází. Když pole neříká, jestli jsou částky s DPH, netvrď to.

## Meziroční přehledy

- `report_sales_yoy` vrací `{ total, values, maxHistory }`. `values` je 12 měsíců, `month` 0 je leden. `year0` je letošní rok, `year1` loňský a tak dál až po `maxHistory`.
- `yearProcK` je růst roku K proti roku před ním v procentech. `yearProcMoMK` je změna proti předchozímu měsíci.
- Letošní rok není celý: `total.year0` je jen od začátku roku, budoucí měsíce mají 0 a −100 %. Pro férové srovnání sečti v obou letech jen uzavřené měsíce.
- Čtvrtletí a jiná období poskládej sečtením měsíců z `values`.
- `report_sales_partners_yoy` má stejný tvar, jen každý měsíc v `values` má `data` (součet měsíce) a `children` (obchodníci, jméno v `data.name`). Řádek „Tržby bez obchodníka“ jsou prodeje bez přiřazeného obchodníka. Součet obchodníků se nemusí rovnat součtu měsíce. Report je pomalý, volej ho jednou.
- „Partneři“ v názvu reportu znamenají obchodníky, ne zákazníky.

## Dashboard

- `dashboard_revenue_monthly` a `dashboard_revenue_yearly` vrací graf `{ labels, datasets }` vztažený ke včerejšku.
- Měsíční: šest bodů, tedy stejný měsíc před třemi, dvěma a jedním rokem, předminulý měsíc, minulý měsíc a aktuální měsíc. `datasets[0]` je tržba do stejného dne v měsíci, `datasets[1]` celý měsíc.
- Roční: posledních šest let. `datasets[0]` je od začátku roku do stejného dne, `datasets[1]` celý rok. Pro srovnání letoška s loňskem použij `datasets[0]`.

## Zákazníci a produkty

- `companies_query` má u každé firmy tržby v Kč: `sales_this_month`, `sales_last_month`, `sales_this_year`, `sales_last_year`, `sales_this_month_last_year`. Seznam je seřazený od naposledy založených firem, takže žebříček zákazníků vyžaduje projít všechny stránky.
- `company_groups_query` je krátký seznam skupin (načti ho s `limit` 200) s tržbami `sales_this_month`, `sales_last_month`, `sales_to_date_this_year`, `sales_to_date_last_year`.
- `report_products_evaluation` se `sklad` `0` vrací u každého produktu prodeje v Kč (`castka_kc_akt_mesic`, `castka_kc_min_mesic`, `castka_kc_akt_rok`, `castka_kc_min_rok`) a v kusech (`mnozstvi_*`). Je seřazený podle kódu, žebříček vyžaduje projít všechny stránky.
- `sales_product_sales_history` bere číselné `id` produktu z `sales_products_query`. Řádky jsou fakturované položky: `plneni`, `mnozstvi`, `cena`, `castka` bez DPH, `partner_nazev`, `dokl_cis`. Pořadí není podle data, seřaď si je sám. Produkt bez prodejů vrátí jeden prázdný řádek.

## Libovolné období podle zákazníků

- Když přehledy výše období nepokryjí, sečti vystavené faktury z `receivables_query`. Postup je v skillu `receivables-payables`.
- Do tržeb počítej `castka_kc` (bez DPH) podle data `plneni`. Vynech stornované doklady (`stav` -1), doklady „Neřeší se“ (-2) a zálohové faktury (`dokl_typ` 12 a 13). U dobropisů (`dokl_typ` 11) ověř znaménko.
- Řekni, kolik faktur jsi prošel a že jde o fakturované tržby.

## Nepoužívej

- `report_order_evaluation` s rozsahem dat zatím nevrací výsledky. Ziskovost objednávek tímto konektorem nezjistíš.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- Když data obsahují více měn, částky v různých měnách nesčítej.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Procenta zaokrouhli na jedno desetinné místo.
- Surový JSON do odpovědi nevkládej.
- Uveď použité období a zdroj, aby si uživatel mohl výsledek ověřit v NBS.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: zkus jiný zdroj z tabulky výše, ale stejný dotaz neopakuj dokola.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
