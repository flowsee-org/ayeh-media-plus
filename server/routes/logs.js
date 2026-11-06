import { Router } from 'express';
import { logError, getLoggedErrors, clearLogs } from '../logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const router = Router();

// POST /api/logs/client-error - Collect errors from frontend
router.post('/client-error', (req, res) => {
  try {
    const {
      message,
      stack,
      type = 'windowError',
      route,
      clientInfo,
      meta,
    } = req.body;

    const entry = logError({
      source: 'frontend',
      type,
      message,
      stack,
      route,
      clientInfo: clientInfo || {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
      meta,
    });

    res.status(201).json({ success: true, id: entry.id });
  } catch (err) {
    console.error('Failed to capture client error:', err);
    res.status(500).json({ message: 'Logging failed' });
  }
});

// GET /api/logs/errors - List captured errors
router.get('/errors', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const source = req.query.source || null;

    const errors = getLoggedErrors({ limit, source });
    const backendCount = errors.filter((e) => e.source === 'backend').length;
    const frontendCount = errors.filter((e) => e.source === 'frontend').length;

    res.json({
      total: errors.length,
      stats: {
        backend: backendCount,
        frontend: frontendCount,
      },
      items: errors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs/errors/clear - Flush all error logs
router.post('/errors/clear', (req, res) => {
  try {
    const ok = clearLogs();
    res.json({ success: ok, message: 'لاگ خطاها با موفقیت پاکسازی شد.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Intelligent Error Doctor heuristic engine:
 * Extracts file references, identifies common JavaScript/React/Prisma patterns,
 * and formulates a clear diagnosis and fix advice.
 */
function diagnoseError(errorItem) {
  const msg = errorItem.message || '';
  const stack = errorItem.stack || '';
  const fullText = `${msg}\n${stack}`;

  let title = 'خطای عمومی سیستم';
  let severity = 'warning'; // critical | warning | info
  let explanation = 'یک خطای پردازشی یا ناشناخته در برنامه رخ داده است.';
  let suggestedFix = 'بررسی لاگ و کد منبع مربوطه توصیه می‌شود.';
  let fileLocation = null;

  // Extract file & line from stack trace if available
  const matchFile = stack.match(/(?:file:\/\/)?(\/[^:\n\r]+):(\d+):(\d+)/) ||
    stack.match(/\bat\s+.*?\((.*?):(\d+):(\d+)\)/);
  if (matchFile) {
    let filePath = matchFile[1];
    if (filePath.startsWith(ROOT_DIR)) {
      filePath = filePath.replace(ROOT_DIR + '/', '');
    }
    fileLocation = `${filePath}:${matchFile[2]}`;
  }

  // 1. Prisma Validation or Missing Field Error
  if (fullText.includes('PrismaClientValidationError') || fullText.includes('Argument') && fullText.includes('missing')) {
    title = 'عدم تطابق فیلدهای ارسالی با ساختار دیتابیس (Prisma Validation)';
    severity = 'critical';
    const missingMatch = fullText.match(/Argument `?(\w+)`? is missing/i);
    const missingField = missingMatch ? missingMatch[1] : 'ناشناخته';
    explanation = `درخواست ایجاد یا ویرایش در دیتابیس پریزما با شکست مواجه شده است، زیرا فیلد اجباری «${missingField}» ارسال نشده یا خالی است.`;
    suggestedFix = `در کامپوننت فرانت‌اند یا سرویس بک‌اند، اطمینان حاصل کنید که فیلد «${missingField}» مقداردهی شده باشد، یا در فایل schema.prisma فیلد را به صورت اختیاری (?${missingField}) تعریف کنید. همچنین لایه filterModelFields در entities.js می‌تواند به عنوان مپینگ به کار گرفته شود.`;
  }
  // 2. ReferenceError: X is not defined
  else if (fullText.includes('ReferenceError') || fullText.includes('is not defined')) {
    title = 'فراخوانی متغیر یا تابع تعریف‌نشده (ReferenceError)';
    severity = 'critical';
    const varMatch = fullText.match(/(\w+) is not defined/);
    const varName = varMatch ? varMatch[1] : 'متغیر';
    explanation = `کد سعی در فراخوانی متغیر یا تابع «${varName}» داشته که در محدوده (Scope) جاری اعلان یا ایمپورت نشده است.`;
    suggestedFix = `در فایل مربوطه، بررسی کنید که آیا «${varName}» با useState یا به عنوان ورودی کامپوننت تعریف شده و ایمپورت آن از پکیج یا ماژول مقصد صحیح است.`;
  }
  // 3. Cannot read property of undefined/null
  else if (fullText.includes('Cannot read properties of undefined') || fullText.includes('Cannot read property of null')) {
    title = 'دسترسی به ویژگی در شیء تعریف‌نشده یا خالی (Null / Undefined Access)';
    severity = 'warning';
    const propMatch = fullText.match(/reading '(\w+)'/);
    const propName = propMatch ? propMatch[1] : 'ویژگی';
    explanation = `کد قصد خواندن خصلت «${propName}» از یک متغیر را داشته، اما متغیر مقدار null یا undefined داشته است (غالباً به دلیل آماده نبودن پاسخ شبکه یا عدم ورود کاربر).`;
    suggestedFix = `از عملگر زنجیره‌سازی ایمن (Optional Chaining) مانند obj?.${propName} استفاده کنید یا قبل از دسترسی، شرط بررسی وجود شیء (مانند if (obj)) را قرار دهید.`;
  }
  // 4. Network / Fetch Failures
  else if (fullText.includes('Failed to fetch') || fullText.includes('NetworkError') || fullText.includes('ECONNREFUSED')) {
    title = 'خطای ارتباط با سرور یا شبکه (Network Failure)';
    severity = 'warning';
    explanation = 'درخواست شبکه به دلیل قطعی سرور بک‌اند، اختلال در اتصال اینترنت یا مسدودسازی CORS با شکست مواجه شده است.';
    suggestedFix = 'بررسی کنید سرور بک‌اند روی پورت ۵۰۰۰ فعال باشد (`npm run server`) و مسیر API با پیشوند /api به درستی هدایت شود.';
  }
  // 5. React Rendering Crash
  else if (errorItem.type === 'reactErrorBoundary') {
    title = 'کرش چرخه رندر رابط کاربری (React Component Crash)';
    severity = 'critical';
    explanation = 'یکی از کامپوننت‌های ری‌اکت در حین پردازش یا رندر با استثناء نامنتظره مواجه شده و Error Boundary مانع از سفید شدن کامل صفحه شده است.';
    suggestedFix = 'استیت‌های پاس داده شده به کامپوننت را با مقادیر اولیه ایمن آرایه‌ای یا رشته‌ای پر کنید و متغیرهای نامعتبر در useEffect را مهار نمایید.';
  }

  return {
    title,
    severity,
    explanation,
    suggestedFix,
    fileLocation: fileLocation || errorItem.route || 'نامشخص',
  };
}

// POST /api/logs/errors/diagnose - Error Doctor assistant diagnosis
router.post('/errors/diagnose', (req, res) => {
  try {
    const { errorId, errorData } = req.body;
    let item = errorData;

    if (errorId && !item) {
      const all = getLoggedErrors({ limit: 200 });
      item = all.find((e) => e.id === errorId);
    }

    if (!item) {
      return res.status(404).json({ message: 'خطای مورد نظر در لاگ‌ها یافت نشد' });
    }

    const diagnosis = diagnoseError(item);
    res.json({
      error: item,
      diagnosis,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
