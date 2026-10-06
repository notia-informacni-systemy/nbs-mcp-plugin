---
name: helpdesk
description: Helpdeskové tikety, reakce, výkazy práce a zákaznický portál z Notia Business Serveru (NBS). Použij, když se uživatel ptá na tikety nebo požadavky zákazníků, jejich stav, prioritu, řešitele a termíny, na své tikety k řešení nebo čekající na odpověď, na odpracované jednotky a výkazy práce, nebo na uživatele helpdeskového portálu, a je připojený konektor Notia Business Server.
---

# Helpdesk v NBS

## Společná pravidla

- Konektor čte data z NBS jen pro čtení a s oprávněními přihlášeného uživatele. Když nástroj odpoví „K těmto datům nemáte v NBS oprávnění“, řekni to uživateli a nezkoušej data získat jiným nástrojem.
- Když konektor některý nástroj nenabízí, firma ho nemá zpřístupněný. Řekni to a data neodhaduj.
- Seznamy (`*_query`) vrací `{ total, rows }`: `total` je počet všech záznamů, `rows` aktuální stránka, ve výchozím stavu 50 řádků. Víc řádků najednou dostaneš přes `limit` (nejvýš 200), další stránku přes `offset`. Když nástroj hlásí, že je výsledek příliš velký, sniž `limit` na polovinu.
- Data chodí jako čas v UTC: `2026-03-31T22:00:00.000Z` je 1. 4. 2026 v Česku. Před porovnáním s obdobím je převeď na český čas.

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
- Řešitele uváděj jménem, když ho dohledáš přes `contract_workers_query`, jinak kódem.
- Surový JSON do odpovědi nevkládej. Uveď, kolik záznamů z `total` jsi prošel.

## Chyby

- „Platnost přihlášení do NBS vypršela“: požádej uživatele, ať konektor Notia Business Server znovu připojí v nastavení konektorů.
- „Systém NBS je momentálně nedostupný“ nebo „NBS je momentálně přetížený“: řekni to uživateli a nabídni zopakování později. Data neodhaduj.
- „NBS API vrátilo chybu“: stejný dotaz neopakuj dokola. Řekni uživateli, co se nepodařilo.
- Chybové odpovědi obsahují „ID požadavku“. Při hlášení problému ho uživatel předá podpoře Notia.
