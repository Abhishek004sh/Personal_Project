// Small input checks. Each function returns the cleaned value or throws a
// ValidationError with a message that is safe to show to the user.

const { IST_OFFSET_MS } = require('./ledger');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

function cleanText(value, { field, min = 0, max = 200, required = false }) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be text`);
  const v = value.trim();
  if (required && v.length === 0) throw new ValidationError(`${field} is required`);
  if (v.length < min) throw new ValidationError(`${field} is too short`);
  if (v.length > max) throw new ValidationError(`${field} is too long (max ${max} characters)`);
  return v;
}

// Indian mobile numbers: keep 10 digits. Accepts +91 / 91 / 0 prefixes.
function cleanPhone(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new ValidationError('Phone number is not valid');
  }
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 10) throw new ValidationError('Phone number must have 10 digits');
  return digits;
}

const MAX_PAISE = 1_000_000_000; // 1 crore rupees

function cleanAmountPaise(value) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError('Amount must be a whole number of paise');
  }
  if (value <= 0) throw new ValidationError('Amount must be more than zero');
  if (value > MAX_PAISE) throw new ValidationError('Amount is too large');
  return value;
}

// Accepts "YYYY-MM-DD" (day in Indian time) or a full ISO date-time.
// Empty means "now". Dates more than one day in the future are refused.
function cleanDate(value, now = new Date()) {
  if (value === undefined || value === null || value === '') return new Date(now);
  if (typeof value !== 'string') throw new ValidationError('Date is not valid');

  let d;
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dayOnly) {
    const [, y, m, day] = dayOnly.map(Number);
    d = new Date(Date.UTC(y, m - 1, day) - IST_OFFSET_MS);
    const check = new Date(d.getTime() + IST_OFFSET_MS);
    if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== day) {
      throw new ValidationError('Date is not valid');
    }
    // A day-only date means that day; keep it at midday so it never slips
    // into the neighbouring day when shown.
    d = new Date(d.getTime() + 12 * 60 * 60 * 1000);
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) throw new ValidationError('Date is not valid');
  if (d.getTime() > new Date(now).getTime() + 24 * 60 * 60 * 1000) {
    throw new ValidationError('Date cannot be in the future');
  }
  if (d.getFullYear() < 2000) throw new ValidationError('Date is too old');
  return d;
}

const KINDS = ['customer', 'supplier'];

// Who an account belongs to. Empty means a customer (how v1 worked).
function cleanKind(value) {
  if (value === undefined || value === null || value === '') return 'customer';
  if (!KINDS.includes(value)) throw new ValidationError('Kind must be customer or supplier');
  return value;
}

// Supplier bill number: short text like "INV-2041" or "1187/A".
function cleanBillNo(value) {
  return cleanText(value, { field: 'Bill number', max: 40 });
}

const PAYMENT_METHODS = ['cash', 'upi', 'other'];

function cleanMethod(value, type) {
  if (type !== 'payment') return '';
  if (value === undefined || value === null || value === '') return 'cash';
  if (!PAYMENT_METHODS.includes(value)) throw new ValidationError('Payment method is not valid');
  return value;
}

module.exports = {
  ValidationError,
  cleanText,
  cleanPhone,
  cleanAmountPaise,
  cleanDate,
  cleanMethod,
  cleanKind,
  cleanBillNo,
  KINDS,
  PAYMENT_METHODS,
};
