const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeBalance,
  oldestUnpaidDate,
  customerSummary,
  buildDashboard,
  startOfMonthIST,
} = require('../src/ledger');

const credit = (amountPaise, date, extra = {}) => ({
  id: `c${Math.random()}`, customerId: 'a', type: 'credit', amountPaise, date, voided: null, ...extra,
});
const payment = (amountPaise, date, extra = {}) => ({
  id: `p${Math.random()}`, customerId: 'a', type: 'payment', amountPaise, date, voided: null, ...extra,
});

test('balance is credit minus payments', () => {
  const entries = [credit(500000, '2026-01-01'), payment(200000, '2026-01-05'), credit(100000, '2026-01-10')];
  assert.equal(computeBalance(entries), 400000);
});

test('voided entries are ignored in the balance', () => {
  const entries = [
    credit(500000, '2026-01-01'),
    payment(500000, '2026-01-05', { voided: { reason: 'wrong customer', at: '2026-01-06' } }),
  ];
  assert.equal(computeBalance(entries), 500000);
});

test('balance can go negative when a customer pays in advance', () => {
  assert.equal(computeBalance([payment(100000, '2026-01-01')]), -100000);
});

test('oldest unpaid date: payments clear the oldest credit first', () => {
  const entries = [
    credit(100000, '2026-01-01'),
    credit(100000, '2026-02-01'),
    credit(100000, '2026-03-01'),
    payment(150000, '2026-03-05'),
  ];
  // Jan credit fully paid, Feb credit half paid -> Feb is the oldest unpaid
  assert.equal(oldestUnpaidDate(entries), '2026-02-01');
});

test('oldest unpaid date: fully paid gives null', () => {
  const entries = [credit(100000, '2026-01-01'), payment(100000, '2026-01-02')];
  assert.equal(oldestUnpaidDate(entries), null);
});

test('oldest unpaid date: an advance payment covers the next credit', () => {
  const entries = [payment(100000, '2026-01-01'), credit(100000, '2026-01-10'), credit(50000, '2026-02-01')];
  assert.equal(oldestUnpaidDate(entries), '2026-02-01');
});

test('oldest unpaid date ignores voided entries', () => {
  const entries = [
    credit(100000, '2026-01-01', { voided: { reason: 'typo', at: '2026-01-02' } }),
    credit(100000, '2026-02-01'),
  ];
  assert.equal(oldestUnpaidDate(entries), '2026-02-01');
});

test('customer summary: days, last payment, balance', () => {
  const now = new Date('2026-03-31T12:00:00Z');
  const entries = [credit(300000, '2026-03-01T06:30:00Z'), payment(100000, '2026-03-10T06:30:00Z')];
  const s = customerSummary({ id: 'a', name: 'Ram' }, entries, now);
  assert.equal(s.balancePaise, 200000);
  assert.equal(s.oldestUnpaidDays, 30);
  assert.equal(s.lastPaymentAt, '2026-03-10T06:30:00Z');
});

test('start of month is computed in Indian time', () => {
  // 31 Oct 20:00 UTC is already 1 Nov 01:30 in India
  const start = startOfMonthIST(new Date('2026-10-31T20:00:00Z'));
  assert.equal(start.toISOString(), '2026-10-31T18:30:00.000Z');
});

test('dashboard totals, top list, overdue list and month figures', () => {
  const now = new Date('2026-10-28T06:00:00Z');
  const customers = [
    { id: 'a', name: 'Ram' },
    { id: 'b', name: 'Shyam' },
    { id: 'c', name: 'Mohan' },
    { id: 'd', name: 'Paid Up' },
  ];
  const entries = [
    credit(1000000, '2026-08-01T06:30:00Z', { customerId: 'a' }), // old, 10,000
    credit(300000, '2026-10-20T06:30:00Z', { customerId: 'b' }), // recent, 3,000
    credit(500000, '2026-09-01T06:30:00Z', { customerId: 'c' }), // 5,000
    payment(200000, '2026-10-05T06:30:00Z', { customerId: 'c' }), // paid 2,000 this month
    credit(100000, '2026-09-10T06:30:00Z', { customerId: 'd' }),
    payment(100000, '2026-10-02T06:30:00Z', { customerId: 'd' }),
  ];
  const d = buildDashboard(customers, entries, now);

  assert.equal(d.totalPendingPaise, 1000000 + 300000 + 300000);
  assert.equal(d.customersOwing, 3);
  assert.deepEqual(d.topOwing.map((c) => c.name), ['Ram', 'Shyam', 'Mohan']);
  assert.deepEqual(d.overdue.map((c) => c.name), ['Ram', 'Mohan']);
  assert.equal(d.overduePaise, 1300000);
  assert.equal(d.collectedThisMonthPaise, 300000);
  assert.equal(d.creditThisMonthPaise, 300000);
});

test('customer summary: days since the last payment (null when never paid)', () => {
  const now = new Date('2026-10-28T06:00:00Z');
  const paid = customerSummary(
    { id: 'a', name: 'Supplier A' },
    [credit(500000, '2026-09-01T06:30:00Z'), payment(100000, '2026-10-08T06:30:00Z')],
    now
  );
  assert.equal(paid.lastPaymentDays, 20);
  const never = customerSummary({ id: 'b', name: 'Supplier B' }, [credit(500000, '2026-09-01T06:30:00Z')], now);
  assert.equal(never.lastPaymentDays, null);
});

test('dashboard: accounts with nothing paid for 30+ days (or ever) are listed, biggest first', () => {
  const now = new Date('2026-10-28T06:00:00Z');
  const parties = [
    { id: 'a', name: 'Paid last week' },
    { id: 'b', name: 'Paid long ago' },
    { id: 'c', name: 'Never paid' },
    { id: 'd', name: 'Settled' },
  ];
  const entries = [
    credit(900000, '2026-08-01T06:30:00Z', { customerId: 'a' }),
    payment(100000, '2026-10-21T06:30:00Z', { customerId: 'a' }),
    credit(500000, '2026-07-01T06:30:00Z', { customerId: 'b' }),
    payment(100000, '2026-08-20T06:30:00Z', { customerId: 'b' }),
    credit(700000, '2026-10-01T06:30:00Z', { customerId: 'c' }),
    credit(100000, '2026-09-01T06:30:00Z', { customerId: 'd' }),
    payment(100000, '2026-09-02T06:30:00Z', { customerId: 'd' }),
  ];
  const d = buildDashboard(parties, entries, now);
  assert.deepEqual(d.noRecentPayment.map((p) => p.name), ['Never paid', 'Paid long ago']);
});
