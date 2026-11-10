#!/usr/bin/env node
/**
 * Detect unintended drift between the canonical SQLite schema and the
 * PostgreSQL production derivative.
 *
 * Allowed differences:
 *   - datasource provider (sqlite vs postgresql)
 *   - file header comments
 *
 * Everything else (models, fields, relations, enums, indexes, uniques)
 * must match.
 *
 * Exit 0 on parity; non-zero on drift.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const canonicalPath = resolve(root, 'server/prisma/schema.prisma');
const productionPath = resolve(root, 'server/prisma/schema.production.prisma');

function fail(msg) {
  console.error('❌', msg);
  process.exitCode = 1;
}

function parseSchema(text, label) {
  const enums = {};
  for (const m of text.matchAll(/^enum\s+(\w+)\s*\{([^}]*)\}/gm)) {
    enums[m[1]] = m[2]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'));
  }

  const models = {};
  for (const m of text.matchAll(/^model\s+(\w+)\s*\{/gm)) {
    const name = m[1];
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < text.length && depth) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') depth -= 1;
      i += 1;
    }
    const body = text.slice(start, i - 1);
    const fields = {};
    const relations = {};
    const indexes = [];
    const uniques = [];
    const ids = [];
    const scalarTypes = new Set([
      'String',
      'Int',
      'Boolean',
      'DateTime',
      'Float',
      'BigInt',
      'Decimal',
      'Json',
      'Bytes',
    ]);

    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//') || line.startsWith('///')) continue;
      const code = line.replace(/\s*\/\/.*$/, '').trim();
      if (!code) continue;
      if (code.startsWith('@@index')) indexes.push(code);
      else if (code.startsWith('@@unique')) uniques.push(code);
      else if (code.startsWith('@@id')) ids.push(code);
      else if (code.startsWith('@@')) indexes.push(code);
      else {
        const parts = code.split(/\s+/);
        const fname = parts[0];
        const ftype = parts[1] || '';
        const rest = parts.slice(1).join(' ');
        const base = ftype.replace(/\?$/, '').replace(/\[\]$/, '');
        if (!scalarTypes.has(base)) relations[fname] = rest;
        else fields[fname] = rest;
      }
    }
    models[name] = { fields, relations, indexes: indexes.sort(), uniques: uniques.sort(), ids: ids.sort() };
  }

  const ds = text.match(/datasource\s+\w+\s*\{([^}]*)\}/s);
  const provider = ds?.[1]?.match(/provider\s*=\s*"([^"]+)"/)?.[1] || null;
  return { label, provider, models, enums };
}

function diffSets(a, b) {
  return {
    onlyA: [...a].filter((x) => !b.has(x)).sort(),
    onlyB: [...b].filter((x) => !a.has(x)).sort(),
  };
}

if (!existsSync(canonicalPath) || !existsSync(productionPath)) {
  fail('Both schema.prisma and schema.production.prisma must exist.');
  process.exit(1);
}

const canonical = parseSchema(readFileSync(canonicalPath, 'utf8'), 'schema.prisma');
const production = parseSchema(readFileSync(productionPath, 'utf8'), 'schema.production.prisma');

console.log('🔎 Prisma schema parity check');
console.log(`   canonical:  ${canonical.provider} (${Object.keys(canonical.models).length} models)`);
console.log(`   production: ${production.provider} (${Object.keys(production.models).length} models)`);

if (canonical.provider !== 'sqlite') fail(`canonical provider must be sqlite (got ${canonical.provider})`);
if (production.provider !== 'postgresql') fail(`production provider must be postgresql (got ${production.provider})`);

const modelDiff = diffSets(new Set(Object.keys(canonical.models)), new Set(Object.keys(production.models)));
if (modelDiff.onlyA.length) fail(`models only in SQLite: ${modelDiff.onlyA.join(', ')}`);
if (modelDiff.onlyB.length) fail(`models only in PostgreSQL: ${modelDiff.onlyB.join(', ')}`);

const enumDiff = diffSets(new Set(Object.keys(canonical.enums)), new Set(Object.keys(production.enums)));
if (enumDiff.onlyA.length) fail(`enums only in SQLite: ${enumDiff.onlyA.join(', ')}`);
if (enumDiff.onlyB.length) fail(`enums only in PostgreSQL: ${enumDiff.onlyB.join(', ')}`);

for (const name of Object.keys(canonical.enums)) {
  const a = canonical.enums[name] || [];
  const b = production.enums[name] || [];
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(`enum ${name} values differ`);
  }
}

for (const name of Object.keys(canonical.models)) {
  const a = canonical.models[name];
  const b = production.models[name];
  if (!b) continue;

  const fieldDiff = diffSets(new Set(Object.keys(a.fields)), new Set(Object.keys(b.fields)));
  if (fieldDiff.onlyA.length) fail(`${name}: scalar fields only in SQLite: ${fieldDiff.onlyA.join(', ')}`);
  if (fieldDiff.onlyB.length) fail(`${name}: scalar fields only in PostgreSQL: ${fieldDiff.onlyB.join(', ')}`);

  for (const f of Object.keys(a.fields)) {
    if (b.fields[f] !== undefined && a.fields[f] !== b.fields[f]) {
      fail(`${name}.${f} type/attrs differ\n     sqlite: ${a.fields[f]}\n     prod:   ${b.fields[f]}`);
    }
  }

  const relDiff = diffSets(new Set(Object.keys(a.relations)), new Set(Object.keys(b.relations)));
  if (relDiff.onlyA.length) fail(`${name}: relations only in SQLite: ${relDiff.onlyA.join(', ')}`);
  if (relDiff.onlyB.length) fail(`${name}: relations only in PostgreSQL: ${relDiff.onlyB.join(', ')}`);

  for (const r of Object.keys(a.relations)) {
    if (b.relations[r] !== undefined && a.relations[r] !== b.relations[r]) {
      fail(`${name}.${r} relation differs\n     sqlite: ${a.relations[r]}\n     prod:   ${b.relations[r]}`);
    }
  }

  if (JSON.stringify(a.indexes) !== JSON.stringify(b.indexes)) {
    fail(`${name}: indexes differ\n     sqlite: ${a.indexes.join(' | ') || '(none)'}\n     prod:   ${b.indexes.join(' | ') || '(none)'}`);
  }
  if (JSON.stringify(a.uniques) !== JSON.stringify(b.uniques)) {
    fail(`${name}: unique constraints differ\n     sqlite: ${a.uniques.join(' | ') || '(none)'}\n     prod:   ${b.uniques.join(' | ') || '(none)'}`);
  }
  if (JSON.stringify(a.ids) !== JSON.stringify(b.ids)) {
    fail(`${name}: @@id differs`);
  }
}

if (process.exitCode) {
  console.error('\nParity check FAILED. Fix schema.prisma then run: pnpm db:sync-production-schema');
  process.exit(process.exitCode);
}

console.log('✅ Schemas are in parity (provider-only difference allowed).');
