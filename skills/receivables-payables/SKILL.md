---
name: receivables-payables
description: Pohledávky, závazky a platby z Notia Business Serveru (NBS). Použij, když se uživatel ptá na vystavené nebo přijaté faktury, neuhrazené doklady a doklady po splatnosti, saldo partnera, kdo nám dluží nebo komu dlužíme, závazky čekající na schválení, bankovní transakce nebo to, jestli a kdy přišla platba, a je připojený konektor Notia Business Server.
---

# Pohledávky, závazky a platby v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Vystavené faktury (pohledávky) | `receivables_query`, detail `receivable_detail`, řádky `receivable_items_query` |
| Přijaté faktury (závazky) | `payables_query`, detail `payable_detail`, řádky `payable_items_query` |
| Doklady jednoho partnera | `companies_query` → pole `shortcut` → `company_receivables_query` / `company_payables_query` s `partner` = `shortcut` |
| Řádky napříč všemi doklady | `receivables_all_items_query`, `payables_all_items_query` |
| Závazky čekající na mé schválení | `dashboard_payables_approval` |
| Platby na bankovních účtech | `banking_transactions_query`, detail `banking_transaction_detail` |

## Hledání a období

- `search` tyto seznamy nezužuje. NBS ho u pohledávek, závazků a bankovních transakcí ignoruje a vrátí celý seznam, proto ho nepoužívej.
- Partnera dohledej přes `companies_query` se `search` (hledá v názvu, zkratce, ulici, městě a e-mailu, ne v IČO). Když dohledání vrátí víc firem, zeptej se uživatele, kterou myslí.
- Seznamy jsou seřazené od naposledy zapsaných dokladů a řazení nejde změnit. Pro období procházej stránky od začátku a skonči, když jsou na celé stránce jen doklady starší než začátek období. Pořadí zápisu se od data vystavení může mírně lišit.
- Když `company_receivables_query` nebo `company_payables_query` selže, projdi `receivables_query` / `payables_query` a vyber řádky, jejichž `partner` se rovná zkratce.
- Když bys musel projít víc než zhruba 10 stránek, zastav se a řekni uživateli, kolik dokladů z `total` jsi prošel a že starší doklady ve výsledku chybí.

## Pole pohledávek a závazků

- Číslo dokladu: `dokl_cis` (řada `dokl_kod`, rok `dokl_rok`). Číslo faktury od dodavatele (`ev_cislo_dd`) je jen v `payable_detail`.
- Partner: `partner` (zkratka), `partner_nazev`.
- Data: `vystaveni`, `plneni` (DUZP), `splatnost`, `placeni` (datum úhrady, vyplněné až po zaplacení). `splatnost_dny` je lhůta splatnosti ve dnech, ne počet dní po splatnosti.
- Částky v měně dokladu: `castka` bez DPH, `dan`, `celkem` s DPH, `zustatek` zbývá uhradit. V Kč: `castka_kc`, `dan_kc`, `zustatek_kc`. Měna `mena`, kurz `kurs`.
- Stav pohledávky `stav`: 0 Nová, 1 Vystavená, 2 Částečně uhrazená, 3 Uhrazená, -1 Stornovaná, -2 Neřeší se. U závazku stejně, jen 1 je Přijatý.
- Typ pohledávky `dokl_typ`: 10 faktura (daňový doklad), 11 dobropis, 12 a 13 zálohová faktura. U dobropisů ověř znaménko částky, než je sečteš s fakturami.
- Schvalování závazku `schvalovani_prijeti_stav`: 0 bez schvalování, 1 ve schvalování, 2 schválený, 3 zamítnutý.
- Položky dokladu: `nazev`, `produkt`, `mnozstvi`, `mj`, `cena`, `castka` bez DPH, `dan`. V `receivable_items_query` je `celkem` součet řádku a `celkem_hlav` součet celého dokladu.

## Typické dotazy

- **Po splatnosti.** Pole pro to NBS nemá. Doklad je po splatnosti, když `splatnost` je před dneškem, `zustatek` je větší než 0 a `stav` je 1 nebo 2. Počet dní po splatnosti spočítej od `splatnost`.
- **Saldo partnera.** Sečti `zustatek_kc` otevřených pohledávek a zvlášť otevřených závazků partnera. Když má doklady ve více měnách, uveď i součty v původních měnách.
- **Zaplatil zákazník fakturu?** Rozhoduje `stav`, `zustatek` a `placeni` pohledávky. Bankovní transakci najdeš podle variabilního symbolu: `var` v transakci odpovídá `var_sym` dokladu.
- **Závazky ke schválení.** `dashboard_payables_approval` vrací `{ success, data: { payables: [...] } }` jen s doklady, které čekají na přihlášeného uživatele. Pole jsou anglicky: `document`, `document_supplier` (číslo od dodavatele), `partner_name`, `due_date`, `total`, `balance`, `currency` a hotový příznak `overdue`.

## Bankovní transakce

- `castka` má znaménko: kladná je příchozí platba, záporná odchozí. Dále `datum`, `mena`, protistrana `protiucet_nazev` a `protiucet`, symboly `var`, `konst`, `spec` a zprávy `zprava_odesilatele`, `zprava_pro_prijemce`.
- Uživatel může mít oprávnění jen k příchozím, nebo jen k odchozím platbám. Pak dostane jen ty. Když chybí jeden směr, upozorni na to a nevyvozuj, že platby neexistují.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- Částky v různých měnách nesčítej. Pro souhrn použij pole v Kč a řekni to.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Data piš jako 1. 4. 2026.
- Surový JSON do odpovědi nevkládej. Čísla účtů protistran uváděj, jen když se na ně uživatel ptá.
- Uveď, z jakých dokladů a období výsledek vychází, aby si ho uživatel mohl ověřit v NBS.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: zkus jiný postup z této příručky, ale stejný dotaz neopakuj dokola.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
