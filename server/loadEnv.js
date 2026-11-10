/**
 * Load `.env` before any configuration-dependent module evaluates.
 *
 * ES module static imports are linked/evaluated before the importing module's
 * body runs, so calling `dotenv.config()` inside `index.js` is too late for
 * siblings such as `lib/jwt.js` (IS_PRODUCTION / JWT_SECRET) and delivery
 * provider selection. Import this module first from every process entrypoint.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, '..', '.env');

dotenv.config({ path: rootEnv, quiet: true });
// Also honor cwd `.env` when the process is started elsewhere (no override of
// values already set by the path above or the real process environment).
dotenv.config({ quiet: true });
