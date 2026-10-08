# Changelog

Podstatné změny pluginu Notia Business Server. Nové změny se zapisují do sekce „Nevydáno“, při vydání ji `node scripts/release.mjs` přejmenuje na novou verzi (postup v CONTRIBUTING.md). Verze odpovídá `version` v `.claude-plugin/plugin.json`. U každé verze je uvedeno, jaký bridge NBS potřebuje.

## [Nevydáno]

## [1.0.0] – 2026-10-08

První stabilní verze pro adresář pluginů Claude. Obsahově shodná s 0.2.0.

**Bridge:** stejný požadavek jako 0.2.0.

## [0.2.0] – 2026-10-07

**Bridge:** vyžaduje bridge s novými parametry nástrojů: filtry `partner`, `vystaveni_od/do` a `plneni_od/do` u pohledávek a závazků, `kod` a `nazev` u `sales_products_query`, `dokl_cis`, `ex_id` a `dokl_cis_odb` u `sales_orders_query`, číselné `sklad` a `interval`. S dřívějším bridge skončí tato volání chybou „Neplatné argumenty“. Plugin vydávejte až po nasazení bridge.

### Přidáno
- Skill `nbs-overview`: přehled oblastí, se kterými konektor pomůže, jen podle nástrojů, které firma zpřístupnila.
- Hledání produktu podle kódu nebo názvu rovnou s číselným `id`, objednávky podle čísla, čísla z e-shopu nebo čísla zákazníka.
- Zúžení pohledávek a závazků podle partnera a období vystavení nebo plnění.
- Srovnání tří tvarů meziroční změny (`report_sales_yoy`, `companies_query`, `report_pl_how`) a jejich přesnosti.
- Společný číselník stavu zásilky pro zásilky i objednávky.

### Změněno
- Sekce Společná pravidla, Prezentace a Chyby jsou ve všech skills stejné a generují se ze `shared/` (`node scripts/sync-shared.mjs`).
- Chyby pokrývají všechny hlášky gateway včetně neplatných argumentů, časového limitu a vypnuté integrace.
- Tržby z faktur se počítají stejně jako přehledy prodejů NBS: faktury a dobropisy ve stavu 1 až 3, dobropisy mají záporné částky.
- Do konverzace se načítají nejvýš dvě stránky seznamu. Celkové tržby za celé měsíce se berou z `report_sales_yoy`.
- Procenta se zaokrouhlují na jedno desetinné místo, pokud uživatel nechce jinak, a nikdy přesněji, než vrací zdroj.
- Licence změněna z MIT na Apache-2.0.

### Odstraněno
- Záložní postup pro selhání `company_receivables_query` (příčina je v bridge opravená).
- Pravidlo „limit 20 u skladů“: `warehouses_query` vrací jen základní pole skladu.
- Pokyn posílat některá čísla jako text.

## [0.1.0] – 2026-10-06

První verze: konektor `https://mcp.notia.cz/mcp` a devět skills pro oblasti NBS.
