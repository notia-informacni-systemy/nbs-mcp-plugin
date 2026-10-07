---
name: companies-pricing
description: Firmy (zákazníci a dodavatelé), skupiny firem, cenové kategorie, ceníky a odeslaná pošta z Notia Business Serveru (NBS). Použij, když uživatel hledá firmu nebo partnera, jeho zkratku, IČO, adresu, splatnost nebo cenovou kategorii, tržby zákazníka nebo skupiny zákazníků, ceníky a ceny produktů v nich, nebo odeslané e-maily, a je připojený konektor Notia Business Server.
---

# Firmy a ceníky v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`.
- Když čekáš hodně záznamů, nejdřív zjisti `total` (stačí `limit` 1). Do konverzace nenačítej víc než dvě stránky po 200 řádcích, víc se do ní nevejde. Když by odpověď potřebovala víc, zuž dotaz, nebo uživateli řekni, kolik záznamů z `total` jsi prošel.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.
- Relativní období („minulý měsíc“, „letos“, „Q1“) převeď na konkrétní data podle dnešního dne a v odpovědi je uveď.

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
- Tržby v Kč: `sales_this_month`, `sales_last_month`, `sales_this_year`, `sales_last_year`, `sales_this_month_last_year`, poslední prodej `sales_last_date`. Poměry `sales_yoy`, `sales_this_month_yoy` a `sales_this_month_mom` jsou růst jako podíl zaokrouhlený na celá procenta (0,12 = +12 %). Hodnota 0 může znamenat i chybějící srovnání. Ostatní přehledy vrací změny v jiném tvaru, srovnání je v skillu `sales-analysis`.
- `company_detail` přidává `pravnicka` (0 = fyzická osoba), splatnost ve dnech `splatnost`, měnu `mena`, způsob úhrady `uhrada`, slevu `sleva`, obchodníka `obchodnik` a plátcovství DPH `platce_dph`. Když firma neexistuje, vrátí prázdnou odpověď.
- U fyzických osob (`pravnicka` 0) neuváděj e-mail ani adresu, pokud se na ně uživatel výslovně neptá.
- Žebříček zákazníků podle tržeb vyžaduje projít celý seznam firem.

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
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Data piš jako 1. 4. 2026.
- Procenta zaokrouhli na jedno desetinné místo, pokud uživatel nechce jinou přesnost. Přesnost nikdy nezvyšuj nad to, co zdroj vrací, a když uživatel chce víc, řekni mu to. Změny mezi obdobími piš jako růst v procentech se znaménkem, například +12,0 % nebo −3,5 %.
- Částky v různých měnách nesčítej. Pro souhrn použij pole v Kč, pokud ho zdroj má, a řekni to.
- Když jsi prošel jen část seznamu, řekni, kolik záznamů z `total` výsledek zahrnuje.
- Uveď zdroj a období, aby si uživatel mohl výsledek ověřit v NBS.
- Surový JSON do odpovědi nevkládej.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Správce vaší firmy integraci NBS s Claude vypnul“ nebo „Nemáte v NBS oprávnění používat Claude“: řekni uživateli, že integraci musí zapnout nebo oprávnění přidělit správce NBS v jeho firmě a potom je potřeba konektor znovu připojit. Další nástroje nezkoušej.
- „K těmto datům nemáte v NBS oprávnění“: řekni to uživateli a nezkoušej data získat jiným nástrojem.
- „Neplatné argumenty“ nebo „NBS odmítl parametry dotazu“: oprav parametry podle schématu nástroje a této příručky (formát data, typ hodnoty, číselné `id` místo kódu) a zkus to jednou znovu. Když to znovu selže, řekni uživateli, co se nepodařilo.
- „Požadovaná data v NBS neexistují“: ověř, že `id` pochází ze správného seznamu. Když ano, řekni, že záznam v NBS není.
- „Výsledek je příliš velký“: sniž `limit` na polovinu, případně zuž období.
- „NBS neodpověděl v časovém limitu“: zuž dotaz (menší `limit`, kratší období) a zkus to jednou znovu.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj. Když pro otázku existuje jiný zdroj z tabulky „Který nástroj kdy“, zkus ho, jinak řekni uživateli, co se nepodařilo.
- „Systém NBS je momentálně nedostupný“, „NBS je momentálně přetížený“ nebo „Komunikace s NBS selhala“: řekni to uživateli a nabídni zopakování později.
- „Neznámý nástroj“ nebo „Tento nástroj NBS Hub nezná“: firma nástroj nemá zpřístupněný, postupuj jako u chybějícího nástroje.
- Po žádné chybě data neodhaduj. Chybové odpovědi obsahují „ID požadavku“, při hlášení problému ho uživatel předá podpoře Notia.
