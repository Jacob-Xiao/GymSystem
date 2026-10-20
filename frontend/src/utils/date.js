// Values for DATE columns (member.card_time, employee.entry_time) arrive as an ISO
// timestamp at UTC midnight. Formatting them with toLocaleString turns "2020-06-05" into
// "2020-06-05T04:00:00.000Z" in the admin tables, so they are rendered as calendar days.
export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('zh-CN');
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Remaining membership as data, not markup, so the utility stays presentation-free.
 *
 * @returns {{ text: string, expired: boolean }}
 */
export const membershipRemaining = (cardTime, membershipDuration) => {
  if (!cardTime || !membershipDuration) return { text: '未设置', expired: false };

  const cardDate = parseDate(cardTime);
  if (!cardDate) return { text: '未设置', expired: false };

  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - cardDate.getFullYear()) * 12 + (now.getMonth() - cardDate.getMonth());
  const remainingMonths = membershipDuration - monthsDiff;

  if (remainingMonths <= 0) {
    return { text: '已过期', expired: true };
  }

  if (remainingMonths < 1) {
    const expiry = new Date(
      cardDate.getFullYear(),
      cardDate.getMonth() + membershipDuration,
      cardDate.getDate()
    );
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return { text: `${daysRemaining}天`, expired: false };
  }

  return { text: `${remainingMonths}个月`, expired: false };
};
