// Runs the whole app with made-up sample data and NO database.
// Data is lost when you stop it. Good for trying things out or showing the idea.
//   npm run demo      then open http://localhost:5000   (password: demo12345)

const path = require('path');
const { createApp } = require('../src/app');
const { createMemoryStore } = require('../src/stores/memoryStore');

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);

async function seed(store) {
  const people = [
    { name: 'Ramesh Sharma', phone: '9876500001', area: 'Rohta Bagh', notes: 'Carpenter. Usually pays at month end.' },
    { name: 'Sunil Interiors', phone: '9876500002', area: 'Sikandra', notes: '' },
    { name: 'Mohan Lal', phone: '9876500003', area: 'Kamla Nagar', notes: '' },
    { name: 'Gupta Builders', phone: '', area: 'Dayalbagh', notes: 'Pays by UPI' },
    { name: 'Anil Kumar', phone: '9876500005', area: 'Rohta Bagh', notes: '' },
  ];
  const c = [];
  for (const p of people) c.push(await store.createCustomer(p));

  const add = (i, type, rupees, ago, note = '', method = '') =>
    store.createEntry({
      customerId: c[i].id, type, amountPaise: rupees * 100,
      date: daysAgo(ago) + 'T06:30:00.000Z', note, method,
    });

  await add(0, 'credit', 42000, 80, '18mm BWP ply x 12, hinges');
  await add(0, 'payment', 15000, 50, '', 'cash');
  await add(0, 'credit', 8500, 12, 'Fevicol, edge tape');
  await add(1, 'credit', 120000, 95, 'Mica sheets and 19mm boards');
  await add(1, 'payment', 40000, 40, '', 'upi');
  await add(2, 'credit', 6200, 5, 'Door handles x 20');
  await add(3, 'credit', 75000, 20, 'Kitchen material');
  await add(3, 'payment', 75000, 8, '', 'upi');
  await add(4, 'credit', 18000, 33, '12mm ply x 6');
}

async function main() {
  const store = createMemoryStore();
  await seed(store);
  const config = {
    jwtSecret: 'demo-secret-demo-secret-demo-secret-1234',
    adminPassword: 'demo12345',
    clientDist: path.join(__dirname, '..', '..', 'client', 'dist'),
  };
  const app = createApp({ store, config });
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`Demo running on http://localhost:${port}  (password: demo12345)`));
}

main();
