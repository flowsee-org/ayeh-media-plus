import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root project directory /logs
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const JSONL_LOG_PATH = path.join(LOGS_DIR, 'app-errors.jsonl');
const HUMAN_LOG_PATH = path.join(LOGS_DIR, 'app-errors.log');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Append an error entry to both JSONL and readable text log files
 */
export function logError({
  source = 'backend',
  type = 'error',
  message = '',
  stack = '',
  route = null,
  method = null,
  clientInfo = null,
  statusCode = 500,
  meta = {},
}) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const entry = {
    id,
    timestamp,
    source, // 'backend' | 'frontend'
    type,   // 'uncaughtException', 'unhandledRejection', 'expressError', 'reactErrorBoundary', 'windowError'
    message: String(message || 'Unknown error'),
    stack: String(stack || ''),
    route: route ? String(route) : null,
    method: method ? String(method) : null,
    statusCode: Number(statusCode) || 500,
    clientInfo: clientInfo || null,
    meta: meta || {},
    status: 'open', // 'open' | 'resolved'
  };

  try {
    // 1. Write structured JSON line
    fs.appendFileSync(JSONL_LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');

    // 2. Write human-readable text log
    const readable = `[${timestamp}] [${source.toUpperCase()}] [${type}] [${method || ''} ${route || ''}] ${message}\n` +
      (stack ? `Stack:\n${stack}\n` : '') +
      (clientInfo ? `Client: ${JSON.stringify(clientInfo)}\n` : '') +
      '--------------------------------------------------------------------------------\n';
    fs.appendFileSync(HUMAN_LOG_PATH, readable, 'utf8');
  } catch (err) {
    console.error('Failed to write to error log file:', err);
  }

  return entry;
}

/**
 * Retrieve all logged errors, optionally filtered
 */
export function getLoggedErrors({ limit = 100, source = null } = {}) {
  if (!fs.existsSync(JSONL_LOG_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(JSONL_LOG_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const errors = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter by source if requested
    const filtered = source ? errors.filter((e) => e.source === source) : errors;

    // Return newest first, up to limit
    return filtered.reverse().slice(0, limit);
  } catch (err) {
    console.error('Failed to read error logs:', err);
    return [];
  }
}

/**
 * Clear or reset error logs
 */
export function clearLogs() {
  try {
    fs.writeFileSync(JSONL_LOG_PATH, '', 'utf8');
    fs.writeFileSync(HUMAN_LOG_PATH, `[${new Date().toISOString()}] Error logs initialized/cleared.\n`, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to clear error logs:', err);
    return false;
  }
}

/**
 * Setup global process listeners for unhandled errors
 */
export function initGlobalProcessLogging() {
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    logError({
      source: 'backend',
      type: 'uncaughtException',
      message: err?.message || String(err),
      stack: err?.stack || '',
    });
  });

  process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection:', reason);
    logError({
      source: 'backend',
      type: 'unhandledRejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || '',
    });
  });
}
