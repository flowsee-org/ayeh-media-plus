/**
 * Task 17 — Creator Studio + /api/videos ownership regression tests.
 *
 * Run against an isolated API/database only:
 *   TEST_ORIGIN=http://127.0.0.1:5001 pnpm test:creator
 *
 * Safety:
 * - Creates uniquely named @ayeh.test users and videos.
 * - Deletes created videos and removes leftover test users via Prisma
 *   against the same DATABASE_URL the API uses (required for cleanup).
 * - Refuses to run unless TEST_ALLOW_SHARED_DB=1 when DATABASE_URL looks
 *   like the shared local SQLite (server/prisma/dev.db).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './loadEnv.js';
import { prisma } from './db.js';

const ORIGIN = process.env.TEST_ORIGIN || 'http://localhost:5000';
const BASE = `${ORIGIN}/api`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const createdUserIds = [];
const createdVideoIds = [];

function ok(label, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function json(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL || '';
  const allowShared = process.env.TEST_ALLOW_SHARED_DB === '1';
  const looksSharedSqlite =
    url.includes('server/prisma/dev.db') ||
    url.endsWith('/prisma/dev.db') ||
    url.endsWith('prisma/dev.db');

  if (looksSharedSqlite && !allowShared) {
    throw new Error(
      'Refusing to run against shared server/prisma/dev.db. ' +
        'Point DATABASE_URL at an isolated SQLite file (and start API with the same URL), ' +
        'or set TEST_ALLOW_SHARED_DB=1 explicitly.'
    );
  }

  // Never aim at production-looking hosts.
  if (/amazonaws\.com|neon\.tech|supabase\.co|railway\.app|render\.com/i.test(url)) {
    throw new Error('Refusing to run creator tests against a remote/production-looking DATABASE_URL.');
  }
}

async function registerVerified(label) {
  const email = `t17.${label}.${Date.now()}.${Math.floor(Math.random() * 9999)}@ayeh.test`;
  const password = 'TestPass123!';
  const reg = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: `T17 ${label}` }),
  });
  const rb = await json(reg);
  if (!reg.ok || !rb.success) {
    throw new Error(`register failed: ${JSON.stringify(rb)}`);
  }
  const verify = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode: '123456' }),
  });
  const vb = await json(verify);
  if (!verify.ok || !vb.access_token) {
    throw new Error(`verify failed: ${JSON.stringify(vb)}`);
  }
  createdUserIds.push(vb.user.id);
  return {
    email,
    password,
    token: vb.access_token,
    id: vb.user.id,
    role: vb.user.role || 'user',
  };
}

function auth(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function ensureAdmin() {
  const adminLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ayeh.media', password: 'admin123' }),
  });
  const adminBody = await json(adminLogin);
  if (adminLogin.status === 200 && adminBody.access_token) {
    return adminBody.access_token;
  }

  // Isolated DB may not be seeded — create a disposable staff user via Prisma.
  const bcrypt = await import('bcryptjs');
  const email = `t17.admin.${Date.now()}@ayeh.test`;
  const password = 'TestPass123!';
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      full_name: 'T17 Admin',
      role: 'admin',
      email_verified: true,
    },
  });
  createdUserIds.push(user.id);

  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await json(login);
  if (!login.ok || !body.access_token) {
    throw new Error(`admin bootstrap login failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function cleanup() {
  try {
    if (createdVideoIds.length) {
      await prisma.video.deleteMany({ where: { id: { in: createdVideoIds } } });
    }
    // Also sweep any leftover T17 probe videos owned by test users.
    if (createdUserIds.length) {
      await prisma.video.deleteMany({ where: { reciter_id: { in: createdUserIds } } });
      await prisma.authOtp.deleteMany({
        where: {
          OR: [
            { email: { endsWith: '@ayeh.test' } },
          ],
        },
      }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  } catch (err) {
    console.warn('cleanup warning:', err.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  console.log('Task 17 creator / videos regression\n');
  console.log(`API: ${ORIGIN}`);
  assertSafeDatabase();
  console.log(`DATABASE_URL kind: ${(process.env.DATABASE_URL || '').startsWith('file:') ? 'sqlite-file' : 'other'}`);

  // ── Static frontend wiring checks (no browser) ──
  console.log('0. Frontend wiring');
  const wizard = fs.readFileSync(
    path.join(ROOT, 'src/components/video/SubmissionWizard.jsx'),
    'utf8'
  );
  const edit = fs.readFileSync(path.join(ROOT, 'src/views/EditVideo.jsx'), 'utf8');
  const dash = fs.readFileSync(path.join(ROOT, 'src/views/CreatorDashboard.jsx'), 'utf8');
  const creatorPage = fs.readFileSync(
    path.join(ROOT, 'src/app/(main)/creator/page.jsx'),
    'utf8'
  );
  const uploadPage = fs.readFileSync(
    path.join(ROOT, 'src/app/(main)/upload/page.jsx'),
    'utf8'
  );
  const apiJs = fs.readFileSync(path.join(ROOT, 'src/lib/api.js'), 'utf8');
  const sidebar = fs.readFileSync(
    path.join(ROOT, 'src/components/design-system/AppSidebar.jsx'),
    'utf8'
  );
  const roleGuard = fs.readFileSync(
    path.join(ROOT, 'src/components/RoleGuard.jsx'),
    'utf8'
  );
  const moderationPage = fs.readFileSync(
    path.join(ROOT, 'src/app/(main)/moderation/page.jsx'),
    'utf8'
  );
  const adminPage = fs.readFileSync(
    path.join(ROOT, 'src/app/(main)/admin/page.jsx'),
    'utf8'
  );

  ok('api.videos helper exported', /export const videos\s*=/.test(apiJs));
  ok('api object includes videos', /videos,/.test(apiJs));
  ok('SubmissionWizard uses api.videos.create', /api\.videos\.create\(/.test(wizard));
  ok(
    'SubmissionWizard does not write via entities.Video',
    !/api\.entities\.Video\.create\(/.test(wizard)
  );
  ok(
    'EditVideo uses api.videos.update/delete',
    /api\.videos\.update\(/.test(edit) && /api\.videos\.delete\(/.test(edit)
  );
  ok('CreatorDashboard lists mine via api.videos', /api\.videos[\s\S]*mine:\s*true/.test(dash));
  ok(
    'Creator page allows role user',
    /allowedRoles=\{\['user',\s*'creator',\s*'moderator',\s*'admin'\]\}/.test(creatorPage)
  );
  ok(
    'Upload page allows role user',
    /allowedRoles=\{\['user',\s*'creator',\s*'moderator',\s*'admin'\]\}/.test(uploadPage)
  );
  ok(
    'Sidebar creator items include user',
    /roles:\s*\['user',\s*'creator',\s*'moderator',\s*'admin'\]/.test(sidebar)
  );
  ok(
    'Staff routes remain staff-only in sidebar',
    /roles:\s*\['moderator',\s*'admin'\]/.test(sidebar) &&
      /roles:\s*\['admin'\]/.test(sidebar)
  );
  ok(
    'RoleGuard still gates guests before role check',
    /if \(!isAuthenticated \|\| !authUser\)/.test(roleGuard)
  );
  ok(
    'Moderation page remains moderator|admin',
    /allowedRoles=\{\['moderator',\s*'admin'\]\}/.test(moderationPage)
  );
  ok(
    'Admin page remains admin-only',
    /allowedRoles=\{\['admin'\]\}/.test(adminPage)
  );
  ok(
    'CreatorDashboard has no moderation queue UI',
    !/moderation|نوبت بررسی|صف بررسی/i.test(dash)
  );

  // ── Live API checks ──
  console.log('\n1. Auth actors');
  const A = await registerVerified('A');
  const B = await registerVerified('B');
  ok('user A role is user', A.role === 'user', A.role);
  ok('user B role is user', B.role === 'user', B.role);

  const adminToken = await ensureAdmin();
  ok('admin auth available', !!adminToken);

  console.log('\n2. Create via /api/videos');
  const createRes = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: auth(A.token),
    body: JSON.stringify({
      title: 'T17 user video',
      media_url: '/uploads/videos/t17-probe.mp4',
      media_type: 'video',
      category: 'recitation',
      reciter_id: B.id, // must be ignored
      status: 'published', // must be ignored for ordinary users
    }),
  });
  const created = await json(createRes);
  if (created.id) createdVideoIds.push(created.id);
  ok('ordinary user can create video', createRes.status === 201 && !!created.id, JSON.stringify(created).slice(0, 160));
  ok('ownership forced to session user', created.reciter_id === A.id, created.reciter_id);
  ok('non-staff status is pending_review', created.status === 'pending_review', created.status);

  const unauthCreate = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'no auth',
      media_url: '/uploads/videos/x.mp4',
    }),
  });
  ok('unauthenticated create rejected', unauthCreate.status === 401 || unauthCreate.status === 403);

  const badPayload = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: auth(A.token),
    body: JSON.stringify({ title: 'missing media' }),
  });
  ok('invalid payload rejected', badPayload.status === 400);

  console.log('\n3. Ownership on update/delete');
  const ownUpdate = await fetch(`${BASE}/videos/${created.id}`, {
    method: 'PUT',
    headers: auth(A.token),
    body: JSON.stringify({ title: 'T17 owned edit' }),
  });
  const ownUpdated = await json(ownUpdate);
  ok(
    'owner can update without body.reciter_id',
    ownUpdate.status === 200 && ownUpdated.title === 'T17 owned edit',
    JSON.stringify(ownUpdated).slice(0, 160)
  );

  const crossUpdate = await fetch(`${BASE}/videos/${created.id}`, {
    method: 'PUT',
    headers: auth(B.token),
    body: JSON.stringify({ title: 'hijack', reciter_id: B.id }),
  });
  ok('user B cannot update A video even with spoofed body owner', crossUpdate.status === 403);

  const crossDelete = await fetch(`${BASE}/videos/${created.id}`, {
    method: 'DELETE',
    headers: auth(B.token),
  });
  ok('user B cannot delete A video', crossDelete.status === 403);

  const crossGet = await fetch(`${BASE}/videos/${created.id}`, {
    headers: auth(B.token),
  });
  ok('user B cannot get A pending video', crossGet.status === 403);

  const ownerGet = await fetch(`${BASE}/videos/${created.id}`, {
    headers: auth(A.token),
  });
  ok('owner can get own pending video', ownerGet.status === 200);

  console.log('\n4. List privacy / mine');
  const pendingLeak = await fetch(`${BASE}/videos?status=pending_review&limit=50`, {
    headers: auth(B.token),
  });
  const pendingBody = await json(pendingLeak);
  const foreign = (pendingBody.items || []).filter((v) => v.reciter_id !== B.id);
  ok(
    'pending_review list does not leak other users rows to B',
    pendingLeak.status === 200 && foreign.length === 0,
    `foreign=${foreign.length} total=${pendingBody.total}`
  );

  const mine = await fetch(`${BASE}/videos?mine=1&limit=50`, {
    headers: auth(A.token),
  });
  const mineBody = await json(mine);
  ok(
    'mine=1 returns own pending video',
    mine.status === 200 && (mineBody.items || []).some((v) => v.id === created.id),
    JSON.stringify({ total: mineBody.total }).slice(0, 80)
  );
  ok(
    'mine=1 only returns A rows',
    (mineBody.items || []).every((v) => v.reciter_id === A.id)
  );

  const mineUnauth = await fetch(`${BASE}/videos?mine=1`);
  ok('mine=1 without auth → 401', mineUnauth.status === 401);

  console.log('\n5. Admin capabilities intact');
  const adminUpdate = await fetch(`${BASE}/videos/${created.id}`, {
    method: 'PUT',
    headers: auth(adminToken),
    body: JSON.stringify({ title: 'admin touched' }),
  });
  const adminUpdated = await json(adminUpdate);
  ok(
    'admin can update any video',
    adminUpdate.status === 200 && adminUpdated.title === 'admin touched'
  );

  const ownDelete = await fetch(`${BASE}/videos/${created.id}`, {
    method: 'DELETE',
    headers: auth(A.token),
  });
  ok('owner can delete own video', ownDelete.status === 200);
  // already deleted via API; keep id for cleanup sweep safety
  const idx = createdVideoIds.indexOf(created.id);
  if (idx >= 0) createdVideoIds.splice(idx, 1);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  await cleanup();
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
