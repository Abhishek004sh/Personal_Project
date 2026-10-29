const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createMemoryStore } = require('../src/stores/memoryStore');

const config = {
  jwtSecret: 'x'.repeat(40),
  adminPassword: 'shop-password-1',
  loginAttemptLimit: 100,
};

async function start(clock) {
  const app = createApp({ store: createMemoryStore(), config, clock });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* no body */ }
    return { status: res.status, body: json };
  };
  const login = async () => (await call('POST', '/api/auth/login', { password: config.adminPassword })).body.token;
  return { server, call, login };
}

test('login: wrong password refused, right password gives a token', async () => {
  const { server, call } = await start();
  try {
    assert.equal((await call('POST', '/api/auth/login', { password: 'nope' })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', {})).status, 401);
    const ok = await call('POST', '/api/auth/login', { password: config.adminPassword });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
  } finally { server.close(); }
});

test('every data route needs a login', async () => {
  const { server, call } = await start();
  try {
    for (const [m, p] of [
      ['GET', '/api/customers'],
      ['GET', '/api/dashboard'],
      ['POST', '/api/customers'],
      ['GET', '/api/customers/abc'],
      ['POST', '/api/entries/abc/void'],
    ]) {
      assert.equal((await call(m, p, m === 'GET' ? undefined : {})).status, 401, `${m} ${p}`);
    }
    assert.equal((await call('GET', '/api/customers', undefined, 'garbage')).status, 401);
  } finally { server.close(); }
});

test('full flow: customer, credit, payment, balance, void, dashboard', async () => {
  const clock = () => new Date('2026-10-28T06:00:00Z');
  const { server, call, login } = await start(clock);
  try {
    const t = await login();

    const created = await call('POST', '/api/customers', { name: '  Ram Kumar ', phone: '+91 98765 43210', area: 'Rohta Bagh' }, t);
    assert.equal(created.status, 201);
    assert.equal(created.body.name, 'Ram Kumar');
    assert.equal(created.body.phone, '9876543210');
    assert.equal(created.body.balancePaise, 0);
    const id = created.body.id;

    const c1 = await call('POST', `/api/customers/${id}/entries`, {
      type: 'credit', amountPaise: 2500000, date: '2026-08-15', note: '18mm ply x 10',
    }, t);
    assert.equal(c1.status, 201);
    assert.equal(c1.body.customer.balancePaise, 2500000);

    const p1 = await call('POST', `/api/customers/${id}/entries`, {
      type: 'payment', amountPaise: 1000000, date: '2026-10-01', method: 'upi',
    }, t);
    assert.equal(p1.status, 201);
    assert.equal(p1.body.entry.method, 'upi');
    assert.equal(p1.body.customer.balancePaise, 1500000);
    assert.equal(p1.body.customer.oldestUnpaidDays, 74);

    // Dashboard
    let dash = await call('GET', '/api/dashboard', undefined, t);
    assert.equal(dash.body.totalPendingPaise, 1500000);
    assert.equal(dash.body.overdueCount, 1);
    assert.equal(dash.body.collectedThisMonthPaise, 1000000);

    // Void the payment (wrong amount) -> balance goes back up, history is kept
    const v = await call('POST', `/api/entries/${p1.body.entry.id}/void`, { reason: 'entered by mistake' }, t);
    assert.equal(v.status, 200);
    assert.equal(v.body.customer.balancePaise, 2500000);
    assert.equal(v.body.entry.voided.reason, 'entered by mistake');

    // Voiding twice is refused
    assert.equal((await call('POST', `/api/entries/${p1.body.entry.id}/void`, { reason: 'again please' }, t)).status, 409);

    // Detail still lists the voided entry
    const detail = await call('GET', `/api/customers/${id}`, undefined, t);
    assert.equal(detail.body.entries.length, 2);
    assert.equal(detail.body.entries.filter((e) => e.voided).length, 1);

    dash = await call('GET', '/api/dashboard', undefined, t);
    assert.equal(dash.body.totalPendingPaise, 2500000);
    assert.equal(dash.body.collectedThisMonthPaise, 0);
  } finally { server.close(); }
});

test('validation: bad names, phones, amounts, dates, types', async () => {
  const clock = () => new Date('2026-10-28T06:00:00Z');
  const { server, call, login } = await start(clock);
  try {
    const t = await login();
    assert.equal((await call('POST', '/api/customers', { name: '   ' }, t)).status, 400);
    assert.equal((await call('POST', '/api/customers', {}, t)).status, 400);
    assert.equal((await call('POST', '/api/customers', { name: 'A', phone: '12345' }, t)).status, 400);
    assert.equal((await call('POST', '/api/customers', { name: 'x'.repeat(81) }, t)).status, 400);

    const { body: c } = await call('POST', '/api/customers', { name: 'Shyam' }, t);
    const url = `/api/customers/${c.id}/entries`;
    assert.equal((await call('POST', url, { type: 'gift', amountPaise: 100 }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 0 }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: -5 }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 10.5 }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: '100' }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100, date: '2026-13-45' }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100, date: '2027-01-01' }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'payment', amountPaise: 100, method: 'bitcoin' }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100 }, t)).status, 201);

    // void needs a reason
    const e = await call('POST', url, { type: 'credit', amountPaise: 100 }, t);
    assert.equal((await call('POST', `/api/entries/${e.body.entry.id}/void`, {}, t)).status, 400);
    assert.equal((await call('POST', `/api/entries/${e.body.entry.id}/void`, { reason: 'x' }, t)).status, 400);
  } finally { server.close(); }
});

test('unknown customer / entry give 404', async () => {
  const { server, call, login } = await start();
  try {
    const t = await login();
    assert.equal((await call('GET', '/api/customers/doesnotexist', undefined, t)).status, 404);
    assert.equal((await call('POST', '/api/customers/doesnotexist/entries', { type: 'credit', amountPaise: 100 }, t)).status, 404);
    assert.equal((await call('POST', '/api/entries/doesnotexist/void', { reason: 'testing' }, t)).status, 404);
  } finally { server.close(); }
});

test('search by name, phone and area; sorting', async () => {
  const { server, call, login } = await start();
  try {
    const t = await login();
    const a = (await call('POST', '/api/customers', { name: 'Ram Kumar', phone: '9876543210', area: 'Rohta Bagh' }, t)).body;
    const b = (await call('POST', '/api/customers', { name: 'Shyam Lal', phone: '9123456789', area: 'Sikandra' }, t)).body;
    await call('POST', `/api/customers/${b.id}/entries`, { type: 'credit', amountPaise: 500000 }, t);

    const names = async (q) => (await call('GET', `/api/customers?q=${encodeURIComponent(q)}`, undefined, t)).body.map((c) => c.name);
    assert.deepEqual(await names('ram'), ['Ram Kumar']);
    assert.deepEqual(await names('9123'), ['Shyam Lal']);
    assert.deepEqual(await names('sikandra'), ['Shyam Lal']);
    assert.deepEqual(await names('nobody'), []);
    assert.deepEqual(await names(''), ['Shyam Lal', 'Ram Kumar']); // highest balance first
    const byName = await call('GET', '/api/customers?sort=name', undefined, t);
    assert.deepEqual(byName.body.map((c) => c.name), ['Ram Kumar', 'Shyam Lal']);
    assert.ok(a.id);
  } finally { server.close(); }
});

test('editing a customer keeps the balance', async () => {
  const { server, call, login } = await start();
  try {
    const t = await login();
    const c = (await call('POST', '/api/customers', { name: 'Ram' }, t)).body;
    await call('POST', `/api/customers/${c.id}/entries`, { type: 'credit', amountPaise: 12345 }, t);
    const patched = await call('PATCH', `/api/customers/${c.id}`, { name: 'Ram Kumar', phone: '9876543210' }, t);
    assert.equal(patched.status, 200);
    assert.equal(patched.body.name, 'Ram Kumar');
    assert.equal(patched.body.balancePaise, 12345);
    assert.equal((await call('PATCH', `/api/customers/${c.id}`, { phone: '123' }, t)).status, 400);
  } finally { server.close(); }
});

test('bad JSON gives a clean 400', async () => {
  const { server, login } = await start();
  try {
    const t = await login();
    const base = `http://127.0.0.1:${server.address().port}`;
    const res = await fetch(`${base}/api/customers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${t}` },
      body: '{not json',
    });
    assert.equal(res.status, 400);
  } finally { server.close(); }
});

test('suppliers: separate from customers, same hisaab, bill numbers, search', async () => {
  const clock = () => new Date('2026-10-28T06:00:00Z');
  const { server, call, login } = await start(clock);
  try {
    const t = await login();

    // one customer who owes us, one supplier we owe
    const cust = (await call('POST', '/api/customers', { name: 'Ramesh Sharma' }, t)).body;
    await call('POST', `/api/customers/${cust.id}/entries`, { type: 'credit', amountPaise: 300000, date: '2026-10-20' }, t);

    const created = await call('POST', '/api/customers', { name: 'Kumar Plywood Traders', kind: 'supplier', area: 'Delhi' }, t);
    assert.equal(created.status, 201);
    assert.equal(created.body.kind, 'supplier');
    const sup = created.body;

    // maal liya (credit) with a bill number, then partial payment
    const bought = await call('POST', `/api/customers/${sup.id}/entries`, {
      type: 'credit', amountPaise: 5000000, date: '2026-10-01', note: '18mm BWP x 40', billNo: ' INV-2041 ',
    }, t);
    assert.equal(bought.status, 201);
    assert.equal(bought.body.entry.billNo, 'INV-2041');
    assert.equal(bought.body.customer.balancePaise, 5000000);

    const paid = await call('POST', `/api/customers/${sup.id}/entries`, { type: 'payment', amountPaise: 1500000, date: '2026-10-18', method: 'upi' }, t);
    assert.equal(paid.body.customer.balancePaise, 3500000);
    assert.equal(paid.body.customer.lastPaymentDays, 10);

    // lists are separate (no kind = customers, as in v1)
    const customers = (await call('GET', '/api/customers', undefined, t)).body.map((c) => c.name);
    const suppliers = (await call('GET', '/api/customers?kind=supplier', undefined, t)).body.map((c) => c.name);
    assert.deepEqual(customers, ['Ramesh Sharma']);
    assert.deepEqual(suppliers, ['Kumar Plywood Traders']);

    // dashboards are separate: Lena hai vs Dena hai
    const lena = (await call('GET', '/api/dashboard', undefined, t)).body;
    const dena = (await call('GET', '/api/dashboard?kind=supplier', undefined, t)).body;
    assert.equal(lena.totalPendingPaise, 300000);
    assert.equal(dena.totalPendingPaise, 3500000);
    assert.equal(dena.customersOwing, 1);
    assert.equal(dena.collectedThisMonthPaise, 1500000);
    assert.equal(lena.collectedThisMonthPaise, 0);

    // search finds a supplier by bill number, only inside the supplier list
    const find = async (kind, q) =>
      (await call('GET', `/api/customers?kind=${kind}&q=${encodeURIComponent(q)}`, undefined, t)).body.map((c) => c.name);
    assert.deepEqual(await find('supplier', 'inv-2041'), ['Kumar Plywood Traders']);
    assert.deepEqual(await find('supplier', '2041'), ['Kumar Plywood Traders']);
    assert.deepEqual(await find('customer', 'inv-2041'), []);

    // a cancelled entry's bill number is no longer found
    await call('POST', `/api/entries/${bought.body.entry.id}/void`, { reason: 'wrong supplier' }, t);
    assert.deepEqual(await find('supplier', 'inv-2041'), []);
  } finally { server.close(); }
});

test('suppliers: bad kind and bad bill number are refused', async () => {
  const { server, call, login } = await start();
  try {
    const t = await login();
    assert.equal((await call('POST', '/api/customers', { name: 'X', kind: 'friend' }, t)).status, 400);
    assert.equal((await call('GET', '/api/customers?kind=friend', undefined, t)).status, 400);
    assert.equal((await call('GET', '/api/dashboard?kind=friend', undefined, t)).status, 400);

    const s = (await call('POST', '/api/customers', { name: 'Mica Supplier', kind: 'supplier' }, t)).body;
    const url = `/api/customers/${s.id}/entries`;
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100, billNo: 'B'.repeat(41) }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100, billNo: 12345 }, t)).status, 400);
    assert.equal((await call('POST', url, { type: 'credit', amountPaise: 100 }, t)).status, 201); // bill number is optional
  } finally { server.close(); }
});
