---
name: fixed-assets
description: Dlouhodobý majetek z Notia Business Serveru (NBS). Použij, když se uživatel ptá na evidenci majetku, pořizovací a zůstatkovou cenu, účetní nebo daňové odpisy, kolik zbývá odepsat, technické zhodnocení, umístění majetku nebo jeho vyřazení, a je připojený konektor Notia Business Server.
---

# Dlouhodobý majetek v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- `fixed_assets_query` vrací `{ total, rows }`, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. `search` nic nezúží.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Seznam majetku a jeho hodnoty | `fixed_assets_query` |
| Aktuální hodnoty jedné karty | `fixed_asset_detail` |
| Účetní odpisy po obdobích | `fixed_asset_accounting_depreciation` |
| Daňové odpisy po letech | `fixed_asset_tax_depreciation` |
| Z čeho se skládá pořizovací cena | `fixed_asset_cost_components` |
| Vyřazení z evidence | `fixed_asset_disposals` a `fixed_asset_detail` |

Všechny nástroje pro jednu kartu berou číselné `id` z `fixed_assets_query`. Kartu podle názvu nebo inventárního čísla najdeš procházením stránek, seznam je seřazený od naposledy založených.

## Pole majetku

- Inventární číslo je `kod` + `cislo`, dále `nazev`, `skupina`, `podskupina`.
- Stav `stav`: 0 Nový, 1 V používání, 2 Vyřazený. Datum uvedení do užívání `uvedeni`, vyřazení `vyrazeni`.
- Účetní hodnoty mají příponu `_uc`, daňové `_da`: pořizovací cena `pc_*`, oprávky `opr_*`, zůstatková cena `zc_*`. Kolik zbývá odepsat, je zůstatková cena.
- Odpisy: účetní metoda `odpmet_uc` a doba `doba_uc`, daňová odpisová skupina `m_skupina_da` a příznak rovnoměrného odpisu `rovnom_da`.
- Příznaky `hmotny`, `investicni`, `odpisovany`. Umístění `lokalita`, `budova`, `mistnost`, útvar `utvar`.
- `fixed_asset_detail` má navíc hodnoty po částečném vyřazení `akt_pc_uc`, `akt_opr_uc`, `akt_zc_uc` (a `_da`). Pro „kolik má majetek teď“ použij tyto. Když karta neexistuje, vrátí prázdnou odpověď.

## Odpisy a složky ceny

- Účetní odpisy: řádek za období `obdobi` s částkou `castka` za to období. Typ `typ`: 0 Počáteční oprávky, 1 Běžný, 2 Přerušení odpisů, 3 Vyřazení, 4 Částečné vyřazení.
- Daňové odpisy: řádek za rok `rok` s částkou `castka`, stejným `typ`, názvem metody `metoda` a daňovou uznatelností `uznatelnost`.
- Složky pořizovací ceny: `nazev`, `castka` v měně `mena`, `castka_kc` v Kč, `typ` (0 účetní i daňová, 1 jen účetní, 2 jen daňová) a `zvyseni` (0 navýšení ceny, 1 technické zhodnocení).
- `fixed_asset_disposals` je záznam vyřazování množství a přesunů (`datum`, `mnozstvi`, `duvod`, umístění). Částky neobsahuje. Hodnotu a způsob vyřazení najdeš v detailu karty (`vyrazeno_uc`, `vyrazeno_da`, `zpusob_vyr_nazev`, `prijem_vyr`).

## Typické dotazy

- **Celková hodnota majetku.** Projdi všechny stránky a sečti `pc_uc` a `zc_uc` karet ve stavu 1. Pro daňový pohled použij `_da`.
- **Odpisy za rok.** Souhrn za celý majetek konektor nevrací. Pro jednotlivé karty sečti účetní odpisy s `obdobi` v daném roce. U velké evidence to uživateli nabídni jen pro vybrané karty.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- Vždy uveď, jestli jde o účetní, nebo daňové hodnoty.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Surový JSON do odpovědi nevkládej.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj dokola. Řekni uživateli, co se nepodařilo.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
