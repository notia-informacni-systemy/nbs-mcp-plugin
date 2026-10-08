#!/usr/bin/env node
/**
 * Vydá novou verzi pluginu: BRÁNA → BUMP → CHANGELOG → COMMIT → ANOTOVANÝ TAG. Nic nepushuje
 * (stejný postup jako scripts/release-version.sh v mcp-notia).
 *
 * - vydává se z čistého `main`, který odpovídá `origin/main`;
 * - brána je stejná validace, kterou pouští CI (scripts/validate.mjs);
 * - zvedne `version` v .claude-plugin/plugin.json;
 * - sekci „## [Nevydáno]“ v CHANGELOG.md přejmenuje na novou verzi s dnešním datem a nad ni
 *   založí prázdnou. Prázdnou sekci odmítne, každá verze musí mít popsané změny.
 *
 *   node scripts/release.mjs patch|minor|major
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(root, '.claude-plugin', 'plugin.json');
const CHANGELOG = join(root, 'CHANGELOG.md');
const UNRELEASED = '## [Nevydáno]';

const die = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const validate = () => {
  try {
    execFileSync(process.execPath, [join(root, 'scripts', 'validate.mjs')], { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
};

const bump = process.argv[2];
if (!['patch', 'minor', 'major'].includes(bump)) die('použití: node scripts/release.mjs patch|minor|major');

// Vydává se z main — tag na commitu jiné větve by označil obsah, který v main není.
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main') die(`vydává se z větve main, teď jsi na '${branch}'.`);
if (git('status', '--porcelain')) die('pracovní strom není čistý, nejdřív commitni (nebo odlož) změny.');
try {
  git('fetch', '--quiet', 'origin', 'main');
} catch {
  die('nepodařilo se načíst origin/main.');
}
if (git('rev-parse', 'HEAD') !== git('rev-parse', 'origin/main')) die('main se liší od origin/main, nejdřív git pull (nebo push).');

if (!validate()) die('validace neprošla, verze se nezvedla.');

const changelog = readFileSync(CHANGELOG, 'utf8');
const start = changelog.indexOf(`${UNRELEASED}\n`);
if (start === -1) die(`CHANGELOG.md nemá sekci „${UNRELEASED}“.`);
const bodyStart = start + UNRELEASED.length + 1;
const bodyEnd = changelog.indexOf('\n## ', bodyStart);
if (!changelog.slice(bodyStart, bodyEnd === -1 ? undefined : bodyEnd).trim()) {
  die(`sekce „${UNRELEASED}“ v CHANGELOG.md je prázdná, zapiš do ní, co se ve verzi mění.`);
}

const manifestText = readFileSync(MANIFEST, 'utf8');
const { version } = JSON.parse(manifestText);
const [major, minor, patch] = version.split('.').map(Number);
const next = bump === 'major' ? [major + 1, 0, 0] : bump === 'minor' ? [major, minor + 1, 0] : [major, minor, patch + 1];
const newVersion = next.join('.');
const tag = `v${newVersion}`;
if (git('tag', '--list', tag)) die(`tag ${tag} už existuje.`);

// Místní datum (sv-SE dává YYYY-MM-DD), ne UTC — po půlnoci by jinak verze dostala včerejší datum.
const date = new Date().toLocaleDateString('sv-SE');
writeFileSync(MANIFEST, manifestText.replace(`"version": "${version}"`, `"version": "${newVersion}"`));
writeFileSync(
  CHANGELOG,
  changelog.slice(0, bodyStart) + `\n## [${newVersion}] – ${date}\n` + changelog.slice(bodyStart),
);
if (JSON.parse(readFileSync(MANIFEST, 'utf8')).version !== newVersion || !validate()) {
  git('checkout', '--', MANIFEST, CHANGELOG);
  die('po zvednutí verze validace neprošla, změny jsem vrátil.');
}

git('commit', '--quiet', '--only', MANIFEST, CHANGELOG, '-m', `release: ${tag}`);
git('tag', '-a', tag, '-m', `release: ${tag}`);

console.log(`
→ vydáno ${tag} (commit + anotovaný tag, nic nepushnuto)
  Pushni commit i tag jedním příkazem (obyčejný git push tagy neposílá):
    git push origin main ${tag}
  Zip pro claude.ai z vydané verze:
    git archive --format=zip --prefix=notia-business-server/ ${tag} > notia-business-server-${newVersion}.zip`);
