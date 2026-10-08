# Notia Business Server

Plugin propojí Claude s vaším Notia Business Serverem (NBS). V konverzaci se můžete ptát na tržby a prodeje, pohledávky a závazky, objednávky a zásilky, sklady, účetní výkazy, majetek, smlouvy nebo helpdesk a Claude odpověď sestaví z aktuálních dat vašeho NBS.

## Použití

1. Nainstalujte plugin a na jeho záložce **Konektory** připojte konektor **Notia Business Server**.
2. V okně, které se otevře, zadejte doménu své firmy (například `firma.cz`). Budete přesměrováni na přihlašovací stránku svého NBS Hubu, kde se přihlásíte jako obvykle.
3. Ptejte se běžnou řečí, například: „Jak si letos vedou tržby proti loňsku?“, „Které faktury jsou po splatnosti?“ nebo „Kolik kusů produktu X je volných na skladě?“

Plugin obsahuje skills, které Claude vedou při výběru nástrojů, dohledání partnerů a produktů a přehledné prezentaci výsledků:

| Skill | Oblast |
|---|---|
| `nbs-overview` | přehled, s čím plugin pomůže a na co se můžete ptát |
| `sales-analysis` | tržby, meziroční srovnání, prodeje podle obchodníků, zákazníků a produktů |
| `receivables-payables` | pohledávky, závazky, doklady po splatnosti, saldo partnera, bankovní platby |
| `orders-shipments` | prodejní objednávky, zásilky, e-shopy a prodejny |
| `inventory-purchasing` | sklady, zásoby, skladové doklady, produkty a nákupní objednávky |
| `accounting` | výsledovka, náklady a výnosy, aktiva a pasiva, účetní číselníky |
| `fixed-assets` | dlouhodobý majetek a odpisy |
| `companies-pricing` | firmy, skupiny, cenové kategorie, ceníky a odeslaná pošta |
| `contracts` | smlouvy, sazby, fakturační podklady a pracovníci |
| `helpdesk` | tikety, reakce, výkazy práce a zákaznický portál |

## Data a oprávnění

- Přístup je jen pro čtení. Plugin ani konektor v NBS nic nezakládají ani nemění.
- Vidíte jen data, ke kterým máte oprávnění ve svém uživatelském účtu NBS. Oprávnění ověřuje NBS při každém dotazu.
- Dotazy, které Claude sestaví (název nástroje, období a filtry), se posílají přes `mcp.notia.cz` do NBS Hubu vaší firmy. Výsledky dotazů se vracejí do konverzace v Claude.
- Heslo zadáváte jen na přihlašovací stránce svého NBS Hubu. Notia Business Server ani Claude ho nevidí, Claude dostane jen časově omezený přístupový token.
- Doménu firmy Notia Business Server použije jen k vyhledání adresy vašeho NBS Hubu v adresáři Notia.
- Samotný plugin neobsahuje žádné přihlašovací údaje ani klíče a sám nic neukládá.
- Přístup můžete kdykoli zrušit odpojením konektoru v Claude.
- Jak Notia zpracovává osobní údaje, popisují [zásady ochrany osobních údajů](https://notia.com/ochrana-soukromi/).

## English

Connects Claude to Notia Business Server (NBS), an ERP used by Czech companies. Ask about revenue and sales, receivables and payables, orders and shipments, inventory, financial statements, fixed assets, contracts or helpdesk tickets and Claude answers from your live NBS data. Access is read-only and always limited to the permissions of your own NBS account. You sign in on your company's own NBS Hub login page; your password is never sent to Notia Business Server or Claude. Queries (tool name, date range and filters) are sent through `mcp.notia.cz` to your company's NBS Hub, and the results are returned to your Claude conversation. The plugin contains no credentials and stores nothing itself.

Support: [helpdesk@notia.com](mailto:helpdesk@notia.com). Privacy policy: <https://notia.com/ochrana-soukromi/>.

## Podpora

- Podpora: [helpdesk@notia.com](mailto:helpdesk@notia.com)
- Zásady ochrany osobních údajů: <https://notia.com/ochrana-soukromi/>
- Web: <https://notia.cz>
