// Pure money/ledger logic. No database in here, so it is easy to test.
// All amounts are integer paise (1 rupee = 100 paise) to avoid decimal errors.

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function activeEntries(entries) {
  return entries.filter((e) => !e.voided);
}

function byDate(a, b) {
  const d = new Date(a.date) - new Date(b.date);
  if (d !== 0) return d;
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
}

// Balance = credit given - payments received. Voided entries are ignored.
// Positive means the customer owes us. Negative means they paid in advance.
function computeBalance(entries) {
  let balance = 0;
  for (const e of activeEntries(entries)) {
    balance += e.type === 'credit' ? e.amountPaise : -e.amountPaise;
  }
  return balance;
}

// Date of the oldest credit that is still (even partly) unpaid.
// Payments are applied to the oldest credit first. A payment made before a
// credit (advance) is used up against the next credit.
function oldestUnpaidDate(entries) {
  const sorted = activeEntries(entries).slice().sort(byDate);
  const credits = [];
  let advance = 0;

  for (const e of sorted) {
    if (e.type === 'credit') {
      let amount = e.amountPaise;
      if (advance > 0) {
        const used = Math.min(advance, amount);
        advance -= used;
        amount -= used;
      }
      if (amount > 0) credits.push({ date: e.date, remaining: amount });
    } else {
      let pay = e.amountPaise;
      while (pay > 0 && credits.length > 0) {
        const c = credits[0];
        const used = Math.min(c.remaining, pay);
        c.remaining -= used;
        pay -= used;
        if (c.remaining === 0) credits.shift();
      }
      advance += pay;
    }
  }
  return credits.length > 0 ? credits[0].date : null;
}

// Whole calendar days between two moments, counted in Indian time.
// (15 Aug to 28 Oct is 74 days, whatever the time of day.)
function istDayNumber(date) {
  return Math.floor((new Date(date).getTime() + IST_OFFSET_MS) / DAY_MS);
}

function daysBetween(from, now) {
  return Math.max(0, istDayNumber(now) - istDayNumber(from));
}

function customerSummary(customer, entries, now = new Date()) {
  const active = activeEntries(entries);
  const balancePaise = computeBalance(entries);

  let lastPaymentAt = null;
  let lastEntryAt = null;
  for (const e of active) {
    const t = new Date(e.date).getTime();
    if (!lastEntryAt || t > new Date(lastEntryAt).getTime()) lastEntryAt = e.date;
    if (e.type === 'payment' && (!lastPaymentAt || t > new Date(lastPaymentAt).getTime())) {
      lastPaymentAt = e.date;
    }
  }

  const oldest = balancePaise > 0 ? oldestUnpaidDate(entries) : null;

  return {
    ...customer,
    balancePaise,
    lastEntryAt,
    lastPaymentAt,
    oldestUnpaidAt: oldest,
    oldestUnpaidDays: oldest ? daysBetween(oldest, now) : null,
  };
}

// Start of the current month in Indian time, as a Date.
function startOfMonthIST(now = new Date()) {
  const ist = new Date(new Date(now).getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}

function buildDashboard(customers, allEntries, now = new Date(), overdueDays = 30) {
  const entriesByCustomer = new Map();
  for (const e of allEntries) {
    if (!entriesByCustomer.has(e.customerId)) entriesByCustomer.set(e.customerId, []);
    entriesByCustomer.get(e.customerId).push(e);
  }

  const summaries = customers.map((c) =>
    customerSummary(c, entriesByCustomer.get(c.id) || [], now)
  );
  const owing = summaries.filter((s) => s.balancePaise > 0);

  const totalPendingPaise = owing.reduce((sum, s) => sum + s.balancePaise, 0);

  const topOwing = owing
    .slice()
    .sort((a, b) => b.balancePaise - a.balancePaise)
    .slice(0, 10);

  const overdue = owing
    .filter((s) => s.oldestUnpaidDays !== null && s.oldestUnpaidDays >= overdueDays)
    .sort((a, b) => b.oldestUnpaidDays - a.oldestUnpaidDays);

  const monthStart = startOfMonthIST(now);
  let collectedThisMonthPaise = 0;
  let creditThisMonthPaise = 0;
  for (const e of activeEntries(allEntries)) {
    if (new Date(e.date) >= monthStart && new Date(e.date) <= new Date(now)) {
      if (e.type === 'payment') collectedThisMonthPaise += e.amountPaise;
      else creditThisMonthPaise += e.amountPaise;
    }
  }

  return {
    totalPendingPaise,
    customersOwing: owing.length,
    totalCustomers: customers.length,
    overdueDays,
    overdueCount: overdue.length,
    overduePaise: overdue.reduce((sum, s) => sum + s.balancePaise, 0),
    topOwing,
    overdue,
    collectedThisMonthPaise,
    creditThisMonthPaise,
  };
}

module.exports = {
  computeBalance,
  oldestUnpaidDate,
  customerSummary,
  buildDashboard,
  startOfMonthIST,
  DAY_MS,
  IST_OFFSET_MS,
};
