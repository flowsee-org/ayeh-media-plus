import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { io } from '../socket.js';
import { authenticate } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac/permissions.js';
import { PERMISSIONS } from '../middleware/rbac/permissions.js';

const router = Router();

// Populate req.user when a token is present. Public reads stay open, but every
// write below requires an authenticated user and an ownership/role check.
router.use(authenticate({ required: false }));

// Introspect Prisma model scalar fields
const modelFieldsMap = new Map();
if (Prisma?.dmmf?.datamodel?.models) {
  for (const m of Prisma.dmmf.datamodel.models) {
    const fieldNames = new Set(m.fields.map((f) => f.name));
    modelFieldsMap.set(m.name.charAt(0).toLowerCase() + m.name.slice(1), fieldNames);
  }
}

export function filterModelFields(entityName, payload, isCreate = false) {
  if (!payload || typeof payload !== 'object') return payload;
  const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const allowed = modelFieldsMap.get(modelName);
  if (!allowed) return payload;

  const normalized = { ...payload };

  // 1. Author <-> User alias normalization
  if (allowed.has('author_id') && !normalized.author_id && normalized.user_id) {
    normalized.author_id = normalized.user_id;
  }
  if (allowed.has('author_name') && !normalized.author_name && normalized.user_name) {
    normalized.author_name = normalized.user_name;
  }
  if (allowed.has('author_avatar') && !normalized.author_avatar && (normalized.user_avatar || normalized.avatar || normalized.avatar_url)) {
    normalized.author_avatar = normalized.user_avatar || normalized.avatar || normalized.avatar_url;
  }
  if (allowed.has('user_id') && !normalized.user_id && normalized.author_id) {
    normalized.user_id = normalized.author_id;
  }
  if (allowed.has('user_name') && !normalized.user_name && normalized.author_name) {
    normalized.user_name = normalized.author_name;
  }
  if (allowed.has('user_avatar') && !normalized.user_avatar && (normalized.author_avatar || normalized.avatar || normalized.avatar_url)) {
    normalized.user_avatar = normalized.author_avatar || normalized.avatar || normalized.avatar_url;
  }

  // 2. Creator alias normalization
  if (allowed.has('creator_id') && !normalized.creator_id && (normalized.user_id || normalized.author_id)) {
    normalized.creator_id = normalized.user_id || normalized.author_id;
  }
  if (allowed.has('creator_name') && !normalized.creator_name && (normalized.user_name || normalized.author_name)) {
    normalized.creator_name = normalized.user_name || normalized.author_name;
  }
  if (allowed.has('creator_avatar') && !normalized.creator_avatar && (normalized.user_avatar || normalized.author_avatar)) {
    normalized.creator_avatar = normalized.user_avatar || normalized.author_avatar;
  }

  // 3. Image / Media url normalization
  if (allowed.has('media_url') && !normalized.media_url && (normalized.image_url || normalized.video_url || normalized.audio_url)) {
    normalized.media_url = normalized.image_url || normalized.video_url || normalized.audio_url;
  }
  if (allowed.has('image_url') && !normalized.image_url && normalized.media_url && normalized.media_type === 'image') {
    normalized.image_url = normalized.media_url;
  }

  // 3b. Follow alias: older clients sent scholar_id for the followed user
  if (allowed.has('followed_id') && !normalized.followed_id && normalized.scholar_id) {
    normalized.followed_id = normalized.scholar_id;
  }

  // 4. Fallbacks for strictly non-null required fields (only on CREATE)
  if (isCreate) {
    applyCreateFallbacks(entityName, normalized);
  }

  const filtered = {};
  for (const [k, v] of Object.entries(normalized)) {
    if (allowed.has(k)) {
      filtered[k] = v;
    }
  }
  return filtered;
}

// Map entity name to Prisma delegate name (lowercase first letter)
function getPrismaModel(name) {
  if (!name) return null;
  // Convert e.g. "CompetitionEntry" -> "competitionEntry", "Verse" -> "verse"
  const modelName = name.charAt(0).toLowerCase() + name.slice(1);
  return prisma[modelName] ? prisma[modelName] : null;
}

// Convert DB record to API format (parse JSON fields)
export function deserializeRecord(record) {
  if (!record || typeof record !== 'object') return record;
  const out = { ...record };
  for (const [key, val] of Object.entries(out)) {
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        out[key] = JSON.parse(val);
      } catch {
        // Keep as string if parsing fails
      }
    }
  }
  return out;
}

// Convert payload to DB format (stringify JSON array/object fields)
export function serializePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  for (const [key, val] of Object.entries(out)) {
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      out[key] = JSON.stringify(val);
    }
  }
  return out;
}

// Helper to parse sort string like "-created_date" or "name"
function parseSort(sortParam) {
  if (!sortParam || typeof sortParam !== 'string') {
    return { created_date: 'desc' };
  }
  const isDesc = sortParam.startsWith('-');
  const field = isDesc ? sortParam.slice(1) : sortParam;
  return { [field]: isDesc ? 'desc' : 'asc' };
}

// Fallbacks for strictly non-null required fields (only applied on CREATE)
function applyCreateFallbacks(entityName, normalized) {
  const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const allowed = modelFieldsMap.get(modelName);
  if (!allowed) return normalized;

  if (allowed.has('author_id') && !normalized.author_id) {
    normalized.author_id = 'guest';
  }
  if (allowed.has('author_name') && !normalized.author_name) {
    normalized.author_name = 'کاربر آیه';
  }
  if (allowed.has('content') && normalized.content === undefined) {
    normalized.content = '';
  }
  return normalized;
}

const IGNORED_FILTER_KEYS = new Set([
  'fields',
  'select',
  'skip',
  'page',
  'page_size',
  'limit',
  'sort',
  'cursor',
  '_',
]);

// Helper to construct Prisma where query from Base44 query object
function parseWhere(query, entityName = null) {
  if (!query || typeof query !== 'object') return {};
  const where = {};
  for (const [rawKey, val] of Object.entries(query)) {
    if (val === undefined || IGNORED_FILTER_KEYS.has(rawKey)) continue;
    // Follow: accept scholar_id as alias for followed_id (legacy client payloads)
    let key = rawKey;
    if (
      (entityName === 'Follow' || entityName === 'follow') &&
      rawKey === 'scholar_id'
    ) {
      key = 'followed_id';
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$in && Array.isArray(val.$in)) {
        where[key] = { in: val.$in };
      } else if (val.$gte !== undefined || val.$lte !== undefined || val.$gt !== undefined || val.$lt !== undefined) {
        where[key] = {
          ...(val.$gte !== undefined && { gte: val.$gte }),
          ...(val.$lte !== undefined && { lte: val.$lte }),
          ...(val.$gt !== undefined && { gt: val.$gt }),
          ...(val.$lt !== undefined && { lt: val.$lt }),
        };
      } else {
        where[key] = val;
      }
    } else {
      where[key] = val;
    }
  }
  return where;
}

/* ═══════════════════════════════════════════════════════════
   Authorization policy
   ───────────────────────────────────────────────────────────
   - Public reads are allowed, except for account/secret entities.
   - Every write requires authentication.
   - Entities owned by a user can only be changed by that user (or an admin).
   - Entities with no owner (verse, topic, scholar, competition…) are
     admin-only to write.
   ═══════════════════════════════════════════════════════════ */

// Never readable/writable through the generic API.
const HIDDEN_ENTITIES = new Set(['AuthOtp', 'AuthCaptcha']);
// Writable by admins only (account rows are managed through /api/auth).
const ADMIN_ONLY_ENTITIES = new Set(['User']);
// Candidate columns that identify the owner of a row.
const OWNER_FIELDS = ['author_id', 'creator_id', 'user_id', 'follower_id', 'recipient_id', 'scholar_id'];
// Entities where the owner column is authoritative for update/delete.
const STRICT_OWNER_ENTITIES = new Set([
  'Post',
  'Comment',
  'Story',
  'CompetitionEntry',
  'KhatmSession',
  'KhatmDua',
  'Collection',
  'Podcast',
  'Follow',
  'Notification',
  'LiveSession',
  'Bookmark',
  'Like',
  'Report',
  'Vote',
  'UserBadge',
  'DailyQuestProgress',
  'WatchHistory',
]);

// Rows that must never be listed across accounts (private user data).
const PRIVATE_OWNER_ENTITIES = new Set([
  'Bookmark',
  'Like',
  'Notification',
  'Report',
  'Vote',
  'UserBadge',
  'DailyQuestProgress',
  'WatchHistory',
]);

const isAdmin = (req) => req.user?.role === 'admin';
const isStaff = (req) =>
  req.user?.role === 'admin' || req.user?.role === 'moderator';

// Judging / approval fields must only change via staff moderation or
// /api/competitions/entries/:id/judge — never via author self-service updates.
const COMPETITION_ENTRY_JUDGE_FIELDS = new Set([
  'score_tajweed',
  'score_voice',
  'score_accuracy',
  'score_total',
  'rank_position',
  'judged_by',
  'judged_at',
  'status',
  'rejection_reason',
  'reviewed_by',
  'reviewed_at',
]);

// Some fields are legitimately changed by users who don't own the row:
// likes, comment counts, story views and competition votes. Restrict such
// cross-user updates to exactly these columns.
const CROSS_USER_UPDATE_FIELDS = {
  Post: new Set(['liked_by', 'likes_count', 'comments_count']),
  Story: new Set(['viewed_by', 'views_count']),
  Podcast: new Set(['likes_count', 'views_count']),
  CompetitionEntry: new Set(['votes_count', 'voted_by']),
};

function fieldsOf(entityName) {
  const modelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  return modelFieldsMap.get(modelName) || null;
}

function ownerFieldFor(entityName) {
  const fields = fieldsOf(entityName);
  if (!fields) return null;
  return OWNER_FIELDS.find((f) => fields.has(f)) || null;
}

function deny(res, status, message) {
  res.status(status).json({ message });
  return false;
}

function ensureReadable(req, res, entityName) {
  if (HIDDEN_ENTITIES.has(entityName)) return deny(res, 403, 'Forbidden');
  // User profiles are publicly readable (for profile pages); writes remain admin-only.
  if (ADMIN_ONLY_ENTITIES.has(entityName) && !isAdmin(req) && req.method !== 'GET') {
    return deny(res, 403, 'Admin access required');
  }
  return true;
}

function ensureWritable(req, res, entityName) {
  if (!req.user) return deny(res, 401, 'Authentication required');
  if (HIDDEN_ENTITIES.has(entityName)) return deny(res, 403, 'Forbidden');
  if (ADMIN_ONLY_ENTITIES.has(entityName) && !isAdmin(req)) {
    return deny(res, 403, 'Admin access required');
  }
  if (!ownerFieldFor(entityName) && !STRICT_OWNER_ENTITIES.has(entityName) && !isAdmin(req)) {
    return deny(res, 403, 'Admin access required');
  }
  return true;
}

// Force ownership/identity fields on create so clients cannot impersonate.
function applyCreatePolicy(req, entityName, payload) {
  const fields = fieldsOf(entityName);
  const ownerField = ownerFieldFor(entityName);

  // Notifications are addressed to someone else: the client legitimately
  // supplies recipient_id, while the actor identity is always the caller.
  if (entityName === 'Notification') {
    if (fields?.has('actor_id')) payload.actor_id = req.user.id;
    if (fields?.has('actor_name')) payload.actor_name = req.user.full_name || 'کاربر آیه';
    return payload;
  }

  // Khatm parts are structural rows owned by the parent session. user_id is the
  // optional reserver — never bind it to the session creator on create.
  if (entityName === 'KhatmPart') {
    if (payload.user_id === undefined) payload.user_id = null;
    if (payload.status === undefined) payload.status = 'available';
    return payload;
  }

  // Always bind owner/identity fields to the authenticated caller for owned entities.
  if (ownerField && (!isAdmin(req) || STRICT_OWNER_ENTITIES.has(entityName) || PRIVATE_OWNER_ENTITIES.has(entityName))) {
    payload[ownerField] = req.user.id;
  }

  if (!isAdmin(req) && !STRICT_OWNER_ENTITIES.has(entityName) && !ownerField) return payload;

  if (fields?.has('author_name')) payload.author_name = req.user.full_name || 'کاربر آیه';
  if (fields?.has('creator_name')) payload.creator_name = req.user.full_name || 'کاربر آیه';
  if (fields?.has('follower_name')) payload.follower_name = req.user.full_name || 'کاربر آیه';
  if (fields?.has('user_name')) payload.user_name = req.user.full_name || 'کاربر آیه';
  return payload;
}

function applyPrivateListScope(req, res, entityName, where) {
  if (!PRIVATE_OWNER_ENTITIES.has(entityName)) return where;
  if (!req.user) {
    deny(res, 401, 'Authentication required');
    return null;
  }
  if (isAdmin(req)) return where;
  const ownerField = ownerFieldFor(entityName);
  if (!ownerField) return where;
  return { ...where, [ownerField]: req.user.id };
}

async function ensurePrivateRecordReadable(req, res, entityName, record) {
  if (!PRIVATE_OWNER_ENTITIES.has(entityName)) return true;
  if (!req.user) return deny(res, 401, 'Authentication required');
  if (isAdmin(req)) return true;
  const ownerField = ownerFieldFor(entityName);
  if (!ownerField) return true;
  if (record[ownerField] === req.user.id) return true;
  return deny(res, 403, 'You can only access your own records');
}

async function ensureCanManageKhatmPart(req, res, part, action) {
  if (!req.user) return deny(res, 401, 'Authentication required');
  if (isStaff(req)) return true;
  if (!part?.session_id) return deny(res, 403, 'Forbidden');
  const session = await prisma.khatmSession.findUnique({
    where: { id: part.session_id },
    select: { creator_id: true },
  });
  if (session?.creator_id === req.user.id) return true;
  return deny(
    res,
    403,
    action === 'create'
      ? 'Only the session creator can add parts'
      : 'Only the session creator or staff can modify parts'
  );
}

/* ── Public User Profile Projection ──
 * Only explicitly approved fields are exposed publicly.
 * Sensitive fields (email, phone, password, role, banned status, etc.)
 * are NEVER included. Filtering happens server-side only.
 */
const PUBLIC_USER_FIELDS = new Set([
  'id',
  'full_name',
  'avatar_url',
  'bio',
  'is_scholar',
  'streak_days',
  'max_streak',
  'spiritual_level',
  'total_xp',
  // Intentionally excluded: email, phone, password, role, is_banned,
  // banned_reason, banned_until, preferences, avatar_config, last_active_date,
  // created_date, updated_date — internal metadata not for public exposure.
]);

function projectPublicUser(record) {
  if (!record) return null;
  const projected = {};
  for (const field of PUBLIC_USER_FIELDS) {
    if (record[field] !== undefined) projected[field] = record[field];
  }
  return projected;
}

// Prevent a non-admin from re-assigning ownership on update.
function applyUpdatePolicy(req, entityName, payload) {
  if (isAdmin(req) || !STRICT_OWNER_ENTITIES.has(entityName)) return payload;
  const ownerField = ownerFieldFor(entityName);
  if (ownerField) delete payload[ownerField];
  return payload;
}

async function ensureCanMutateRecord(req, res, entityName, id, payload, action) {
  if (!req.user) return deny(res, 401, 'Authentication required');
  if (HIDDEN_ENTITIES.has(entityName)) return deny(res, 403, 'Forbidden');
  if (ADMIN_ONLY_ENTITIES.has(entityName)) {
    return isAdmin(req) ? true : deny(res, 403, 'Admin access required');
  }

  // KhatmPart rows are not "owned" by the reserver for structural edits —
  // only session creator or staff may update/delete via the generic API.
  if (entityName === 'KhatmPart') {
    const model = getPrismaModel(entityName);
    const record = await model.findUnique({ where: { id } });
    if (!record) return deny(res, 404, 'Record not found');
    return ensureCanManageKhatmPart(req, res, record, action);
  }

  const ownerField = ownerFieldFor(entityName);
  if (!ownerField) {
    return isAdmin(req) ? true : deny(res, 403, 'Admin access required');
  }
  if (isAdmin(req) || !STRICT_OWNER_ENTITIES.has(entityName)) return true;

  const model = getPrismaModel(entityName);
  const record = await model.findUnique({ where: { id } });
  if (!record) return deny(res, 404, 'Record not found');
  if (record[ownerField] === req.user.id) return true;

  // Allow the narrow cross-user updates (likes, views, votes) but never the
  // entry itself.
  if (action === 'update' && payload) {
    const allowed = CROSS_USER_UPDATE_FIELDS[entityName];
    if (allowed && Object.keys(payload).every((k) => allowed.has(k))) return true;
  }

  return deny(res, 403, 'You can only modify your own records');
}

/* ── Routes ── */

// GET /api/entities/:entity - List / Filter records
router.get('/:entity', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureReadable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) {
      return res.status(404).json({ message: `Entity ${entityName} not found` });
    }

    const { limit, sort, cursor, fields: _f, select: _s, skip: _sk, ...filterParams } = req.query;
    const take = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const orderBy = parseSort(sort || '-created_date');
    let where = parseWhere(filterParams, entityName);
    where = applyPrivateListScope(req, res, entityName, where);
    if (where === null) return;

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        take,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
      }),
      model.count({ where }),
    ]);

    const parsedItems = items.map(deserializeRecord);

    // Public User profiles only expose approved fields (API3:2023).
    // Admins additionally see the role field so the AdminPanel can manage roles.
    const publicItems = entityName === 'User'
      ? parsedItems.map(item => {
          const projected = projectPublicUser(item);
          if (isAdmin(req)) projected.role = item.role;
          return projected;
        })
      : parsedItems;

    // Provide both array behavior and pagination metadata
    res.json({
      items: publicItems,
      has_more: items.length === take && total > items.length,
      next_cursor: items.length > 0 ? items[items.length - 1].id : null,
      total,
    });
  } catch (err) {
    console.error(`List ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity/filter - Complex filter query (used when body has objects like $in)
router.post('/:entity/filter', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureReadable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) {
      return res.status(404).json({ message: `Entity ${entityName} not found` });
    }

    const { query = {}, sort = '-created_date', limit = 100, skip = 0 } = req.body;
    const take = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const offset = Math.max(0, parseInt(skip, 10) || 0);
    const orderBy = parseSort(sort);
    let where = parseWhere(query, entityName);
    where = applyPrivateListScope(req, res, entityName, where);
    if (where === null) return;

    const [items, total] = await Promise.all([
      model.findMany({ where, orderBy, take, skip: offset }),
      model.count({ where }),
    ]);

    const parsedItems = items.map(deserializeRecord);

    // Public User profiles only expose approved fields (API3:2023).
    // Admins additionally see the role field so the AdminPanel can manage roles.
    const publicItems = entityName === 'User'
      ? parsedItems.map(item => {
          const projected = projectPublicUser(item);
          if (isAdmin(req)) projected.role = item.role;
          return projected;
        })
      : parsedItems;

    res.json({
      items: publicItems,
      has_more: offset + items.length < total,
      total,
    });
  } catch (err) {
    console.error(`Filter ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/entities/:entity/:id - Get single record
router.get('/:entity/:id', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureReadable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const item = await model.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Record not found' });

    if (!(await ensurePrivateRecordReadable(req, res, entityName, item))) return;

    // Public User profiles only expose approved fields (API3:2023).
    // Admins additionally see the role field.
    if (entityName === 'User') {
      const projected = projectPublicUser(item);
      if (isAdmin(req)) projected.role = item.role;
      return res.json(projected);
    }

    res.json(deserializeRecord(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/follow - Create a follow relationship (secure)
// follower_id is derived from the authenticated session only.
router.post('/follow', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const followed_id = req.body.followed_id || req.body.scholar_id;
    if (!followed_id || typeof followed_id !== 'string') {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    // Cannot follow yourself
    if (followed_id === req.user.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Validate target scholar exists
    const targetScholar = await prisma.scholar.findUnique({ where: { id: followed_id } });
    if (!targetScholar) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Prevent duplicate follows
    const existing = await prisma.follow.findFirst({
      where: { follower_id: req.user.id, followed_id },
    });
    if (existing) {
      return res.status(409).json({ message: 'Already following this user' });
    }

    const follow = await prisma.follow.create({
      data: {
        follower_id: req.user.id,
        followed_id,
        followed_name: targetScholar.name || req.body.scholar_name || req.body.followed_name || 'کاربر آیه',
      },
    });

    if (io) {
      io.emit('entity:change', {
        entity: 'Follow',
        action: 'create',
        data: follow,
      });
    }

    res.status(201).json(follow);
  } catch (err) {
    console.error('Follow create error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/entities/follow/:id - Unfollow (only owner or admin)
router.delete('/follow/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const follow = await prisma.follow.findUnique({ where: { id: req.params.id } });
    if (!follow) return res.status(404).json({ message: 'Follow record not found' });

    // Only the follower or an admin can unfollow
    if (follow.follower_id !== req.user.id && !isAdmin(req)) {
      return res.status(403).json({ message: 'You can only unfollow your own follows' });
    }

    await prisma.follow.delete({ where: { id: req.params.id } });

    if (io) {
      io.emit('entity:change', {
        entity: 'Follow',
        action: 'delete',
        data: { id: req.params.id },
      });
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Follow delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity - Create record
router.post('/:entity', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureWritable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const payload = applyCreatePolicy(
      req,
      entityName,
      filterModelFields(entityName, serializePayload(req.body), true)
    );
    // Follow-specific security: prevent self-follow and duplicates via generic route too
    if (entityName === 'Follow') {
      if (payload.follower_id === payload.followed_id) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }
      // followed_id references Scholar.id, not User.id
      const targetScholar = await prisma.scholar.findUnique({ where: { id: payload.followed_id } });
      if (!targetScholar) {
        return res.status(404).json({ message: 'Target user not found' });
      }
      const existing = await prisma.follow.findFirst({
        where: { follower_id: payload.follower_id, followed_id: payload.followed_id },
      });
      if (existing) {
        return res.status(409).json({ message: 'Already following this user' });
      }
    }

    // Live streaming: only moderator, scholar, master, admin may create sessions
    if (entityName === 'LiveSession' && !hasPermission(req.user.role, PERMISSIONS.LIVE_STREAM)) {
      return res.status(403).json({
        message: 'اشتراک زنده فقط برای مدیر، العالم و استاد مجاز است',
        code: 'LIVE_STREAM_FORBIDDEN',
        required_permission: PERMISSIONS.LIVE_STREAM,
        user_role: req.user.role,
      });
    }

    if (entityName === 'KhatmPart') {
      if (!(await ensureCanManageKhatmPart(req, res, payload, 'create'))) return;
    }

    // Authors cannot self-award scores / ranks / publish via create either.
    if (entityName === 'CompetitionEntry' && !isStaff(req)) {
      for (const field of COMPETITION_ENTRY_JUDGE_FIELDS) {
        delete payload[field];
      }
      payload.status = 'pending_review';
    }

    const created = await model.create({ data: payload });
    const result = deserializeRecord(created);

    // Broadcast change to active subscribers
    if (io) {
      io.emit('entity:change', {
        entity: entityName,
        action: 'create',
        data: result,
      });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(`Create ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity/bulk - Bulk create records
router.post('/:entity/bulk', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureWritable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const items = Array.isArray(req.body) ? req.body : req.body.items || [];
    const serializedItems = items
      .map(serializePayload)
      .map((item) => filterModelFields(entityName, item, true))
      .map((item) => applyCreatePolicy(req, entityName, item));

    if (entityName === 'KhatmPart') {
      for (const item of serializedItems) {
        if (!(await ensureCanManageKhatmPart(req, res, item, 'create'))) return;
      }
    }

    if (entityName === 'CompetitionEntry' && !isStaff(req)) {
      for (const item of serializedItems) {
        for (const field of COMPETITION_ENTRY_JUDGE_FIELDS) {
          delete item[field];
        }
        item.status = 'pending_review';
      }
    }

    const created = await prisma.$transaction(
      serializedItems.map((item) => model.create({ data: item }))
    );

    const parsed = created.map(deserializeRecord);

    if (io) {
      io.emit('entity:change', {
        entity: entityName,
        action: 'bulkCreate',
        data: parsed,
      });
    }

    res.status(201).json(parsed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT & PATCH /api/entities/:entity/:id - Update record
const updateHandler = async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureWritable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    let payload = filterModelFields(entityName, serializePayload(req.body));
    // Remove id from payload if passed
    delete payload.id;

    if (!(await ensureCanMutateRecord(req, res, entityName, req.params.id, payload, 'update'))) {
      return;
    }
    payload = applyUpdatePolicy(req, entityName, payload);

    // Reservation state for Khatm parts must go through atomic /api/khatm routes.
    if (entityName === 'KhatmPart') {
      const reservedFields = [
        'status',
        'user_id',
        'user_name',
        'user_avatar',
        'reserved_at',
        'completed_at',
      ];
      if (Object.keys(payload).some((k) => reservedFields.includes(k))) {
        return res.status(400).json({
          message:
            'Use /api/khatm/parts/:id/reserve|release|complete for reservation state changes',
        });
      }
    }

    // Competition judging / approval must go through staff judge/moderation paths.
    if (entityName === 'CompetitionEntry' && !isStaff(req)) {
      const attempted = Object.keys(payload).filter((k) =>
        COMPETITION_ENTRY_JUDGE_FIELDS.has(k)
      );
      if (attempted.length) {
        return res.status(403).json({
          message:
            'Judging and approval fields can only be changed by staff via /api/competitions/entries/:id/judge',
          fields: attempted,
        });
      }
    }

    const updated = await model.update({
      where: { id: req.params.id },
      data: payload,
    });
    const result = deserializeRecord(updated);

    if (io) {
      io.emit('entity:change', {
        entity: entityName,
        action: 'update',
        data: result,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(`Update ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
};
router.put('/:entity/:id', updateHandler);
router.patch('/:entity/:id', updateHandler);

// DELETE /api/entities/:entity/:id - Delete single record
router.delete('/:entity/:id', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureWritable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    if (!(await ensureCanMutateRecord(req, res, entityName, req.params.id, null, 'delete'))) {
      return;
    }

    await model.delete({ where: { id: req.params.id } });

    if (io) {
      io.emit('entity:change', {
        entity: entityName,
        action: 'delete',
        data: { id: req.params.id },
      });
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity/delete-many - Delete multiple records matching filter
router.post('/:entity/delete-many', async (req, res) => {
  try {
    const entityName = req.params.entity;
    if (!ensureWritable(req, res, entityName)) return;

    const model = getPrismaModel(entityName);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const where = parseWhere(req.body, entityName);

    // Non-admins may only mass-delete rows they own.
    if (!isAdmin(req)) {
      const ownerField = ownerFieldFor(entityName);
      if (!ownerField || !STRICT_OWNER_ENTITIES.has(entityName)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      where[ownerField] = req.user.id;
    }

    const result = await model.deleteMany({ where });

    if (io) {
      io.emit('entity:change', {
        entity: entityName,
        action: 'deleteMany',
        data: req.body,
      });
    }

    res.json({ success: true, count: result.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
