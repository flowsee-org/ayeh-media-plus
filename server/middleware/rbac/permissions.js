/**
 * Ayeh Media Plus — Role-Based Access Control (RBAC) Permission System
 *
 * Defines roles, permissions, and a strict permission matrix for all
 * platform actions. Every role inherits from the one below it.
 *
 * Roles (lowest to highest privilege):
 *   anonymous   - Guest visitor (read-only public content)
 *   user        - Registered user (engagement, uploads via submission)
 *   creator     - Content creator / reciter / organizer (dashboard, uploads, analytics)
 *   moderator   - Content & religious supervisor (moderation queues, approval/reject)
 *   admin       - System administrator (full control, user management, config)
 */

// ── Permission constants ──
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

  // Religious content publication (tafsir / tadbir) — restricted to
  // super-admin, 'Ulama (scholars), and asatid (masters).
  TAFSIR_PUBLISH: 'tafsir:publish',
  TADBIR_PUBLISH: 'tadbir:publish',

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

// ── Role hierarchy (each role inherits permissions from roles below) ──
export const ROLE_HIERARCHY = [
  'anonymous',
  'user',
  'creator',
  'moderator',
  'scholar',   // 'Ulama — may publish tafsir / tadbir
  'master',    // Asatid — may publish tafsir / tadbir
  'admin',     // Super-admin — full control
];

// ── Permission matrix: role → set of permissions ──
export const ROLE_PERMISSIONS = {
  anonymous: new Set([
    PERMISSIONS.VIDEO_READ,
    PERMISSIONS.COMPETITION_READ,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.LIKE_CREATE, // anonymous likes tracked via session/IP
  ]),

  user: new Set([
    // Inherits anonymous + ...
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
    // Inherits user + ...
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
    // Inherits creator + ...
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

  scholar: new Set([
    // Inherits moderator + ...
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
    PERMISSIONS.MODERATE_USER,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_READ_ANY,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.NOTIFICATION_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_OWN,
    PERMISSIONS.ANALYTICS_READ,
    // Religious publication rights
    PERMISSIONS.TAFSIR_PUBLISH,
    PERMISSIONS.TADBIR_PUBLISH,
  ]),

  master: new Set([
    // Inherits scholar + ...
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
    PERMISSIONS.MODERATE_USER,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_READ_ANY,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_UPDATE_ANY,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.NOTIFICATION_READ_ALL,
    PERMISSIONS.ANALYTICS_READ_OWN,
    PERMISSIONS.ANALYTICS_READ,
    // Religious publication rights
    PERMISSIONS.TAFSIR_PUBLISH,
    PERMISSIONS.TADBIR_PUBLISH,
  ]),

  admin: new Set([
    // All permissions
    ...Object.values(PERMISSIONS),
  ]),
};

// ── Role display names (Persian) ──
export const ROLE_LABELS = {
  anonymous: 'کاربر مهمان',
  user: 'کاربر عادی',
  creator: 'تولیدکننده محتوا',
  moderator: 'ناظر محتوا',
  scholar: 'علماء و متفکران (أهل تفسیر)',
  master: 'أساتید و معلمان',
  admin: 'مدیر کل سامانه',
};

// ── Role descriptions ──
export const ROLE_DESCRIPTIONS = {
  anonymous: 'دسترسی القراءة به محتوای عمومی',
  user: 'لایک، ذخیره، نظر، دنبال کردن، ارسال لینک برای کیوریش',
  creator: 'آپلود ویدیو/صوت، مدیریت کانال، آنالیтика، پاسخ به نظرات',
  moderator: 'بررسی صف محتوا، تایید/رد محتوای قرآنی، مدیریت نظرات',
  scholar: 'انتشار تفسیر (tafsir) و تدبیر (tadbir) قرآنی — autoriته دینی',
  master: 'انتشار تفسیر و تدبیر، تدریس و مدیریت محتوای دینی',
  admin: 'کنترل کامل سامانه، مدیریت نقش‌ها، پیکربندی، توگ/',
};

// ── Get all permissions for a role (including inherited) ──
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

// ── Check if a role has a permission ──
export function hasPermission(role, permission) {
  return getPermissionsForRole(role).has(permission);
}

// ── Get all permissions as array ──
export function getAllPermissions() {
  return Object.values(PERMISSIONS);
}