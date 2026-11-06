import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { io } from '../socket.js';

const router = Router();

// Introspect Prisma model scalar fields
const modelFieldsMap = new Map();
if (Prisma?.dmmf?.datamodel?.models) {
  for (const m of Prisma.dmmf.datamodel.models) {
    const fieldNames = new Set(m.fields.map((f) => f.name));
    modelFieldsMap.set(m.name.charAt(0).toLowerCase() + m.name.slice(1), fieldNames);
  }
}

export function filterModelFields(entityName, payload) {
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

  // 4. Fallbacks for strictly non-null required fields
  if (allowed.has('author_id') && !normalized.author_id) {
    normalized.author_id = 'guest';
  }
  if (allowed.has('author_name') && !normalized.author_name) {
    normalized.author_name = 'کاربر آیه';
  }
  if (allowed.has('content') && normalized.content === undefined) {
    normalized.content = '';
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
function parseWhere(query) {
  if (!query || typeof query !== 'object') return {};
  const where = {};
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined || IGNORED_FILTER_KEYS.has(key)) continue;
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

// GET /api/entities/:entity - List / Filter records
router.get('/:entity', async (req, res) => {
  try {
    const model = getPrismaModel(req.params.entity);
    if (!model) {
      return res.status(404).json({ message: `Entity ${req.params.entity} not found` });
    }

    const { limit, sort, cursor, fields: _f, select: _s, skip: _sk, ...filterParams } = req.query;
    const take = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const orderBy = parseSort(sort || '-created_date');
    const where = parseWhere(filterParams);

    const items = await model.findMany({
      where,
      orderBy,
      take,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    const parsedItems = items.map(deserializeRecord);

    // Provide both array behavior and pagination metadata
    res.json({
      items: parsedItems,
      has_more: items.length === take,
      next_cursor: items.length > 0 ? items[items.length - 1].id : null,
      total: parsedItems.length,
    });
  } catch (err) {
    console.error(`List ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity/filter - Complex filter query (used when body has objects like $in)
router.post('/:entity/filter', async (req, res) => {
  try {
    const model = getPrismaModel(req.params.entity);
    if (!model) {
      return res.status(404).json({ message: `Entity ${req.params.entity} not found` });
    }

    const { query = {}, sort = '-created_date', limit = 100 } = req.body;
    const take = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const orderBy = parseSort(sort);
    const where = parseWhere(query);

    const items = await model.findMany({
      where,
      orderBy,
      take,
    });

    const parsedItems = items.map(deserializeRecord);
    res.json({
      items: parsedItems,
      has_more: items.length === take,
      total: parsedItems.length,
    });
  } catch (err) {
    console.error(`Filter ${req.params.entity} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/entities/:entity/:id - Get single record
router.get('/:entity/:id', async (req, res) => {
  try {
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const item = await model.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Record not found' });

    res.json(deserializeRecord(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/entities/:entity - Create record
router.post('/:entity', async (req, res) => {
  try {
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const payload = filterModelFields(req.params.entity, serializePayload(req.body));
    const created = await model.create({ data: payload });
    const result = deserializeRecord(created);

    // Broadcast change to active subscribers
    if (io) {
      io.emit('entity:change', {
        entity: req.params.entity,
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
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const items = Array.isArray(req.body) ? req.body : req.body.items || [];
    const serializedItems = items
      .map(serializePayload)
      .map((item) => filterModelFields(req.params.entity, item));

    const created = await prisma.$transaction(
      serializedItems.map((item) => model.create({ data: item }))
    );

    const parsed = created.map(deserializeRecord);

    if (io) {
      io.emit('entity:change', {
        entity: req.params.entity,
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
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const payload = filterModelFields(req.params.entity, serializePayload(req.body));
    // Remove id from payload if passed
    delete payload.id;

    const updated = await model.update({
      where: { id: req.params.id },
      data: payload,
    });
    const result = deserializeRecord(updated);

    if (io) {
      io.emit('entity:change', {
        entity: req.params.entity,
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
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    await model.delete({ where: { id: req.params.id } });

    if (io) {
      io.emit('entity:change', {
        entity: req.params.entity,
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
    const model = getPrismaModel(req.params.entity);
    if (!model) return res.status(404).json({ message: `Entity not found` });

    const where = parseWhere(req.body);
    const result = await model.deleteMany({ where });

    if (io) {
      io.emit('entity:change', {
        entity: req.params.entity,
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
