---
name: inventory-purchasing
description: Sklady, skladové zásoby, produkty a nákup z Notia Business Serveru (NBS). Použij, když se uživatel ptá na stav skladu, dostupnost, rezervace nebo očekávaný příjem zboží, skladové karty a hodnotu zásob, příjemky, výdejky, dodací listy, inventury, ceny a marže produktů, nebo na nákupní objednávky u dodavatelů, a je připojený konektor Notia Business Server.
---

# Sklady, produkty a nákup v NBS

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
| Najít produkt a jeho číselné `id` | `sales_products_query` s `nazev` nebo `kod` |
| Kódy produktů podle části kódu | `sales_products_search` |
| Zásoba, dostupnost, ceny a prodeje produktů | `sales_products_query`, detail `sales_product_detail` |
| Totéž pro jeden sklad, s loňskými prodeji | `report_products_evaluation` |
| Seznam skladů | `warehouses_query`, detail `warehouse_detail` |
| Zásoba po skladech (skladové karty) | `warehouse_items_query`, detail `warehouse_item_detail` |
| Příjemky, výdejky, dodací listy, inventury | `stock_receipts_query`, `stock_issues_query`, `delivery_notes_query`, `inventory_query` |
| Nákupní objednávky u dodavatelů | `dispensed_orders_query`, detail `dispensed_order_detail` |

## Hledání a stránkování

- Produkt hledej v `sales_products_query` parametrem `nazev` (část názvu) nebo `kod` (přesný kód).
- `search` v této oblasti funguje jen u `sales_products_search`. Ostatní seznamy, které ho nabízí, ho ignorují a vrátí vše.

## Produkty

- `sales_products_search` vyžaduje `search` a vrací `[{ id, name }]`. Tady je `id` kód produktu a `name` má tvar „KÓD (název)“. Pro `sales_product_detail` se toto `id` nehodí, číselné `id` k nalezenému kódu vrátí `sales_products_query` s `kod`.
- `sales_products_query` vrací u každého produktu číselné `id` i `kod` a je seřazený podle `kod`. Zúžíš ho parametrem `kod` (přesná shoda včetně velikosti písmen) nebo `nazev` (část názvu, bez ohledu na velikost písmen). Číselné `id` potřebují `sales_product_detail` a `sales_product_sales_history`.
- Zásoba: `stav_skladu` je na skladě, `objednano` objednáno zákazníky, `na_ceste` objednáno u dodavatelů. `disponibilni_stav_skladu` = na skladě − objednáno zákazníky. `ocekavany_stav_skladu` = disponibilní + na cestě. Jednotka je `mj1`, množství uváděj vždy s jednotkou.
- Ceny: prodejní `cena_pro`, průměrná skladová `prum_cena`, nákupní `nak_cena`, marže v procentech `marze`.
- Prodeje v Kč a kusech: tento měsíc `castka_kc_akt_mesic` a `mnozstvi_akt_mesic`, letos `castka_kc_akt_rok` a `mnozstvi_akt_rok`, průměr za 12 měsíců `prum_mnozstvi_12_mesicu`.
- `report_products_evaluation` má navíc minulý měsíc a rok (`castka_kc_min_mesic`, `castka_kc_min_rok`) a odhad prodeje `prodej_odhad`. Parametr `sklad` je číselné `id` z `warehouses_query`, 0 znamená všechny sklady dohromady.
- Žebříček přes všechny produkty vyžaduje projít celý seznam.

## Sklady a skladové karty

- `warehouses_query` vrací jen základní údaje skladu: `id`, `nazev`, `popis`, `typ`, `aktivni`, `centralni_sklad`, `utvar`, `spravce`, adresu (`ulice`, `mesto`, `psc`, `stat`) a `id_provozovny`. Ostatní nastavení skladu vrací `warehouse_detail`.
- Typ skladu `typ`: 0 Zboží, 1 Materiál, 2 Konsignační, 3 Speciální, 4 Centrální, 5 Komisní, 6 Prodejna, 7 Reklamační, 8 Bistro, 9 Výrobní. Neaktivní sklady mají `aktivni` 0.
- Skladová karta je jeden produkt v jednom skladu: `sklad_nazev`, `produkt`, `nazev`, zůstatek `zustatek`, rezervace `rezervace`, hodnota v Kč `zustatek_mo_kc`, umístění `pozice`, průměrný měsíční výdej za 3 a 12 měsíců `vydej_prum_mesic_z_3`, `vydej_prum_mesic_z_12`.
- Volné množství na kartě je `zustatek` − `rezervace`. Na kolik měsíců zásoba vystačí, odhadni jako `zustatek` / `vydej_prum_mesic_z_3` a řekni, že jde o odhad.
- `warehouse_item_detail` bere `id` skladové karty, ne produktu.

## Skladové doklady

- Společná pole: číslo `dokl_cis`, `datum`, sklad `sklad_nazev`, partner `partner_nazev`. Seřazené od naposledy zapsaných.
- Příjemky, `stav`: -1 Stornovaná, 0 Nová, 1 Přijatá. Částka `castka` v měně `mena`.
- Výdejky, `stav`: -2 Neřeší se, -1 Stornovaná, 0 Nová, 1 Vydaná, 2 Expedovaná. Účetní cena výdeje `castka_uc`.
- Dodací listy, `stav`: -2 Neřeší se, -1 Neznámý, 0 Nový, 1 Potvrzený, 2 Ukončený. `castka`, `castka_s_dph`, počet kusů `ks_celkem`.
- Inventury, `stav`: 0 Nová, 1 Rozpracovaná, 2 Ukončená. Datum inventury `datum_k`.

## Nákupní objednávky

- `dispensed_orders_query` jsou objednávky vydané dodavatelům. `stav`: 0 Nová, 1 Částečně potvrzená, 2 Potvrzená, 3 Ukončená, 4 Neřeší se. Částky `castka` bez DPH, `dan`, `celkem`, měna `mena`, dodavatel `partner_nazev`.
- Sleva `sleva_proc` je v seznamu podíl (0,05 = 5 %), v detailu procenta.
- `dispensed_order_detail` přidává termín dodání `dodani`, číslo u dodavatele `dokl_cis_dod`, nákupčího `nakupci` a součet položek `sum_polozek`.
- Položky jedné objednávky tímto konektorem spolehlivě nezjistíš: `dispensed_order_items_query` vrací řádky všech objednávek dohromady. Použij součty z detailu a pro položky odkaž uživatele do NBS.

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
