---
name: accounting
description: Účetnictví a výkazy z Notia Business Serveru (NBS). Použij, když se uživatel ptá na výsledovku (P&L), hospodářský výsledek, EBIT, plnění rozpočtu, celkové náklady a výnosy, aktiva a pasiva, účetní transakce a uzamčení období, nebo na číselníky útvarů, výkonů, účetních zakázek a provozoven, a je připojený konektor Notia Business Server.
---

# Účetnictví a výkazy v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`.
- Relativní období („minulý měsíc“, „letos“, „Q1“) převeď na konkrétní data podle dnešního dne a v odpovědi je uveď.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Výsledovka, EBIT, srovnání s rozpočtem a loňskem | `report_pl_how` |
| Celkové náklady, výnosy, aktiva a pasiva | `balance_sheet_totals` |
| Útvary, výkony, účetní zakázky, provozovny | `shapes_query`, `actions_query`, `orders_codebook_query`, `stores_list` |
| Kód partnera v účetnictví | `accounting_partner_search` |
| Účetní transakce a uzamčení | `journal_entries_query` |

## Výsledovka (`report_pl_how`)

- Pošli oba parametry: `limitDate` ve tvaru `YYYY-MM-DD` (rozhoduje jen rok a měsíc) a `interval` jako `"0"` pro samotný měsíc, nebo `"1"` pro období od ledna do daného měsíce.
- Vrací `{ data }` s 11 řádky v pevném pořadí: Čistý obrat, COGS, VLC+FLC, MACO, Gross Margin, BTL, Marketing ostatní, Marketing celkem, Sales OHD, HQ, EBIT.
- Každý řádek má `actual` (skutečnost), `budget` (rozpočet) a `last_year` (stejné období loni). `yoy` a `act_bdg` jsou rozdíly. `yoy_proc` a `act_bdg_proc` jsou poměry, kde 100 znamená beze změny: růst je `yoy_proc` − 100.
- Řádek Gross Margin je v procentech (MACO / Čistý obrat), ne v penězích.
- Výsledovka se nastavuje pro každou firmu zvlášť. Když nástroj vrátí chybu nebo samé nuly, řekni, že firma tento výkaz v NBS nemá, a použij `balance_sheet_totals`.

## Náklady, výnosy, aktiva a pasiva (`balance_sheet_totals`)

- Pošli `idUks` `0` (hlavní kniha), `roks` jako jeden rok a pro období `obdobiOd` a `obdobiDo` ve tvaru `YYYYMM`, například `202601` a `202609`. Období pošli buď celé, nebo vůbec. Bez období dostaneš celý rok.
- Vrací `{ aktiva, pasiva, naklady, vynosy }`. Hospodářský výsledek za období je `vynosy` − `naklady`.
- Náklady a výnosy jsou obraty za zadané období. Aktiva a pasiva jsou zůstatek ke konci období jen tehdy, když období začíná lednem.
- Pasiva už obsahují výsledek běžného roku, aby rozvaha byla vyrovnaná.
- Do jednoho volání dávej jen jeden rok. Hodnoty NBS přepočítává dávkově, takže nemusí obsahovat úplně poslední zaúčtování.

## Číselníky

- `shapes_query` (útvary), `actions_query` (výkony) a `orders_codebook_query` (účetní zakázky) jsou krátké seznamy bez hledání. Načti je s `limit` 200. Pole: `kod`, `nazev`, `popis`, nadřízený `matka`, `aktivni`.
- Účetní zakázky mají navíc plán `vynosy_plan`, `naklady_plan`, `realizace_plan` a vedoucího `vedouci`. Nejsou to smlouvy se zákazníky (ty jsou v skillu `contracts`).
- `stores_list` vrací provozovny `[{ id, name }]`.

## Ostatní nástroje

- `accounting_partner_search` hledá podle části názvu (aspoň 2 znaky) a vrací `[{ partner, nazev }]`, 30 výsledků na stránku. Další stránka je `offset` 30, 60 a tak dál.
- `journal_entries_query` vrací účetní transakce, tedy dávky dokladů: `nazev`, `popis`, datum založení `datum`, `uzavreno` a `uctovat_od`. Zápisy s datem do `uctovat_od` jsou uzamčené. Částky ani účty neobsahuje.

## Co konektor neumí

- Obraty a zůstatky jednotlivých účtů, hlavní knihu po účtech ani seznam účetních zápisů konektor nevrací. Řekni to a odkaž uživatele do NBS.
- `journal_entry_item_detail` použij, jen když uživatel sám zadá ID dokladu a číslo položky.
- `balance_sheet_transaction_search` slouží k výběru transakcí při nastavení pracovní knihy. Částky nevrací, pro účetní dotazy ho nepoužívej.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Procenta zaokrouhli na jedno desetinné místo.
- Surový JSON do odpovědi nevkládej. Uveď použité období a výkaz, aby si uživatel mohl výsledek ověřit v NBS.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS odmítl parametry dotazu“: zkontroluj formát `limitDate`, `interval` a `YYYYMM` podle této příručky.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
