#!/usr/bin/env node
/**
 * Kontrola pluginu před `claude plugin validate` a odesláním do developer portálu:
 * manifest, .mcp.json bez secrets, skills (frontmatter, shoda společných sekcí se shared/,
 * rozcestník), README (seznam skills), CHANGELOG (záznam pro aktuální verzi), licence.
 * Pouští ji CI (.github/workflows/validate.yml) a dá se pustit odkudkoli:
 *
 *   npm run validate   (nebo node scripts/validate.mjs)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const ok = (message) => console.log(`✔ ${message}`);
const fail = (message) => errors.push(message);
const readText = (file) => (existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '');
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(join(root, file), 'utf8'));
  } catch (err) {
    fail(`${file}: ${err.message}`);
    return undefined;
  }
};
// Sekce markdownu podle nadpisu `## `; `### ` je podsekce.
const sections = (text) =>
  Object.fromEntries(
    text
      .split(/^(?=## )/m)
      .filter((part) => part.startsWith('## '))
      .map((part) => [part.slice(3, part.indexOf('\n')).trim(), part.trimEnd()]),
  );
// Názvy skills ze sloupce tabulky markdownu (`column` = pořadí sloupce od 0).
const tableSkills = (text, column) =>
  new Set(
    text
      .split('\n')
      .map((line) => line.split('|').slice(1, -1)[column]?.trim())
      .map((cell) => /^`([a-z0-9-]+)`$/.exec(cell ?? '')?.[1])
      .filter(Boolean),
  );
const sameSet = (label, listed, actual) => {
  for (const name of actual) if (!listed.has(name)) fail(`${label} neuvádí skill ${name}`);
  for (const name of listed) if (!actual.includes(name)) fail(`${label} uvádí neexistující skill ${name}`);
};

// manifest
const manifest = readJson('.claude-plugin/plugin.json');
if (manifest) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name ?? '')) fail('plugin.json: name musí být kebab-case');
  if (!/^\d+\.\d+\.\d+/.test(manifest.version ?? '')) fail('plugin.json: version musí být semver');
  if (!manifest.description?.trim()) fail('plugin.json: chybí description');
  if (!manifest.author?.name) fail('plugin.json: chybí author.name');
  ok(`manifest ${manifest.name}@${manifest.version}`);
}
const extra = readdirSync(join(root, '.claude-plugin')).filter((f) => f !== 'plugin.json');
if (extra.length) fail(`.claude-plugin/ smí obsahovat jen plugin.json (navíc: ${extra.join(', ')})`);
if (existsSync(join(root, 'bin'))) fail('top-level bin/ zablokuje instalaci na claude.ai a v Cowork');

// MCP konektor
const SECRET_KEYS = /^(headers|env|token|api[-_]?key|secret|password|authorization)$/i;
const mcp = existsSync(join(root, '.mcp.json')) ? readJson('.mcp.json') : undefined;
for (const [name, server] of Object.entries(mcp?.mcpServers ?? {})) {
  if (server.type !== 'http') fail(`.mcp.json ${name}: očekává se vzdálený server "type": "http"`);
  let url;
  try {
    url = new URL(server.url);
  } catch {
    fail(`.mcp.json ${name}: neplatná url`);
    continue;
  }
  if (url.protocol !== 'https:') fail(`.mcp.json ${name}: url musí být HTTPS`);
  if (url.search || url.username || url.password) fail(`.mcp.json ${name}: url nesmí obsahovat query ani credentials`);
  const secrets = Object.keys(server).filter((key) => SECRET_KEYS.test(key));
  if (secrets.length) fail(`.mcp.json ${name}: nesmí obsahovat secrets (${secrets.join(', ')})`);
  ok(`konektor ${name} → ${url.href}`);
}

// skills
// Společné sekce se píšou jen do shared/*.md (jeden soubor = jedna sekce včetně nadpisu)
// a do skills je kopíruje scripts/sync-shared.mjs.
const shared = [];
for (const file of existsSync(join(root, 'shared')) ? readdirSync(join(root, 'shared')) : []) {
  if (!file.endsWith('.md')) continue;
  const body = readText(join('shared', file)).trimEnd();
  if (!body.startsWith('## ')) fail(`shared/${file}: musí začínat nadpisem „## …“`);
  else shared.push({ file, body, heading: body.split('\n', 1)[0].slice(3).trim() });
}
const skillsDir = join(root, 'skills');
const skills = (existsSync(skillsDir) ? readdirSync(skillsDir, { withFileTypes: true }) : [])
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const dir of skills) {
  const file = join('skills', dir, 'SKILL.md');
  const content = readText(file);
  if (!content) {
    fail(`skills/${dir}: chybí SKILL.md`);
    continue;
  }
  const parts = sections(content);
  for (const { file: source, heading, body } of shared) {
    if (!parts[heading]) fail(`skills/${dir}: chybí sekce „${heading}“ ze shared/${source}`);
    else if (parts[heading] !== body) {
      fail(`skills/${dir}: sekce „${heading}“ neodpovídá shared/${source} (spusťte npm run sync)`);
    }
  }
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(content)?.[1] ?? '';
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1].trim();
  if (field('name') !== dir) fail(`skills/${dir}: name ve frontmatter musí být "${dir}"`);
  const description = field('description') ?? '';
  if (!description) fail(`skills/${dir}: chybí description`);
  if (description.length > 1024) fail(`skills/${dir}: description je delší než 1024 znaků`);
  ok(`skill ${dir}`);
}

// Rozcestník musí v tabulce „Oblasti“ (sloupec Skill) uvádět přesně všechny ostatní skills.
const OVERVIEW = 'nbs-overview';
if (skills.includes(OVERVIEW)) {
  const listed = tableSkills(sections(readText(join('skills', OVERVIEW, 'SKILL.md')))['Oblasti'] ?? '', 1);
  sameSet(`skills/${OVERVIEW}: tabulka „Oblasti“`, listed, skills.filter((dir) => dir !== OVERVIEW));
  ok(`rozcestník ${OVERVIEW}: ${listed.size} oblastí`);
}

// README: text pro adresář pluginů a tabulka všech skills (první sloupec).
const readme = readText('README.md');
const words = readme.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
if (words < 40) fail(`README.md musí mít alespoň 40 slov mimo bloky kódu (má ${words})`);
else ok(`README.md (${words} slov)`);
const readmeSkills = tableSkills(readme, 0);
sameSet('README.md: tabulka skills', readmeSkills, skills);
ok(`README.md uvádí ${readmeSkills.size} skills`);

// CHANGELOG: každá verze z plugin.json musí mít záznam.
const changelog = readText('CHANGELOG.md');
if (!changelog) fail('chybí CHANGELOG.md');
else if (manifest?.version && !changelog.includes(`## [${manifest.version}]`)) {
  fail(`CHANGELOG.md: chybí záznam „## [${manifest.version}]“ pro verzi z plugin.json`);
} else ok(`CHANGELOG.md má záznam pro ${manifest?.version}`);

if (!existsSync(join(root, 'LICENSE')) && !manifest?.license) fail('chybí LICENSE nebo license v plugin.json');
else ok('licence');

if (errors.length) {
  for (const error of errors) console.error(`✖ ${error}`);
  process.exit(1);
}
console.log('✔ Validace prošla — před odesláním spusťte ještě `claude plugin validate`.');
