---
name: nbs-overview
description: Přehled, s čím pomůže konektor Notia Business Server (NBS). Použij, když se uživatel ptá, co všechno umíš z NBS, jaká data z NBS dokážeš zjistit nebo s čím mu pomůžeš, případně když dotaz na NBS nespadá do žádné konkrétní oblasti, a je připojený konektor Notia Business Server.
---

# Co umí konektor NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`.
- Když čekáš hodně záznamů, nejdřív zjisti `total` (stačí `limit` 1). Do konverzace nenačítej víc než dvě stránky po 200 řádcích, víc se do ní nevejde. Když by odpověď potřebovala víc, zuž dotaz, nebo uživateli řekni, kolik záznamů z `total` jsi prošel.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.
- Relativní období („minulý měsíc“, „letos“, „Q1“) převeď na konkrétní data podle dnešního dne a v odpovědi je uveď.

## Oblasti

| Oblast | Skill | Hlavní nástroj | Na co se může uživatel ptát |
|---|---|---|---|
| Prodeje a tržby | `sales-analysis` | `report_sales_yoy` | vývoj tržeb, meziroční srovnání, obchodníci, největší zákazníci a produkty |
| Pohledávky, závazky a platby | `receivables-payables` | `receivables_query` | vystavené a přijaté faktury, doklady po splatnosti, saldo partnera, platby na účtech |
| Objednávky a zásilky | `orders-shipments` | `sales_orders_query` | objednávky zákazníků, expedice, zásilky a doručení, e-shopy a prodejny |
| Sklady, produkty a nákup | `inventory-purchasing` | `sales_products_query` | zásoby a dostupnost, skladové doklady, ceny a marže, objednávky u dodavatelů |
| Firmy a ceníky | `companies-pricing` | `companies_query` | údaje o zákaznících a dodavatelích, skupiny firem, ceníky, odeslané e-maily |
| Účetnictví a výkazy | `accounting` | `report_pl_how` | výsledovka, hospodářský výsledek, náklady a výnosy, aktiva a pasiva |
| Dlouhodobý majetek | `fixed-assets` | `fixed_assets_query` | evidence majetku, odpisy, zůstatková cena, vyřazení |
| Smlouvy a fakturační podklady | `contracts` | `contracts_query` | smlouvy, sazby a kredit, SLA lhůty, co je připravené k vyfakturování |
| Helpdesk | `helpdesk` | `helpdesk_tickets_query` | tikety, jejich stav a řešitelé, výkazy práce, zákaznický portál |

## Jak odpovědět

- Uveď jen oblasti, jejichž hlavní nástroj konektor nabízí. Firma může nástroje zúžit a ostatní oblasti uživatel nemá k dispozici.
- U každé oblasti napiš jednou větou, co z ní zjistíš, a přidej jednu nebo dvě ukázkové otázky, které si uživatel může rovnou položit.
- Názvy nástrojů ani skillů uživateli nevypisuj.
- Na konkrétní dotaz z některé oblasti odpověz podle jejího skillu.

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
