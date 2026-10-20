// Date and membership formatting shared by the admin tables and the member pages.
//
// These helpers stay presentation-free: they return data (or a locale-formatted string),
// never JSX. Copy that differs per language is passed in by the caller rather than
// hard-coded here, so switching language never leaves Chinese text behind.

// Values for DATE columns (member.card_time, employee.entry_time) arrive as an ISO
// timestamp at UTC midnight. Formatting them with toLocaleString turns "2020-06-05" into
// "2020-06-05T04:00:00.000Z" in the admin tables, so they are rendered as calendar days.
export const formatDate = (value, locale = 'zh-CN') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale);
};

// Datetime columns (booking times, notification/request timestamps) are real moments,
// so they keep the local date *and* time. This was duplicated verbatim in five pages.
export const formatDateTime = (value, locale = 'zh-CN') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const DEFAULT_LABELS = {
  notSet: 'Not set',
  expired: 'Expired',
  days: (n) => `${n} day(s)`,
  months: (n) => `${n} month(s)`
};

/**
 * Remaining membership as data, so the caller decides how to render it.
 *
 * @param {string|null} cardTime            join date
 * @param {number|null} membershipDuration  purchased duration in months
 * @param {object} labels                   per-language copy; see DEFAULT_LABELS
 * @returns {{ text: string, expired: boolean }}
 */
export const membershipRemaining = (cardTime, membershipDuration, labels) => {
  const copy = { ...DEFAULT_LABELS, ...(labels || {}) };

  if (!cardTime || !membershipDuration) return { text: copy.notSet, expired: false };

  const cardDate = parseDate(cardTime);
  if (!cardDate) return { text: copy.notSet, expired: false };

  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - cardDate.getFullYear()) * 12 + (now.getMonth() - cardDate.getMonth());
  const remainingMonths = membershipDuration - monthsDiff;

  if (remainingMonths <= 0) {
    return { text: copy.expired, expired: true };
  }

  if (remainingMonths < 1) {
    const expiry = new Date(
      cardDate.getFullYear(),
      cardDate.getMonth() + membershipDuration,
      cardDate.getDate()
    );
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return { text: copy.days(daysRemaining), expired: false };
  }

  return { text: copy.months(remainingMonths), expired: false };
};
