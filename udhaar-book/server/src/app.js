const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { customerSummary, buildDashboard } = require('./ledger');
const {
  ValidationError,
  cleanText,
  cleanPhone,
  cleanAmountPaise,
  cleanDate,
  cleanMethod,
} = require('./validate');

// Wraps async route handlers so errors reach the error handler below.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createApp({ store, config, clock = () => new Date() }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy ? 1 : false);

  app.use(helmet({ contentSecurityPolicy: false }));
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '50kb' }));

  // Password is hashed once at start-up, then compared safely on each login.
  const passwordHash = bcrypt.hashSync(config.adminPassword, 10);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.loginAttemptLimit ?? 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please wait a few minutes and try again.' },
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, store: store.name }));

  app.post(
    '/api/auth/login',
    loginLimiter,
    wrap(async (req, res) => {
      const password = req.body && req.body.password;
      const ok = typeof password === 'string' && (await bcrypt.compare(password, passwordHash));
      if (!ok) return res.status(401).json({ error: 'Wrong password' });
      const token = jwt.sign({ role: 'owner' }, config.jwtSecret, { expiresIn: '30d' });
      res.json({ token });
    })
  );

  // Everything below this line needs a valid login.
  const requireLogin = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    try {
      req.user = jwt.verify(token, config.jwtSecret);
      next();
    } catch {
      res.status(401).json({ error: 'Please log in' });
    }
  };
  app.use('/api', requireLogin);

  app.get(
    '/api/dashboard',
    wrap(async (req, res) => {
      const [customers, entries] = await Promise.all([store.listCustomers(), store.listAllEntries()]);
      res.json(buildDashboard(customers, entries, clock()));
    })
  );

  app.get(
    '/api/customers',
    wrap(async (req, res) => {
      const [customers, entries] = await Promise.all([store.listCustomers(), store.listAllEntries()]);
      const byCustomer = new Map();
      for (const e of entries) {
        if (!byCustomer.has(e.customerId)) byCustomer.set(e.customerId, []);
        byCustomer.get(e.customerId).push(e);
      }
      const now = clock();
      let list = customers.map((c) => customerSummary(c, byCustomer.get(c.id) || [], now));

      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      if (q) {
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q.replace(/\D/g, '') || '\u0000')) ||
            (c.area && c.area.toLowerCase().includes(q))
        );
      }

      const sort = req.query.sort === 'name' ? 'name' : 'balance';
      if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
      else list.sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));

      res.json(list);
    })
  );

  app.post(
    '/api/customers',
    wrap(async (req, res) => {
      const body = req.body || {};
      const data = {
        name: cleanText(body.name, { field: 'Name', required: true, max: 80 }),
        phone: cleanPhone(body.phone),
        area: cleanText(body.area, { field: 'Area', max: 80 }),
        notes: cleanText(body.notes, { field: 'Notes', max: 500 }),
      };
      const customer = await store.createCustomer(data);
      res.status(201).json(customerSummary(customer, [], clock()));
    })
  );

  app.get(
    '/api/customers/:id',
    wrap(async (req, res) => {
      const customer = await store.getCustomer(req.params.id);
      if (!customer || customer.archived) return res.status(404).json({ error: 'Customer not found' });
      const entries = await store.listEntries(customer.id);
      entries.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
      res.json({ customer: customerSummary(customer, entries, clock()), entries });
    })
  );

  app.patch(
    '/api/customers/:id',
    wrap(async (req, res) => {
      const existing = await store.getCustomer(req.params.id);
      if (!existing || existing.archived) return res.status(404).json({ error: 'Customer not found' });
      const body = req.body || {};
      const patch = {};
      if ('name' in body) patch.name = cleanText(body.name, { field: 'Name', required: true, max: 80 });
      if ('phone' in body) patch.phone = cleanPhone(body.phone);
      if ('area' in body) patch.area = cleanText(body.area, { field: 'Area', max: 80 });
      if ('notes' in body) patch.notes = cleanText(body.notes, { field: 'Notes', max: 500 });
      const updated = await store.updateCustomer(existing.id, patch);
      const entries = await store.listEntries(existing.id);
      res.json(customerSummary(updated, entries, clock()));
    })
  );

  app.post(
    '/api/customers/:id/entries',
    wrap(async (req, res) => {
      const customer = await store.getCustomer(req.params.id);
      if (!customer || customer.archived) return res.status(404).json({ error: 'Customer not found' });
      const body = req.body || {};
      if (body.type !== 'credit' && body.type !== 'payment') {
        throw new ValidationError('Type must be credit or payment');
      }
      const data = {
        customerId: customer.id,
        type: body.type,
        amountPaise: cleanAmountPaise(body.amountPaise),
        date: cleanDate(body.date, clock()),
        note: cleanText(body.note, { field: 'Note', max: 300 }),
        method: cleanMethod(body.method, body.type),
      };
      const entry = await store.createEntry(data);
      const entries = await store.listEntries(customer.id);
      res.status(201).json({ entry, customer: customerSummary(customer, entries, clock()) });
    })
  );

  // Entries are never deleted. A wrong entry is voided, with a reason.
  app.post(
    '/api/entries/:id/void',
    wrap(async (req, res) => {
      const entry = await store.getEntry(req.params.id);
      if (!entry) return res.status(404).json({ error: 'Entry not found' });
      if (entry.voided) return res.status(409).json({ error: 'This entry is already cancelled' });
      const reason = cleanText(req.body && req.body.reason, {
        field: 'Reason',
        required: true,
        min: 3,
        max: 200,
      });
      const updated = await store.voidEntry(entry.id, { reason, at: clock() });
      if (!updated) return res.status(409).json({ error: 'This entry is already cancelled' });
      const customer = await store.getCustomer(entry.customerId);
      const entries = await store.listEntries(entry.customerId);
      res.json({ entry: updated, customer: customerSummary(customer, entries, clock()) });
    })
  );

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Serve the built phone app from the same server when it exists.
  const clientDist = config.clientDist;
  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}

module.exports = { createApp };
