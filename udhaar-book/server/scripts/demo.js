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
    // customers ("Lena hai" — carpenters, contractors, interior shops, direct
    // household buyers — the mix you'd actually see around Rohta Bagh)
    { name: 'Ramesh Sharma', phone: '9876500001', area: 'Rohta Bagh', notes: 'Carpenter. Usually pays at month end.' },
    { name: 'Sunil Interiors', phone: '9876500002', area: 'Sikandra', notes: '' },
    { name: 'Mohan Lal', phone: '9876500003', area: 'Kamla Nagar', notes: '' },
    { name: 'Gupta Builders', phone: '', area: 'Dayalbagh', notes: 'Pays by UPI' },
    { name: 'Anil Kumar', phone: '9876500005', area: 'Rohta Bagh', notes: '' },
    { name: 'Irfan Khan', phone: '9897500006', area: 'Tajganj', notes: 'Carpenter, do 2-3 kitchens a month' },
    { name: 'Deepak Furniture Works', phone: '9456500007', area: 'Shahganj', notes: '' },
    { name: 'Vinod Thekedar', phone: '9897500008', area: 'Sikandra', notes: 'Contractor, bulk orders for sites' },
    { name: 'Shalini Modular Kitchens', phone: '9319500009', area: 'Dayalbagh', notes: 'Pays by UPI, asks for GST bill' },
    { name: 'Rakesh Verma', phone: '9456500010', area: 'Kamla Nagar', notes: '' },
    { name: 'Javed Interiors', phone: '', area: 'Tajganj', notes: 'Carpenter' },
    { name: 'Pawan Singh', phone: '9897500012', area: 'Rohta Bagh', notes: 'Household, got almirah made' },
    { name: 'Meena Decor', phone: '9456500013', area: 'Shahganj', notes: '' },
    // suppliers ("Dena hai" — we owe them; usually one main plywood trader,
    // a mica/laminate house, and a couple of hardware/fittings distributors)
    { name: 'Kumar Plywood Traders', phone: '9811100001', area: 'Delhi', notes: 'Main plywood supplier', kind: 'supplier' },
    { name: 'Sharma Mica House', phone: '', area: 'Agra', notes: '', kind: 'supplier' },
    { name: 'Agra Hardware & Fittings', phone: '9358100003', area: 'Agra', notes: 'Hinges, channels, handles, Fevicol', kind: 'supplier' },
    { name: 'Greenlam Agra Distributor', phone: '9319100004', area: 'Agra', notes: 'Laminate - weekly delivery van', kind: 'supplier' },
  ];
  const c = [];
  for (const p of people) c.push(await store.createCustomer(p));

  const add = (i, type, rupees, ago, note = '', method = '', billNo = '') =>
    store.createEntry({
      customerId: c[i].id, type, amountPaise: rupees * 100,
      date: daysAgo(ago) + 'T06:30:00.000Z', note, method, billNo,
    });

  // -- customers --
  await add(0, 'credit', 42000, 80, '18mm BWP ply x 12, hinges');
  await add(0, 'payment', 15000, 50, '', 'cash');
  await add(0, 'credit', 8500, 12, 'Fevicol, edge tape');

  await add(1, 'credit', 120000, 95, 'Mica sheets and 19mm boards');
  await add(1, 'payment', 40000, 40, '', 'upi');

  await add(2, 'credit', 6200, 5, 'Door handles x 20');

  await add(3, 'credit', 75000, 20, 'Kitchen material');
  await add(3, 'payment', 75000, 8, '', 'upi');

  await add(4, 'credit', 18000, 33, '12mm ply x 6');

  await add(5, 'credit', 64000, 70, '18mm MR ply x 10, Century laminate x 4');
  await add(5, 'payment', 20000, 55, '', 'cash');
  await add(5, 'credit', 31500, 25, 'Hinges, channels, lock set');
  await add(5, 'payment', 20000, 10, '', 'upi');

  await add(6, 'credit', 95000, 60, 'Sunmica full sheets x 8, pvc edge band');
  await add(6, 'payment', 50000, 30, '', 'upi');

  await add(7, 'credit', 310000, 50, '18mm BWP x 60, site delivery');
  await add(7, 'payment', 150000, 40, '', 'cash');
  await add(7, 'credit', 128000, 18, '12mm ply x 40');

  await add(8, 'credit', 54000, 22, 'Greenlam laminate x 6, Hettich channels');
  await add(8, 'payment', 54000, 9, '', 'upi');
  await add(8, 'credit', 39000, 3, 'Soft-close hinges x 30, Ebco handles');

  await add(9, 'credit', 11200, 14, 'Plywood offcuts, screws, Fevicol');

  const javedCredit = await add(10, 'credit', 26500, 28, 'Sunboard x 3, mica x 2');
  await add(10, 'credit', 4800, 27, 'Extra pvc edge tape', '', '');
  // customer disputed one line item, it was cancelled with a reason
  if (javedCredit && typeof store.voidEntry === 'function') {
    await store.voidEntry(javedCredit.id, { reason: 'Galat item daal diya tha, dobara likha', at: Date.now() });
  }

  await add(11, 'credit', 15800, 15, 'Almirah ke liye 18mm ply x 4, hinges');
  await add(11, 'payment', 10000, 6, '', 'cash');

  await add(12, 'credit', 22400, 7, 'Mica sheets x 3, fevicol');

  // -- suppliers: goods taken on credit (with bill numbers), paid a little at a time --
  await add(13, 'credit', 250000, 60, '18mm BWP x 80', '', 'INV-2041');
  await add(13, 'payment', 100000, 35, '', 'upi');
  await add(13, 'credit', 120000, 15, '12mm marine x 30', '', 'INV-2107');
  await add(13, 'payment', 50000, 6, '', 'upi');

  await add(14, 'credit', 90000, 45, 'Mica sheets', '', '1187/A');

  await add(15, 'credit', 38500, 28, 'Hinges, channels, handles, Fevicol carton', '', 'AHF-884');
  await add(15, 'payment', 20000, 14, '', 'cash');
  await add(15, 'credit', 15200, 4, 'Lock sets, screws assorted', '', 'AHF-902');

  await add(16, 'credit', 168000, 50, 'Laminate sheets, mixed finish x 40', '', 'GL-3310');
  await add(16, 'payment', 80000, 20, '', 'upi');
  await add(16, 'credit', 72000, 5, 'Laminate sheets x 18', '', 'GL-3366');
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
