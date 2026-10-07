#!/usr/bin/env node
/**
 * Zapíše společné sekce ze shared/*.md do všech skills/*\/SKILL.md.
 *
 * Každý soubor v shared/ je jedna celá sekce včetně nadpisu (`## Chyby`). Ve SKILL.md
 * se nahradí sekce se stejným nadpisem až po další nadpis `## ` nebo konec souboru.
 * Společné sekce se upravují jen v shared/, ruční úpravu ve skillu skript přepíše.
 * Skript je idempotentní, pustit se dá kdykoli a odkudkoli:
 *
 *   node scripts/sync-shared.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedDir = join(root, 'shared');
const skillsDir = join(root, 'skills');

const shared = readdirSync(sharedDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const body = readFileSync(join(sharedDir, file), 'utf8').trimEnd();
    const heading = body.split('\n', 1)[0];
    if (!heading.startsWith('## ')) {
      console.error(`✖ shared/${file}: první řádek musí být nadpis „## …“`);
      process.exit(1);
    }
    return { file, heading, body };
  });

let errors = 0;
let changed = 0;
for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
  const file = join(skillsDir, entry.name, 'SKILL.md');
  if (!entry.isDirectory() || !existsSync(file)) continue;
  const before = readFileSync(file, 'utf8');
  // Sekce začíná nadpisem `## ` na začátku řádku, `### ` je její podsekce.
  const parts = before.split(/^(?=## )/m);
  for (const { file: source, heading, body } of shared) {
    const index = parts.findIndex((part) => part.startsWith(`${heading}\n`));
    if (index === -1) {
      console.error(`✖ skills/${entry.name}: chybí sekce „${heading.slice(3)}“ (shared/${source})`);
      errors++;
      continue;
    }
    parts[index] = index === parts.length - 1 ? `${body}\n` : `${body}\n\n`;
  }
  const after = parts.join('');
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`✔ skills/${entry.name} aktualizován`);
    changed++;
  }
}

if (errors) process.exit(1);
if (!changed) console.log('✔ Všechny skills odpovídají shared/.');
