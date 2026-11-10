/**
 * Phone normalization for OTP SMS.
 * - Iranian local numbers (09xxxxxxxxx / 9xxxxxxxxx / 98…) → storage `09…`, E.164 `+98…`
 * - Other numbers must already be E.164 (`+` + 8–15 digits)
 */

export function toEnglishDigits(str) {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

/**
 * @param {string} raw
 * @returns {{ ok: true, storageKey: string, e164: string } | { ok: false, message: string }}
 */
export function normalizePhoneNumber(raw) {
  const original = toEnglishDigits(raw);
  if (!original) {
    return { ok: false, message: 'شماره همراه الزامی است' };
  }

  // Prefer explicit E.164 when provided.
  if (original.startsWith('+')) {
    const e164 = `+${original.slice(1).replace(/\D/g, '')}`;
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
      return {
        ok: false,
        message: 'شماره بین‌المللی معتبر نیست (فرمت E.164 مانند ‎+98912…‎)',
      };
    }
    // Canonical IR storage remains local 09… for existing accounts.
    if (e164.startsWith('+98') && e164.length === 13) {
      const local = `0${e164.slice(3)}`;
      if (/^09\d{9}$/.test(local)) {
        return { ok: true, storageKey: local, e164 };
      }
    }
    return { ok: true, storageKey: e164, e164 };
  }

  let digits = original.replace(/[\s\-()]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Iran local / national forms
  if (digits.startsWith('98') && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 10 && digits.startsWith('9')) {
    digits = `0${digits}`;
  }

  if (/^09\d{9}$/.test(digits)) {
    return {
      ok: true,
      storageKey: digits,
      e164: `+98${digits.slice(1)}`,
    };
  }

  // Bare country code without + (e.g. 14155552671) — reject; require + for non-IR.
  return {
    ok: false,
    message: 'شماره تلفن همراه معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا ‎+14155552671‎)',
  };
}
