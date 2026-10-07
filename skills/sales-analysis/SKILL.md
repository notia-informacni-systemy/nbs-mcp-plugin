---
name: sales-analysis
description: Analýza prodejů, tržeb a obratu z Notia Business Serveru (NBS). Použij, když se uživatel ptá na tržby a jejich vývoj v čase, meziroční nebo měsíční srovnání, prodeje podle obchodníků, zákazníků, skupin zákazníků nebo produktů, nejprodávanější produkty nebo největší zákazníky, a je připojený konektor Notia Business Server.
---

# Analýza prodejů v NBS

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
| Tržby po měsících a meziročně | `report_sales_yoy` |
| Tržby podle obchodníků | `report_sales_partners_yoy` |
| Rychlé srovnání měsíce nebo roku k dnešku | `dashboard_revenue_monthly`, `dashboard_revenue_yearly` |
| Tržby zákazníků (tento a minulý měsíc a rok) | `companies_query` |
| Tržby skupin zákazníků | `company_groups_query` |
| Prodeje produktů (tento a minulý měsíc a rok) | `report_products_evaluation` se `sklad` 0 |
| Komu a za kolik se prodával jeden produkt | `sales_products_query` (`nazev` nebo `kod`) → `id` → `sales_product_sales_history` |
| Zákazníci za libovolné období | `receivables_query` s `plneni_od` a `plneni_do` (vystavené faktury) |

Tyto zdroje počítá NBS z různých podkladů, proto se jejich čísla nemusí přesně shodovat. `report_sales_yoy` a `report_sales_partners_yoy` zahrnují vystavené faktury a dobropisy i maloobchodní prodeje z pokladen. Součet faktur z `receivables_query` maloobchod nezahrnuje. Uveď, z kterého přehledu výsledek pochází. Když pole neříká, jestli jsou částky s DPH, netvrď to.

## Tři tvary meziroční změny

Každý přehled vrací meziroční změnu v jiném tvaru. Než změny porovnáš nebo ukážeš uživateli, převeď všechny na růst v procentech.

| Zdroj | Pole | Tvar | +12 % vrací jako | Převod na růst v % |
|---|---|---|---|---|
| `report_sales_yoy`, `report_sales_partners_yoy` | `yearProcK`, `yearProcMoMK` | růst v procentech, nezaokrouhlený | `12` | beze změny |
| `companies_query` | `sales_yoy`, `sales_this_month_yoy`, `sales_this_month_mom` | růst jako podíl, zaokrouhlený na celá procenta | `0.12` | × 100 |
| `report_pl_how` (skill `accounting`) | `yoy_proc` | index, 100 = beze změny, zaokrouhlený na dvě desetinná místa | `112` | − 100 |

- Když je srovnávací hodnota nulová nebo chybí, vrací přehledy 0 nebo `null`. U `report_pl_how` to neznamená pokles o 100 % a u ostatních to neznamená „beze změny“. Růst v takovém případě spočítat nejde, řekni to.
- `company_groups_query`, `report_products_evaluation` a dashboardy poměr nevrací. Růst spočítej z částek jako (nová − stará) / stará × 100.
- Přehledy srovnávají různá období a počítají z různých podkladů. Když dáváš vedle sebe změny z více přehledů, u každé uveď zdroj a období.

## Meziroční přehledy

- `report_sales_yoy` vrací `{ total, values, maxHistory }`. `values` je 12 měsíců, `month` 0 je leden. `year0` je letošní rok, `year1` loňský a tak dál až po `maxHistory`.
- `yearProcK` je růst roku K proti roku před ním v procentech, `yearProcMoMK` změna proti předchozímu měsíci, také v procentech.
- Letošní rok není celý: `total.year0` je jen od začátku roku, budoucí měsíce mají 0 a −100 %. Pro férové srovnání sečti v obou letech jen uzavřené měsíce.
- Čtvrtletí a jiná období poskládej sečtením měsíců z `values`.
- `report_sales_partners_yoy` má stejný tvar, jen každý měsíc v `values` má `data` (součet měsíce) a `children` (obchodníci, jméno v `data.name`). Řádek „Tržby bez obchodníka“ jsou prodeje bez přiřazeného obchodníka. Součet obchodníků se nemusí rovnat součtu měsíce. Report je pomalý, volej ho jednou.
- „Partneři“ v názvu reportu znamenají obchodníky, ne zákazníky.

## Dashboard

- `dashboard_revenue_monthly` a `dashboard_revenue_yearly` vrací graf `{ labels, datasets }` vztažený ke včerejšku.
- Měsíční: šest bodů, tedy stejný měsíc před třemi, dvěma a jedním rokem, předminulý měsíc, minulý měsíc a aktuální měsíc. `datasets[0]` je tržba do stejného dne v měsíci, `datasets[1]` celý měsíc.
- Roční: posledních šest let. `datasets[0]` je od začátku roku do stejného dne, `datasets[1]` celý rok. Pro srovnání letoška s loňskem použij `datasets[0]`.

## Zákazníci a produkty

- `companies_query` má u každé firmy tržby v Kč: `sales_this_month`, `sales_last_month`, `sales_this_year`, `sales_last_year`, `sales_this_month_last_year`. Poměry `sales_yoy`, `sales_this_month_yoy` a `sales_this_month_mom` mají jiný tvar než `yearProcK`, viz tabulka výše. Seznam je seřazený od naposledy založených firem, takže žebříček zákazníků vyžaduje projít všechny stránky.
- `company_groups_query` je krátký seznam skupin (načti ho s `limit` 200) s tržbami `sales_this_month`, `sales_last_month`, `sales_to_date_this_year`, `sales_to_date_last_year`.
- `report_products_evaluation` se `sklad` 0 vrací u každého produktu prodeje v Kč (`castka_kc_akt_mesic`, `castka_kc_min_mesic`, `castka_kc_akt_rok`, `castka_kc_min_rok`) a v kusech (`mnozstvi_*`). Je seřazený podle kódu, žebříček vyžaduje projít všechny stránky.
- `sales_product_sales_history` bere číselné `id` produktu z `sales_products_query`, který produkt najde podle `nazev` (část názvu) nebo `kod` (přesný kód). Řádky jsou fakturované položky: `plneni`, `mnozstvi`, `cena`, `castka` bez DPH, `partner_nazev`, `dokl_cis`. Pořadí není podle data, seřaď si je sám. Produkt bez prodejů vrátí jeden prázdný řádek.

## Libovolné období podle zákazníků

- Celkové tržby za období složené z celých měsíců vezmi z `report_sales_yoy` (sečti měsíce z `values`), i pro roky zpět. Faktury na to neprocházej.
- Rozpad po zákaznících za období, které přehledy výše nepokryjí, spočítej z vystavených faktur: `receivables_query` s `plneni_od` a `plneni_do`, pro jednoho zákazníka navíc s `partner`. Další pravidla pro doklady jsou v skillu `receivables-payables`.
- Když je faktur v období víc, než se podle společných pravidel vejde do konverzace, nenačítej je. Řekni uživateli, kolik jich je, a nabídni celkový součet z `report_sales_yoy`, kratší období nebo vybrané zákazníky přes `partner`.
- Do tržeb počítej `castka_kc` (bez DPH) podle data `plneni`. Počítej jen faktury a dobropisy (`dokl_typ` 10 a 11) ve stavu 1 až 3, stejně jako přehledy prodejů NBS. Nové doklady (`stav` 0), stornované (-1), „Neřeší se“ (-2) a zálohové faktury (`dokl_typ` 12 a 13) vynech. Dobropisy (`dokl_typ` 11) mají `castka_kc` záporné, takže se při sečtení s fakturami samy odečtou. Kladný dobropis je chyba v datech, uživatele na něj upozorni.
- Řekni, kolik faktur jsi sečetl a že jde o fakturované tržby.

## Nepoužívej

- `report_order_evaluation` s rozsahem dat zatím nevrací výsledky. Ziskovost objednávek tímto konektorem nezjistíš.

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
