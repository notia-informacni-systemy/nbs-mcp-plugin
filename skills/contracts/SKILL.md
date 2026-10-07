---
name: contracts
description: Smlouvy se zákazníky, jejich sazby a předplacený kredit, SLA lhůty, fakturační podklady a pracovníci z Notia Business Serveru (NBS). Použij, když se uživatel ptá na smlouvy nebo servisní zakázky, jejich stav a platnost, co a za kolik se zákazníkovi účtuje, co je připravené k vyfakturování nebo kdo na smlouvách pracuje, a je připojený konektor Notia Business Server.
---

# Smlouvy a fakturační podklady v NBS

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
| Seznam smluv | `contracts_query` |
| Detail smlouvy, SLA lhůty | `contract_detail` s `code` |
| Sazby a kredit smlouvy | `contract_charges_query` s `code` |
| Fakturační podklady | `invoicing_requests_query`, detail `invoicing_request_detail` |
| Pracovníci | `contract_workers_query` |

## Smlouvy

- Smlouvy jsou něco jiného než účetní zakázky z `orders_codebook_query`. Když uživatel řekne „zakázka“, z kontextu odhadni, kterou myslí, a když to nejde, zeptej se.
- `search` u `contracts_query` nic nezúží. Seznam je seřazený podle kódu smlouvy. Smlouvy partnera najdeš podle pole `partner` (zkratka z `companies_query`).
- Pole: kód `zakazka` (je to `code` pro další nástroje), `nazev`, `partner`, `partner_nazev`, platnost `datum_od` a `datum_do`, `obchodnik`, výchozí smlouva partnera `vychozi`.
- Stav `stav`: 0 Nová, 1 Rozpracovaná (aktivní), 2 Uzavřená.
- `contract_detail` přidává reakční lhůty podle priority `lhuta_normalni`, `lhuta_zvysena`, `lhuta_vysoka`, limit jednotek na tiket `limit_pro_ticket` a výchozí sazbu `vychozi_sazba`.
- `manazer` a `vedouci` jsou interní čísla uživatelů. Jména k nim konektor nevrací, proto je neuváděj jako jména.
- Kontaktní osoby (`partner_osoba_jmeno`) uváděj, jen když se na ně uživatel ptá.

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
