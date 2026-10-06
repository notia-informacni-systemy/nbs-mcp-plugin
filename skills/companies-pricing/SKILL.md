---
name: companies-pricing
description: Firmy (zákazníci a dodavatelé), skupiny firem, cenové kategorie, ceníky a odeslaná pošta z Notia Business Serveru (NBS). Použij, když uživatel hledá firmu nebo partnera, jeho zkratku, IČO, adresu, splatnost nebo cenovou kategorii, tržby zákazníka nebo skupiny zákazníků, ceníky a ceny produktů v nich, nebo odeslané e-maily, a je připojený konektor Notia Business Server.
---

# Firmy a ceníky v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Najít firmu, tržby zákazníka | `companies_query` |
| Údaje firmy (splatnost, měna, DPH) | `company_detail` s číselným `id` |
| Skupiny firem a jejich tržby | `company_groups_query`, detail `company_group_detail` |
| Cenové kategorie | `price_categories_query`, detail `price_category_detail` |
| Ceníky a ceny v nich | `price_lists_query`, `price_list_detail`, `price_list_items_query` |
| Odeslané e-maily | `sent_emails_query` |
| Pohledávky a závazky firmy | skill `receivables-payables` |

## Firmy

- `companies_query` se `search` hledá v názvu, zkratce, ulici, městě a e-mailu. IČO ani DIČ hledat nejde. Firmu podle IČO najdeš tak, že procházíš stránky a porovnáváš `reg_id`.
- Když hledání vrátí víc firem, zeptej se uživatele, kterou myslí.
- Dva identifikátory: `id` je číslo pro `company_detail`, `shortcut` je zkratka partnera. Zkratka je v ostatních oblastech NBS v poli `partner`.
- Pole: `company_name`, IČO `reg_id`, DIČ `vat_id`, `address_city`, skupina `company_group_id` a `company_group_name`, cenová kategorie `price_category` (kód, ne `id`).
- Tržby v Kč: `sales_this_month`, `sales_last_month`, `sales_this_year`, `sales_last_year`, `sales_this_month_last_year`, poslední prodej `sales_last_date`. Poměry `sales_yoy`, `sales_this_month_yoy` a `sales_this_month_mom` jsou podíly (0,12 = 12 %).
- `company_detail` přidává `pravnicka` (0 = fyzická osoba), splatnost ve dnech `splatnost`, měnu `mena`, způsob úhrady `uhrada`, slevu `sleva`, obchodníka `obchodnik` a plátcovství DPH `platce_dph`. Když firma neexistuje, vrátí prázdnou odpověď.

## Skupiny a cenové kategorie

- `company_groups_query` je krátký seznam, načti ho celý s `limit` 200. Pole: `code`, `name`, počet firem `companies_count`, tržby `sales_this_month`, `sales_last_month`, `sales_to_date_this_year`, `sales_to_date_last_year`. `company_group_detail` tržby nemá.
- `price_categories_query` je krátký seznam, načti ho s `limit` 200: `id`, `kod`, `nazev`, hranice tržeb `vyse_trzeb`, automatický přepočet `pouzit_pro_prepocet`. Firmy nesou jen `kod`, `id` pro detail najdeš v tomto seznamu.

## Ceníky

- `price_lists_query`: `nazev`, `prodejni` (1 prodejní, 0 nákupní), `stav` (0 Nový, 1 Aktivní, 2 Zneplatněný), `priorita`, platnost `platnost_od` a `platnost_do`.
- Měnu `mena` a příznak, že ceny jsou s DPH (`cena_s_dph`), má jen `price_list_detail`.
- `price_list_items_query` nemá hledání a je seřazený podle čísla řádku. Pole: `produkt`, `produkt_nazev`, cena `cena_abs`, připravená nová cena `cena_abs_nova`, `mena`, sleva `sleva_proc` a `sleva_abs`, cena s daní `s_dani`, množstevní cena `mnozstevni`.

## Odeslané e-maily

- `sent_emails_query` je velký seznam bez hledání, seřazený od nejnovějších. Pole: předmět `title`, šablona `message_type`, odesílatel `from_user_name`, odesláno `sent`, stav `state` (0 nová, 1 připravená k odeslání, 2 odeslaná, -1 chyba).
- `adress` je e-mail příjemce. Uváděj ho jen na přímý dotaz.
- Šablony zpráv jsou v `message_templates_query`.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- U fyzických osob (`pravnicka` 0) neuváděj e-mail ani adresu, pokud se na ně uživatel výslovně neptá.
- Žebříček zákazníků podle tržeb vyžaduje projít celý seznam firem. Když jsi prošel jen část, řekni kolik z `total`.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Surový JSON do odpovědi nevkládej.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj dokola. Řekni uživateli, co se nepodařilo.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
