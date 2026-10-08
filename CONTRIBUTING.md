# Vývoj pluginu

Návod pro úpravy skills, kontroly a vydání nové verze. Co plugin dělá pro uživatele, popisuje [README](README.md).

## Struktura repa

| Cesta | Obsah |
|---|---|
| `.claude-plugin/plugin.json` | manifest pluginu, včetně `version` |
| `.mcp.json` | odkaz na konektor `https://mcp.notia.cz/mcp` |
| `skills/*/SKILL.md` | skills pro jednotlivé oblasti NBS, `nbs-overview` je rozcestník |
| `shared/*.md` | společné sekce všech skills (Společná pravidla, Prezentace, Chyby) |
| `scripts/` | generátor společných sekcí, validace a vydání verze |
| `CHANGELOG.md` | změny po verzích, včetně požadované verze bridge |
| `package.json` | jen `npm run` skripty (`sync`, `validate`, `release:*`), bez závislostí a bez verze |

Skripty nemají závislosti, `npm install` není potřeba. Fungují i přes `pnpm run`.

`shared/`, `scripts/`, `.github/`, `package.json` a tento soubor se do zipu pro claude.ai nedostanou (`.gitattributes`).

## Úpravy skills

- Názvy nástrojů a jejich parametry musí odpovídat katalogu bridge v monorepu `notia` (`apps/nbs-mcp-bridge/api/src/tools/mappings/`). Když bridge nástroj přidá, přejmenuje nebo změní parametry, upravte i skill.
- Společné sekce se ve skills needitují. Upravte soubor v `shared/` a spusťte `npm run sync`, který je zapíše do všech skills. Ruční úpravu společné sekce ve skillu generátor přepíše.
- Nový skill přidejte i do tabulky „Oblasti“ v `skills/nbs-overview/SKILL.md` a do tabulky skills v README.
- Každou změnu zapište do sekce `## [Nevydáno]` v `CHANGELOG.md`. Když skill nově používá parametr, který starší bridge nemá, uveďte to tam.

## Kontroly

```bash
npm run validate                    # totéž pouští CI u každého pushe a pull requestu
claude plugin validate .
claude --plugin-dir .               # test v Claude Code
```

Validace kontroluje manifest, `.mcp.json`, frontmatter skills, shodu společných sekcí se `shared/`, rozcestník, tabulku skills v README a záznam v CHANGELOG pro aktuální verzi.

## Vydání verze

1. Sekce `## [Nevydáno]` v `CHANGELOG.md` musí popisovat změny verze, prázdnou skript odmítne.
2. Vydává se z aktuálního `main` s čistým pracovním stromem:
   ```bash
   git checkout main && git pull
   npm run release:patch               # nebo release:minor / release:major
   ```
   Skript pustí validaci, zvedne `version` v `plugin.json`, přejmenuje „Nevydáno“ na novou verzi s dnešním datem, vytvoří commit `release: vX.Y.Z` a anotovaný tag. Nic nepushuje.
3. Commit i tag pushněte jedním příkazem, obyčejný `git push` tagy neposílá:
   ```bash
   git push origin main vX.Y.Z
   ```
4. Zip pro [developer portál](https://claude.ai/directory/manage) vytvořte z tagu:
   ```bash
   git archive --format=zip --prefix=notia-business-server/ vX.Y.Z > notia-business-server-X.Y.Z.zip
   ```

Kterou část verze zvednout:

- **patch**: opravy a zpřesnění textů skills,
- **minor**: nové schopnosti, například nový skill nebo využití nových nástrojů a parametrů, které už nasazený bridge má,
- **major**: plugin potřebuje novější bridge a se starším nefunguje.

Verzi, která potřebuje nový bridge, vydávejte až po jeho nasazení na instance zákazníků.
