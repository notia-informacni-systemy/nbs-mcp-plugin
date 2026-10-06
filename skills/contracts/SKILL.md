---
name: contracts
description: Smlouvy se zákazníky, jejich sazby a předplacený kredit, SLA lhůty, fakturační podklady a pracovníci z Notia Business Serveru (NBS). Použij, když se uživatel ptá na smlouvy nebo servisní zakázky, jejich stav a platnost, co a za kolik se zákazníkovi účtuje, co je připravené k vyfakturování nebo kdo na smlouvách pracuje, a je připojený konektor Notia Business Server.
---

# Smlouvy a fakturační podklady v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.
- Smlouvy jsou něco jiného než účetní zakázky z `orders_codebook_query`. Když uživatel řekne „zakázka“, z kontextu odhadni, kterou myslí, a když to nejde, zeptej se.

## Který nástroj kdy

| Otázka | Nástroj |
|---|---|
| Seznam smluv | `contracts_query` |
| Detail smlouvy, SLA lhůty | `contract_detail` s `code` |
| Sazby a kredit smlouvy | `contract_charges_query` s `code` |
| Fakturační podklady | `invoicing_requests_query`, detail `invoicing_request_detail` |
| Pracovníci | `contract_workers_query` |

## Smlouvy

- `search` u `contracts_query` nic nezúží. Seznam je seřazený podle kódu smlouvy. Smlouvy partnera najdeš podle pole `partner` (zkratka z `companies_query`).
- Pole: kód `zakazka` (je to `code` pro další nástroje), `nazev`, `partner`, `partner_nazev`, platnost `datum_od` a `datum_do`, `obchodnik`, výchozí smlouva partnera `vychozi`.
- Stav `stav`: 0 Nová, 1 Rozpracovaná (aktivní), 2 Uzavřená.
- `contract_detail` přidává reakční lhůty podle priority `lhuta_normalni`, `lhuta_zvysena`, `lhuta_vysoka`, limit jednotek na tiket `limit_pro_ticket` a výchozí sazbu `vychozi_sazba`.
- `manazer` a `vedouci` jsou interní čísla uživatelů. Jména k nim konektor nevrací, proto je neuváděj jako jména.

## Sazby smlouvy

- `contract_charges_query`: `produkt` a `produkt_nazev`, `mnozstvi`, `mj`, cena za jednotku `cena`, výchozí sazba `vychozi`.
- Předplacený kredit: `kredit` (jednotky) a `cena_kredit`.
- Typ `typ`: 1 služba, 2 kilometrovné. `search` hledá jen v kódu produktu.

## Fakturační podklady

- `search` u `invoicing_requests_query` hledá v názvu podkladu. Seznam je seřazený od nejnovějších.
- Pole: `nazev`, `partner`, smlouva `zakazka`, období `mesic` a `rok`, pracovník `hd_pracovnik`, jednotky `pocet_jednotek` a fakturovatelné `pocet_jednotek_fakt`, vystavená faktura `doklad` a `id_pohl` (pro `receivable_detail`).
- Stav `stav`: 0 Rozpracovaný, 1 Dokončený, 2 Schválený, 3 Vyfakturovaný, 4 Uzavřený. K vyfakturování čekají podklady ve stavu 1 a 2.
- `invoicing_request_detail` přidává součty: výkazy `vykazy_pocet_jednotek` a `vykazy_pocet_jednotek_fakt`, čerpaný kredit `kredit_pocet_jednotek` a `kredit_castka`, částka k fakturaci po odečtení kreditu `polozky_castka_celkem`.

## Pracovníci

- `contract_workers_query` se `search` hledá podle jména. Pole: `kod`, `name`, `prijmeni`, `aktivni`, řešitel helpdesku `helpdesk_resitel`.
- `kod` pracovníka najdeš v tiketech (`resitel`, `zadavatel_kod`), výkazech práce (`kod_pracovnika`) a podkladech (`hd_pracovnik`).
- Pole `avatar` je fotka. Nikdy ji nevypisuj.

## Prezentace

- Začni dvěma až třemi větami s hlavním zjištěním, potom ukaž tabulku. Delší seznamy zkrať na nejvýznamnějších zhruba 15 řádků a zbytek sečti jako „ostatní“.
- Kontaktní osoby (`partner_osoba_jmeno`) uváděj, jen když se na ně uživatel ptá.
- Částky piš česky: mezera jako oddělovač tisíců, desetinná čárka, měna za číslem. Surový JSON do odpovědi nevkládej.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj dokola. Řekni uživateli, co se nepodařilo.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
