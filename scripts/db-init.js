#!/usr/bin/env node
/**
 * Ayeh Media Plus — Database Initialization Script
 *
 * Supports both SQLite (development) and PostgreSQL (production).
 * Usage:
 *   pnpm db:init          # Detects DATABASE_PROVIDER from .env
 *   DATABASE_PROVIDER=postgresql pnpm db:init
 *   DATABASE_PROVIDER=sqlite pnpm db:init
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually since this script may run outside pnpm dev
import dotenv from 'dotenv';

const ENV_PATH = resolve(process.cwd(), '.env');
const ENV_PROD_PATH = resolve(process.cwd(), '.env.production');

// Load .env first
dotenv.config({ path: ENV_PATH });

// Only load .env.production in production mode (not in development)
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: ENV_PROD_PATH, override: true });
}

const PROVIDER = process.env.DATABASE_PROVIDER || 'sqlite';
const IS_POSTGRES = PROVIDER === 'postgresql';

if (!process.env.DATABASE_URL) {
  console.error(
    '❌ DATABASE_URL environment variable is not set.\n' +
    '   Set DATABASE_URL in .env (or .env.production for production).'
  );
  process.exit(1);
}

if (IS_POSTGRES && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error(
    '❌ DATABASE_PROVIDER=postgresql but DATABASE_URL does not look like a PostgreSQL connection string.\n' +
    `   Current: ${process.env.DATABASE_URL}`
  );
  process.exit(1);
}

console.log(`🗄️  Database provider: ${PROVIDER}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

const prisma = new PrismaClient();

async function main() {
  try {
    // Verify connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established.');

    // Run seed — seed.js is self-executing (calls main() at bottom),
    // so just importing it runs the seed. We also re-run main() explicitly
    // for clarity since it's idempotent (uses upsert/findFirst).
    await import('../server/prisma/seed.js');
    console.log('✅ Database seed completed.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
