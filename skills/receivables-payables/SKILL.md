---
name: receivables-payables
description: Pohledávky, závazky a platby z Notia Business Serveru (NBS). Použij, když se uživatel ptá na vystavené nebo přijaté faktury, neuhrazené doklady a doklady po splatnosti, saldo partnera, kdo nám dluží nebo komu dlužíme, závazky čekající na schválení, bankovní transakce nebo to, jestli a kdy přišla platba, a je připojený konektor Notia Business Server.
---

# Pohledávky, závazky a platby v NBS

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
| Vystavené faktury (pohledávky) | `receivables_query`, detail `receivable_detail`, řádky `receivable_items_query` |
| Přijaté faktury (závazky) | `payables_query`, detail `payable_detail`, řádky `payable_items_query` |
| Doklady jednoho partnera | `companies_query` → pole `shortcut` → `receivables_query` / `payables_query` s `partner` = `shortcut` |
| Řádky napříč všemi doklady | `receivables_all_items_query`, `payables_all_items_query` |
| Závazky čekající na mé schválení | `dashboard_payables_approval` |
| Platby na bankovních účtech | `banking_transactions_query`, detail `banking_transaction_detail` |

## Hledání a období

- Pohledávky a závazky zúžíš parametry `partner` (zkratka partnera), `vystaveni_od` a `vystaveni_do` nebo `plneni_od` a `plneni_do` (DUZP). Data piš ve tvaru `YYYY-MM-DD`, obě hranice platí včetně. `total` je pak počet dokladů po zúžení.
- Zkratku partnera najdeš v poli `shortcut` z `companies_query` se `search` (hledá v názvu, zkratce, ulici, městě a e-mailu, ne v IČO). Když dohledání vrátí víc firem, zeptej se uživatele, kterou myslí.
- `partner` se porovnává přesně včetně velikosti písmen. Prázdný seznam u firmy, která doklady má, znamená špatnou zkratku, ne chybu.
- `company_receivables_query` a `company_payables_query` vrací totéž pro jednu firmu (zkratka v `partner`) a mají stejné parametry období.
- Seznamy jsou seřazené od naposledy zapsaných dokladů a řazení nejde změnit.
- `search` u bankovních transakcí nic nezúží, NBS ho ignoruje a vrátí celý seznam.

## Pole pohledávek a závazků

- Číslo dokladu: `dokl_cis` (řada `dokl_kod`, rok `dokl_rok`). Číslo faktury od dodavatele (`ev_cislo_dd`) je jen v `payable_detail`.
- Partner: `partner` (zkratka), `partner_nazev`.
- Data: `vystaveni`, `plneni` (DUZP), `splatnost`, `placeni` (datum úhrady, vyplněné až po zaplacení). `splatnost_dny` je lhůta splatnosti ve dnech, ne počet dní po splatnosti.
- Částky v měně dokladu: `castka` bez DPH, `dan`, `celkem` s DPH, `zustatek` zbývá uhradit. V Kč: `castka_kc`, `dan_kc`, `zustatek_kc`. Měna `mena`, kurz `kurs`.
- Stav pohledávky `stav`: 0 Nová, 1 Vystavená, 2 Částečně uhrazená, 3 Uhrazená, -1 Stornovaná, -2 Neřeší se. U závazku stejně, jen 1 je Přijatý.
- Typ pohledávky `dokl_typ`: 10 faktura (daňový doklad), 11 dobropis, 12 a 13 zálohová faktura. Dobropisy mají `castka_kc` záporné, takže se při sečtení s fakturami samy odečtou. Kladný dobropis je chyba v datech, uživatele na něj upozorni.
- Schvalování závazku `schvalovani_prijeti_stav`: 0 bez schvalování, 1 ve schvalování, 2 schválený, 3 zamítnutý.
- Položky dokladu: `nazev`, `produkt`, `mnozstvi`, `mj`, `cena`, `castka` bez DPH, `dan`. V `receivable_items_query` je `celkem` součet řádku a `celkem_hlav` součet celého dokladu.

## Typické dotazy

- **Po splatnosti.** Pole pro to NBS nemá. Doklad je po splatnosti, když `splatnost` je před dneškem, `zustatek` je větší než 0 a `stav` je 1 nebo 2. Počet dní po splatnosti spočítej od `splatnost`.
- **Saldo partnera.** Sečti `zustatek_kc` otevřených pohledávek a zvlášť otevřených závazků partnera (`receivables_query` a `payables_query` s `partner`). Když má doklady ve více měnách, uveď i součty v původních měnách.
- **Zaplatil zákazník fakturu?** Rozhoduje `stav`, `zustatek` a `placeni` pohledávky. Bankovní transakci najdeš podle variabilního symbolu: `var` v transakci odpovídá `var_sym` dokladu.
- **Závazky ke schválení.** `dashboard_payables_approval` vrací `{ success, data: { payables: [...] } }` jen s doklady, které čekají na přihlášeného uživatele. Pole jsou anglicky: `document`, `document_supplier` (číslo od dodavatele), `partner_name`, `due_date`, `total`, `balance`, `currency` a hotový příznak `overdue`.

## Bankovní transakce

- `castka` má znaménko: kladná je příchozí platba, záporná odchozí. Dále `datum`, `mena`, protistrana `protiucet_nazev` a `protiucet`, symboly `var`, `konst`, `spec` a zprávy `zprava_odesilatele`, `zprava_pro_prijemce`.
- Uživatel může mít oprávnění jen k příchozím, nebo jen k odchozím platbám. Pak dostane jen ty. Když chybí jeden směr, upozorni na to a nevyvozuj, že platby neexistují.
- Čísla účtů protistran uváděj, jen když se na ně uživatel ptá.

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
