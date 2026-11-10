#!/usr/bin/env node
/**
 * Regenerate server/prisma/schema.production.prisma from the canonical
 * server/prisma/schema.prisma by swapping only the datasource provider.
 *
 * Canonical source of truth: schema.prisma (SQLite for local generate/push).
 * Production derivative: schema.production.prisma (PostgreSQL provider).
 *
 * Do not hand-edit schema.production.prisma — run:
 *   pnpm db:sync-production-schema
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const canonicalPath = resolve(root, 'server/prisma/schema.prisma');
const productionPath = resolve(root, 'server/prisma/schema.production.prisma');

const canonical = readFileSync(canonicalPath, 'utf8');

if (!/provider\s*=\s*"sqlite"/.test(canonical)) {
  console.error('❌ Canonical schema.prisma must use provider = "sqlite".');
  process.exit(1);
}

const header = `// AUTO-GENERATED from schema.prisma — do not edit by hand.
// Regenerate with: pnpm db:sync-production-schema
// Canonical source of truth: server/prisma/schema.prisma
// This file differs only by datasource provider = "postgresql".

`;

let production = canonical
  // Strip the human canonical banner; replace with generated header below.
  .replace(/^\/\/ Ayeh Media Plus[\s\S]*?(?=datasource db)/, '')
  .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (!/provider\s*=\s*"postgresql"/.test(production)) {
  console.error('❌ Failed to rewrite datasource provider to postgresql.');
  process.exit(1);
}

writeFileSync(productionPath, header + production.trimStart(), 'utf8');
console.log('✅ Wrote', productionPath);
console.log('   provider: postgresql (models synced from schema.prisma)');
