# Udhaar Book

A simple credit (udhaar) register for a plywood and hardware shop. It replaces flipping through
diary pages: every customer has one record, every sale on credit and every payment is an entry,
and the app works out who owes how much.

Version 1 does this:

- Customer list with search (name, phone, area) and sorting (highest pending / A to Z)
- Two kinds of entries: **goods given on credit** and **payment received** (cash / UPI / other)
- Entries can be dated in the past, so the old register can be typed in
- Balance is always worked out from the entries, never typed in by hand
- Wrong entries are **cancelled with a reason**, never deleted, so the history stays honest
- Home screen: total pending, who owes the most, who has been pending for 30+ days,
  money received and given on credit this month
- **Call** button, and a **WhatsApp** button that opens a ready message. Nothing is ever sent
  automatically. A person has to press send.
- Password login. Works well on a phone and can be installed on the home screen.

"Pending for N days" counts from the oldest credit that is still unpaid. Payments are applied to
the oldest credit first.

## Try it in one minute (no database needed)

You need Node.js 20 or newer.

```bash
cd client && npm install && npm run build && cd ..
cd server && npm install && npm run demo
```

Open http://localhost:5000 and log in with the password `demo12345`.
This shows made-up customers. Everything is forgotten when you stop it.

## Run it with real data (MongoDB)

1. Get a MongoDB database. The easiest is a free cluster on MongoDB Atlas, or install MongoDB on your computer.
2. In the `server` folder, copy `.env.example` to `.env` and fill it in:
   - `MONGODB_URI`: your database address
   - `JWT_SECRET`: long random text (the file shows how to make one)
   - `ADMIN_PASSWORD`: the password you will log in with
3. Build the app and start the server:

```bash
cd client && npm install && npm run build && cd ..
cd server && npm install && npm start
```

Open http://localhost:5000.

While changing the screens, run `npm run dev` in `server` (port 5000) and `npm run dev` in
`client` (opens on port 5173). The client passes `/api` calls on to the server by itself, so
nothing else needs setting up.

## Tests

```bash
cd server && npm test     # money logic and every API route
cd client && npm test     # amount handling, and clicking through the real screens
```

## Before putting it on the internet

- Use a strong `ADMIN_PASSWORD` and keep `.env` private (it is already in `.gitignore`).
- Host it on HTTPS only. Hosts like Render or Railway do this for you. Set `TRUST_PROXY=true` there.
- Turn on backups in your MongoDB host. This is real money data.
- The app stores customer details, so do not share the link or the login with outsiders.

## How the code is laid out

```
server/src/ledger.js       money rules: balance, oldest unpaid, dashboard (pure, well tested)
server/src/app.js          the API: login, customers, entries, cancel, dashboard
server/src/stores/         MongoDB store, and an in-memory store used for tests and the demo
client/src/pages/          Home, Customers, Customer detail, Login
client/src/strings.js      every word shown on screen, ready for a Hindi version
```

## Ideas for next versions

Mica order tracker, carpenter bonus tracking, estimates for whole jobs, Hindi labels, a staff
login with limited access, stock and billing. The "people" records already allow roles
(customer, carpenter, contractor) so these can be added without starting over.
