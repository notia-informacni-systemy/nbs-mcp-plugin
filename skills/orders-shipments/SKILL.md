---
name: orders-shipments
description: Prodejní objednávky, zásilky, e-shopy a prodejny z Notia Business Serveru (NBS). Použij, když se uživatel ptá na objednávky zákazníků, jejich stav, úhradu nebo expedici, na zásilky, dopravce, sledovací čísla a doručení, na napojené e-shopy nebo prodejny (POS), a je připojený konektor Notia Business Server.
---

# Objednávky a zásilky v NBS

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
| Objednávky zákazníků, objednávka podle čísla | `sales_orders_query` s `dokl_cis`, `ex_id` nebo `dokl_cis_odb` |
| Zásilky jedné objednávky | `sales_order_shipments_query` s `id` objednávky |
| Všechny zásilky | `shipments_query` |
| Napojené e-shopy | `sales_websites` |
| Prodejny přihlášeného uživatele | `pos_stores` |
| Způsoby dopravy | `shipping_methods_query` |

## Hledání a období

- Objednávku podle čísla najdeš přes `sales_orders_query`: naše číslo v `dokl_cis`, číslo z e-shopu v `ex_id`, číslo objednávky zákazníka v `dokl_cis_odb`. Stačí i část čísla, velikost písmen nerozhoduje.
- U zásilek `search` nic nezúží.
- Seznamy jsou seřazené od naposledy zapsaných záznamů a řazení nejde změnit. Pro období procházej stránky od začátku a skonči, když jsou na celé stránce jen záznamy starší než začátek období.

## Pole objednávek

- Číslo: `dokl_cis` (řada `dokl_kod`, rok `dokl_rok`), číslo objednávky z e-shopu `ex_id`, číslo objednávky zákazníka `dokl_cis_odb`. `id` je interní číslo pro `sales_order_shipments_query`.
- `datum`, zákazník `partner` (zkratka) a `partner_nazev`.
- Částky: `castka` bez DPH, `dan`, `celkem` s DPH, měna `mena`. Úhrada: způsob `uhrada`, příznak `uhrazeno`.
- Doprava `doprava`, kanál objednání `zp_objednani`, odeslání `odeslano`.
- Stav zásilky objednávky je ve dvou polích: `stav_zasilky2` (ten Hub u objednávek zobrazuje ve sloupci „Stav zásilky“) a `stav_zasilky`. Obě používají číselník z části Stav zásilky níže. Prázdná hodnota znamená, že NBS k objednávce stav zásilky nemá. Když se pole liší nebo má objednávka víc zásilek, rozhoduje stav jednotlivých zásilek z `sales_order_shipments_query`.
- Stav `stav`: 0 Nová, 1 Částečně potvrzená, 2 Potvrzená, 3 Ukončená, 4 Neřeší se.

## Pole zásilek

- Číslo `dokl_cis`, `datum`, příjemce `prijemce_nazev` a `mesto_pri`, `stat_pri`.
- Dopravce `carrier` / `prepravce`, způsob dopravy `doprava_nastaveni_nazev`, sledovací číslo `dokl_cis_poskyt_sluzby`, odkaz `tracking_url`.
- Částky `castka` bez DPH a `castka_s_dph`, měna `mena`, `hmotnost`.
- Vazby: objednávka `id_objp`, faktura `id_pohl` (pro `receivable_detail`), variabilní symbol `var_sym`.
- Stav `stav_zasilky`, číselník je v části Stav zásilky.
- U e-shopových objednávek bývají zákazníci soukromé osoby. Jména a adresy příjemců uváděj, jen když se uživatel ptá na konkrétní objednávku.

## Stav zásilky

Stejný číselník platí pro `stav_zasilky` u zásilek i pro `stav_zasilky` a `stav_zasilky2` u objednávek: 0 Nová, 1 Odeslaná, 2 Nepřevzatá, 3 Uhrazená, 4 Vrácená, 5 Reklamace, 6 Ztracená, 7 Částečně vrácená, 8 Doručená, 9 Chyba doručení, 10 Čekající na odeslání, 11 Připraveno dopravci, 12 Vrací se zpět, 13 Čeká na vyzvednutí.

## Ostatní nástroje

- `sales_websites` vrací `[{ id, name }]`, kde obě hodnoty jsou kód e-shopu.
- `pos_stores` vrací `{ success, data: { stores: [{ store_id, store_name }] } }`, jen prodejny přidělené přihlášenému uživateli.

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
