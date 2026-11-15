/**
 * Ayeh Media Plus — Frontend RBAC Helpers
 *
 * Mirrors the backend permission matrix so the UI can conditionally
 * render buttons, links, and sections based on the signed-in user's
 * effective permissions. These are *client-side convenience checks*;
 * the backend remains the source of truth and enforces all permissions.
 */

// ── Role hierarchy (lowest → highest) ──
export const ROLE_HIERARCHY = ['anonymous', 'user', 'creator', 'moderator', 'admin'];

// ── Role display names (Persian) ──
export const ROLE_LABELS = {
  anonymous: 'کاربر مهمان',
  user: 'کاربر عادی',
  creator: 'تولیدکننده محتوا',
  moderator: 'ناظر محتوا',
  admin: 'مدیر کل سیستم',
};

// ── Role descriptions (Persian) ──
export const ROLE_DESCRIPTIONS = {
  anonymous: 'دسترسی القراءة به محتوای عمومی',
  user: 'لایک، ذخیره، نظر، دنبال کردن، ارسال لینک برای کیوریش',
  creator: 'آپلود ویدیو/صوت، مدیریت کانال، آنالیтика، پاسخ به نظرات',
  moderator: 'بررسی صف محتوای معلق، تایید/رد محتوای قرآنی، مدیریت نظرات',
  admin: 'کنترل کامل سیستم، مدیریت نقش‌ها، پیکربندی، توک/',
};

// ── Permission constants (must match backend) ──
export const PERMISSIONS = {
  // Content read
  VIDEO_READ: 'video:read',
  VIDEO_READ_PENDING: 'video:read:pending',
  VIDEO_READ_ALL: 'video:read:all',

  // Content write
  VIDEO_SUBMIT: 'video:submit',
  VIDEO_CREATE: 'video:create',
  VIDEO_UPDATE_OWN: 'video:update:own',
  VIDEO_UPDATE_ANY: 'video:update:any',
  VIDEO_DELETE_OWN: 'video:delete:own',
  VIDEO_DELETE_ANY: 'video:delete:any',

  // Moderation
  MODERATE_QUEUE: 'moderate:queue',
  MODERATE_VIDEO: 'moderate:video',
  MODERATE_COMMENT: 'moderate:comment',
  MODERATE_ENTRY: 'moderate:entry',
  MODERATE_REPORT: 'moderate:report',
  MODERATE_USER: 'moderate:user',

  // Competition
  COMPETITION_READ: 'competition:read',
  COMPETITION_CREATE: 'competition:create',
  COMPETITION_UPDATE_OWN: 'competition:update:own',
  COMPETITION_UPDATE_ANY: 'competition:update:any',
  COMPETITION_DELETE_OWN: 'competition:delete:own',
  COMPETITION_DELETE_ANY: 'competition:delete:any',
  COMPETITION_SUBMIT_ENTRY: 'competition:submit:entry',
  COMPETITION_VOTE: 'competition:vote',
  COMPETITION_JUDGE: 'competition:judge',

  // Comments
  COMMENT_READ: 'comment:read',
  COMMENT_CREATE: 'comment:create',
  COMMENT_UPDATE_OWN: 'comment:update:own',
  COMMENT_DELETE_OWN: 'comment:delete:own',
  COMMENT_DELETE_ANY: 'comment:delete:any',

  // Engagement
  LIKE_CREATE: 'like:create',
  BOOKMARK_CREATE: 'bookmark:create',
  FOLLOW_CREATE: 'follow:create',

  // Reports
  REPORT_CREATE: 'report:create',
  REPORT_READ_OWN: 'report:read:own',
  REPORT_READ_ALL: 'report:read:all',

  // Users
  USER_READ_OWN: 'user:read:own',
  USER_UPDATE_OWN: 'user:update:own',
  USER_READ_ANY: 'user:read:any',
  USER_UPDATE_ANY: 'user:update:any',
  USER_DELETE_ANY: 'user:delete:any',
  USER_BAN: 'user:ban',
  USER_ROLE_ASSIGN: 'user:role:assign',

  // System
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_FEATURE_TOGGLE: 'system:feature:toggle',
  SYSTEM_AUDIT_LOG: 'system:audit:log',
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_READ_OWN: 'analytics:read:own',

  // Notifications
  NOTIFICATION_READ_OWN: 'notification:read:own',
  NOTIFICATION_READ_ALL: 'notification:read:all',
};

// ── Permission matrix (mirrors backend) ──
export const ROLE_PERMISSIONS = {
  anonymous: new Set([
    PERMISSIONS.VIDEO_READ,
    PERMISSIONS.COMPETITION_READ,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.LIKE_CREATE,
  ]),

  user: new Set([
    PERMISSIONS.VIDEO_READ,
    PERMISSIONS.VIDEO_READ_PENDING,
    PERMISSIONS.VIDEO_SUBMIT,
    PERMISSIONS.VIDEO_UPDATE_OWN,
    PERMISSIONS.VIDEO_DELETE_OWN,
    PERMISSIONS.COMPETITION_READ,
    PERMISSIONS.COMPETITION_SUBMIT_ENTRY,
    PERMISSIONS.COMPETITION_VOTE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.LIKE_CREATE,
    PERMISSIONS.BOOKMARK_CREATE,
    PERMISSIONS.FOLLOW_CREATE,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ_OWN,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.ANALYTICS_READ_OWN,
  ]),

  creator: new Set([
    PERMISSIONS.VIDEO_READ,
    PERMISSIONS.VIDEO_READ_PENDING,
    PERMISSIONS.VIDEO_SUBMIT,
    PERMISSIONS.VIDEO_CREATE,
    PERMISSIONS.VIDEO_UPDATE_OWN,
    PERMISSIONS.VIDEO_DELETE_OWN,
    PERMISSIONS.COMPETITION_READ,
    PERMISSIONS.COMPETITION_CREATE,
    PERMISSIONS.COMPETITION_UPDATE_OWN,
    PERMISSIONS.COMPETITION_DELETE_OWN,
    PERMISSIONS.COMPETITION_SUBMIT_ENTRY,
    PERMISSIONS.COMPETITION_VOTE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.LIKE_CREATE,
    PERMISSIONS.BOOKMARK_CREATE,
    PERMISSIONS.FOLLOW_CREATE,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ_OWN,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.ANALYTICS_READ_OWN,
  ]),

  moderator: new Set([
    PERMISSIONS.VIDEO_READ,
    PERMISSIONS.VIDEO_READ_PENDING,
    PERMISSIONS.VIDEO_READ_ALL,
    PERMISSIONS.VIDEO_SUBMIT,
    PERMISSIONS.VIDEO_CREATE,
    PERMISSIONS.VIDEO_UPDATE_OWN,
    PERMISSIONS.VIDEO_UPDATE_ANY,
    PERMISSIONS.VIDEO_DELETE_OWN,
    PERMISSIONS.VIDEO_DELETE_ANY,
    PERMISSIONS.COMPETITION_READ,
    PERMISSIONS.COMPETITION_CREATE,
    PERMISSIONS.COMPETITION_UPDATE_OWN,
    PERMISSIONS.COMPETITION_UPDATE_ANY,
    PERMISSIONS.COMPETITION_DELETE_OWN,
    PERMISSIONS.COMPETITION_DELETE_ANY,
    PERMISSIONS.COMPETITION_SUBMIT_ENTRY,
    PERMISSIONS.COMPETITION_VOTE,
    PERMISSIONS.COMPETITION_JUDGE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_UPDATE_ANY,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_DELETE_ANY,
    PERMISSIONS.LIKE_CREATE,
    PERMISSIONS.BOOKMARK_CREATE,
    PERMISSIONS.FOLLOW_CREATE,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ_OWN,
    PERMISSIONS.REPORT_READ_ALL,
    PERMISSIONS.MODERATE_QUEUE,
    PERMISSIONS.MODERATE_VIDEO,
    PERMISSIONS.MODERATE_COMMENT,
    PERMISSIONS.MODERATE_ENTRY,
    PERMISSIONS.MODERATE_REPORT,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.NOTIFICATION_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_OWN,
    PERMISSIONS.ANALYTICS_READ,
  ]),

  admin: new Set(Object.values(PERMISSIONS)),
};

/**
 * Get all permissions for a role (including inherited from lower roles).
 */
export function getPermissionsForRole(role) {
  const roleIndex = ROLE_HIERARCHY.indexOf(role);
  if (roleIndex === -1) return new Set();

  const permissions = new Set();
  for (let i = 0; i <= roleIndex; i++) {
    const rolePerms = ROLE_PERMISSIONS[ROLE_HIERARCHY[i]];
    if (rolePerms) {
      for (const perm of rolePerms) {
        permissions.add(perm);
      }
    }
  }
  return permissions;
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role, permission) {
  return getPermissionsForRole(role).has(permission);
}

/**
 * Get the next role up in the hierarchy (for upgrade suggestions).
 */
export function getNextRole(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  if (idx === -1 || idx >= ROLE_HIERARCHY.length - 1) return null;
  return ROLE_HIERARCHY[idx + 1];
}

/**
 * Get all permissions as an array.
 */
export function getAllPermissions() {
  return Object.values(PERMISSIONS);
}
