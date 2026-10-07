---
name: helpdesk
description: Helpdeskové tikety, reakce, výkazy práce a zákaznický portál z Notia Business Serveru (NBS). Použij, když se uživatel ptá na tikety nebo požadavky zákazníků, jejich stav, prioritu, řešitele a termíny, na své tikety k řešení nebo čekající na odpověď, na odpracované jednotky a výkazy práce, nebo na uživatele helpdeskového portálu, a je připojený konektor Notia Business Server.
---

# Helpdesk v NBS

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
| Moje tikety | `dashboard_tickets_query` s `type` |
| Všechny tikety, hledání podle předmětu | `helpdesk_tickets_query` |
| Detail tiketu | `helpdesk_ticket_detail` |
| Poslední reakce na tiket | `helpdesk_solution_detail` s `id_reseni` z tiketu |
| Výkazy práce | `helpdesk_worklogs_query` |
| Uživatelé zákaznického portálu | `helpdesk_portal_users_query` |
| Jméno pracovníka podle kódu | `contract_workers_query` |

## Moje tikety

- `dashboard_tickets_query` filtruje podle přihlášeného uživatele:
  - `to_solve`: tikety, které řeším já, ve stavu nový nebo v řešení;
  - `assigned`: tikety, které jsem zadal jiným řešitelům;
  - `waiting`: tikety, které řeším já a čekají na odpověď.
- `helpdesk_dashboard_tickets_query` parametr `type` nepoužívá a vrací všechny tikety. Pro otázky „moje tikety“ ho nepoužívej.

## Tikety

- `search` u `helpdesk_tickets_query` hledá v čísle tiketu, předmětu a oblasti problému, ne v partnerovi ani smlouvě. Seznam je seřazený od nejnovějších. Tikety partnera nebo smlouvy vyber podle polí `partner` a `zakazka`.
- Pole: `id`, `predmet`, `partner`, smlouva `zakazka`, oblast `problem_oblast`, `zapsano`, zadavatel `zadavatel`, řešitel `resitel` (kód pracovníka), termín `termin_datum`, poslední reakce `reseni_datum`, odpracované jednotky `pocet_jednotek`, `fakturovat`.
- Priorita `priorita`: 0 Normální, 1 Zvýšená, 2 Vysoká.
- Otevřené tikety mají `aktivni` 1. Stav `stav`: 1 nový, 2 v řešení, 3 čeká na odpověď, 4 vyřešený, -1 zrušený. Další hodnoty (například odložený) označ jako „jiný stav“. V detailu tiketu je `stav` už text a číslo je v `stav_cislo`.
- Po termínu je otevřený tiket, jehož `termin_datum` je před dneškem.
- Řešitele uváděj jménem, když ho dohledáš přes `contract_workers_query`, jinak kódem.

## Detail tiketu a reakce

- `popis` a `reseni_popis` jsou HTML. Shrň je vlastními slovy, HTML nevypisuj.
- `zadani_poznamka_interni`, `reseni_poznamka_interni` a `poznamka_interni` jsou interní poznámky. Když je uvádíš, označ je jako interní, aby je uživatel neposlal zákazníkovi.
- `zadavatel_foto` a `resitel_foto` jsou fotky. Nikdy je nevypisuj. Kontaktní osobu (`kontaktni_osoba*`) uváděj, jen když se na ni uživatel ptá.
- Navázaná objednávka je v `objednavka`, faktury v `pohledavky`.

## Výkazy práce

- `helpdesk_worklogs_query` nemá hledání a je seřazený od nejnovějších. Pro období procházej stránky a skonči, když jsou na celé stránce jen starší záznamy.
- Pole: pracovník `kod_pracovnika`, `datum`, začátek `od` a konec `do`, `partner`, smlouva `kod_zakazky`, tiket `id_problemu`, jednotky `pocet_jednotek`, fakturovatelné `k_fakturaci`, `predmet`.
- Dobu práce počítej z `od` a `do`. Pole `cas` nepoužívej.

## Portál

- `helpdesk_portal_users_query`: stav `hd_stav` (NONE, INVITED, ACTIVE, BLOCKED), firma `firma`, `dat_aktivace`.
- Jména a e-maily jsou osobní údaje. Odpovídej počty a stavy, konkrétní osoby uváděj jen na přímý dotaz.

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
