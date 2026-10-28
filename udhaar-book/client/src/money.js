// Money and date helpers. Amounts are whole paise (integers) everywhere.

// "1,500" / "₹ 1500.5" / "1500.50"  ->  150000 / 150050. Returns null if invalid.
export function parseRupeesToPaise(input) {
  if (typeof input !== 'string') return null;
  const s = input.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [rupees, fraction = ''] = s.split('.');
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paise) || paise <= 0 || paise > 1_000_000_000) return null;
  return paise;
}

// 15000000 -> "₹1,50,000" (Indian digit grouping)
export function formatRupees(paise) {
  const value = (paise || 0) / 100;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

// Today's date in India as YYYY-MM-DD (for the date box).
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function daysText(days) {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 60) return `${days} days`;
  const months = Math.floor(days / 30);
  return `${months} months`;
}

// Opens WhatsApp with a message already typed. Nothing is sent until a person
// presses send inside WhatsApp.
export function whatsappLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}
