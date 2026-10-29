// Clicks through the real screens against the real server code
// (with the in-memory store), in a simulated browser.

import { createRequire } from 'node:module';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from './App.jsx';
import { setLang } from './strings.js';

const require = createRequire(import.meta.url);
const { createApp } = require('../../server/src/app.js');
const { createMemoryStore } = require('../../server/src/stores/memoryStore.js');

const PASSWORD = 'shop-password-1';
let server;
let base;
const realFetch = globalThis.fetch;

beforeAll(async () => {
  const app = createApp({
    store: createMemoryStore(),
    config: { jwtSecret: 'y'.repeat(40), adminPassword: PASSWORD, loginAttemptLimit: 1000 },
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  // The app calls "/api/..." with no host; point those calls at the test server.
  globalThis.fetch = (url, opts) => realFetch(typeof url === 'string' && url.startsWith('/') ? base + url : url, opts);
  window.fetch = globalThis.fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
  server.close();
});

beforeEach(() => {
  cleanup();
  localStorage.clear();
  setLang('en'); // the app opens in Hinglish; these tests look for English words
  window.history.pushState({}, '', '/');
});

const money = (text) => text.replace(/\s/g, '');

async function logIn(user) {
  render(<App />);
  await user.type(await screen.findByLabelText('Password'), PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByRole('navigation', { name: 'Main' });
}

describe('Udhaar Book screens', () => {
  it('refuses a wrong password and accepts the right one', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password');
    expect(localStorage.getItem('udhaar_token')).toBeNull();

    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('No customers yet. Add the first one to start.')).toBeInTheDocument();
    expect(localStorage.getItem('udhaar_token')).toBeTruthy();
  });

  it('full flow: add customer, give credit, take payment, cancel entry', async () => {
    const user = userEvent.setup();
    await logIn(user);

    // Add a customer from the empty home screen
    await user.click(await screen.findByRole('link', { name: 'Add customer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add customer' });
    await user.type(within(dialog).getByLabelText('Name'), 'Ramesh Sharma');
    await user.type(within(dialog).getByLabelText('Phone (10 digits)'), '98765 43210');
    await user.type(within(dialog).getByLabelText('Area'), 'Rohta Bagh');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    // Lands on the customer page, settled
    expect(await screen.findByRole('heading', { name: 'Ramesh Sharma' })).toBeInTheDocument();
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+919876543210');
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument(); // nothing pending yet

    // Give goods on credit: 2,500
    await user.click(screen.getByRole('button', { name: 'Gave goods (credit)' }));
    let sheet = await screen.findByRole('dialog', { name: 'Gave goods (credit)' });
    await user.type(within(sheet).getByLabelText('Amount (₹)'), '2,500');
    await user.type(within(sheet).getByLabelText('What was given (optional)'), '18mm ply x 5');
    expect(money(within(sheet).getByText(/Balance after this/).textContent)).toContain('₹2,500');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(money(document.querySelector('.balance-amount').textContent)).toBe('₹2,500');
    expect(screen.getByText(/18mm ply x 5/)).toBeInTheDocument();

    // WhatsApp button now exists and only opens a ready message (nothing auto-sent)
    const wa = screen.getByRole('link', { name: 'WhatsApp' });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(wa.getAttribute('href'))).toContain('Ramesh Sharma');

    // Take a payment of 1,000 by UPI
    await user.click(screen.getByRole('button', { name: 'Got payment' }));
    sheet = await screen.findByRole('dialog', { name: 'Got payment' });
    await user.type(within(sheet).getByLabelText('Amount (₹)'), '1000');
    await user.click(within(sheet).getByText('UPI'));
    expect(money(within(sheet).getByText(/Balance after this/).textContent)).toContain('₹1,500');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(money(document.querySelector('.balance-amount').textContent)).toBe('₹1,500'));
    expect(screen.getByText(/Payment received · UPI/)).toBeInTheDocument();

    // Cancel the payment (entered by mistake) -> balance goes back, history kept
    const paymentRow = screen.getByText(/Payment received/).closest('li');
    await user.click(within(paymentRow).getByRole('button', { name: 'Cancel entry' }));
    sheet = await screen.findByRole('dialog', { name: 'Cancel this entry?' });
    await user.type(within(sheet).getByLabelText('Reason'), 'entered by mistake');
    await user.click(within(sheet).getByRole('button', { name: 'Cancel entry' }));
    await waitFor(() => expect(money(document.querySelector('.balance-amount').textContent)).toBe('₹2,500'));
    expect(screen.getByText(/Cancelled: entered by mistake/)).toBeInTheDocument();
    expect(document.querySelectorAll('.history li.voided')).toHaveLength(1);
  });

  it('rejects a bad amount without calling the server', async () => {
    const user = userEvent.setup();
    await logIn(user);
    // The previous test created a customer in the same in-memory store
    await user.click(screen.getByRole('link', { name: 'Customers' }));
    await user.click(await screen.findByRole('link', { name: /Ramesh Sharma/ }));
    await user.click(await screen.findByRole('button', { name: 'Got payment' }));
    const sheet = await screen.findByRole('dialog');
    await user.type(within(sheet).getByLabelText('Amount (₹)'), '12.345');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent(/Enter the amount in rupees/);
  });

  it('home shows the pending total; customers can be searched', async () => {
    const user = userEvent.setup();
    await logIn(user);

    // Home: dashboard figures from the earlier flow (₹2,500 pending)
    expect(await screen.findByText('To receive')).toBeInTheDocument();
    expect(money(document.querySelector('.hero-card.receive .hero-amount').textContent)).toBe('₹2,500');
    expect(screen.getByText('1 customer owes money')).toBeInTheDocument();
    expect(money(document.querySelector('.hero-card.pay .hero-amount').textContent)).toBe('₹0'); // no suppliers yet

    await user.click(screen.getByRole('link', { name: 'Customers' }));
    expect(await screen.findByRole('link', { name: /Ramesh Sharma/ })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(await screen.findByText('No customers match your search.')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'rohta');
    expect(await screen.findByRole('link', { name: /Ramesh Sharma/ })).toBeInTheDocument();
  });

  it('suppliers: own section, maal liya with bill number, paisa diya, home card, bill search', async () => {
    const user = userEvent.setup();
    await logIn(user);
    const nav = screen.getByRole('navigation', { name: 'Main' });

    // Suppliers tab starts empty
    await user.click(within(nav).getByRole('link', { name: 'Suppliers' }));
    expect(await screen.findByText('No suppliers yet. Add the first one.')).toBeInTheDocument();

    // Add a supplier
    await user.click(screen.getByRole('button', { name: 'Add supplier' }));
    let sheet = await screen.findByRole('dialog', { name: 'Add supplier' });
    await user.type(within(sheet).getByLabelText('Name'), 'Kumar Plywood Traders');
    await user.type(within(sheet).getByLabelText('Phone (10 digits)'), '9811122233');
    await user.type(within(sheet).getByLabelText('Area'), 'Delhi');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));

    // Their page: nothing owed, no reminder (we do not remind suppliers), own buttons
    expect(await screen.findByRole('heading', { name: 'Kumar Plywood Traders' })).toBeInTheDocument();
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Suppliers' })).toHaveAttribute('href', '/suppliers'); // back link, not the tab
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument();

    // Maal liya on credit, with a bill number
    await user.click(screen.getByRole('button', { name: 'Took goods (credit)' }));
    sheet = await screen.findByRole('dialog', { name: 'Took goods (credit)' });
    await user.type(within(sheet).getByLabelText('Amount (₹)'), '50,000');
    await user.type(within(sheet).getByLabelText('Bill number (optional)'), 'INV-2041');
    await user.type(within(sheet).getByLabelText('What was taken (optional)'), '18mm BWP x 40');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(money(document.querySelector('.balance-amount').textContent)).toBe('₹50,000'));
    expect(screen.getByText('To pay')).toBeInTheDocument();
    expect(screen.getByText('Goods taken on credit')).toBeInTheDocument();
    expect(screen.getByText(/Bill: INV-2041/)).toBeInTheDocument();
    expect(screen.getByText('No payment made yet')).toBeInTheDocument();

    // Paisa diya by UPI: no bill number box for a payment
    await user.click(screen.getByRole('button', { name: 'Made payment' }));
    sheet = await screen.findByRole('dialog', { name: 'Made payment' });
    expect(within(sheet).queryByLabelText('Bill number (optional)')).not.toBeInTheDocument();
    await user.type(within(sheet).getByLabelText('Amount (₹)'), '15000');
    await user.click(within(sheet).getByText('UPI'));
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(money(document.querySelector('.balance-amount').textContent)).toBe('₹35,000'));
    expect(screen.getByText('Last paid today')).toBeInTheDocument();
    expect(screen.getByText(/Payment made · UPI/)).toBeInTheDocument();

    // Home: the "To pay" card shows what we owe, the "To receive" card is untouched
    await user.click(within(nav).getByRole('link', { name: 'Home' }));
    expect(await screen.findByText('To pay')).toBeInTheDocument();
    await waitFor(() =>
      expect(money(document.querySelector('.hero-card.pay .hero-amount').textContent)).toBe('₹35,000')
    );
    expect(screen.getByText('1 supplier to be paid')).toBeInTheDocument();
    expect(money(document.querySelector('.hero-card.receive .hero-amount').textContent)).toBe('₹2,500');

    // Search the supplier list by bill number
    await user.click(within(nav).getByRole('link', { name: 'Suppliers' }));
    const box = await screen.findByRole('searchbox');
    await user.type(box, 'inv-2041');
    expect(await screen.findByRole('link', { name: /Kumar Plywood Traders/ })).toBeInTheDocument();
    await user.clear(box);
    await user.type(box, 'zzz');
    expect(await screen.findByText('No suppliers match your search.')).toBeInTheDocument();

    // The supplier is not in the customers list
    await user.click(within(nav).getByRole('link', { name: 'Customers' }));
    expect(await screen.findByRole('link', { name: /Ramesh Sharma/ })).toBeInTheDocument();
    expect(screen.queryByText('Kumar Plywood Traders')).not.toBeInTheDocument();
  });

  it('language button goes Hinglish -> Hindi -> English, remembers the choice, and works after login', async () => {
    const user = userEvent.setup();
    setLang('hinglish');
    render(<App />);

    // Login screen in Hinglish
    expect(await screen.findByRole('button', { name: 'Log in karein' })).toBeInTheDocument();

    // -> Hindi
    await user.click(screen.getByRole('button', { name: 'Bhasha badlein' }));
    expect(await screen.findByRole('button', { name: 'लॉग इन करें' })).toBeInTheDocument();
    expect(localStorage.getItem('udhaar_lang')).toBe('hi');
    expect(document.documentElement.lang).toBe('hi');

    // -> English
    await user.click(screen.getByRole('button', { name: 'भाषा बदलें' }));
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('udhaar_lang')).toBe('en');

    // -> back to Hinglish, then log in
    await user.click(screen.getByRole('button', { name: 'Change language' }));
    await user.type(await screen.findByLabelText('Password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Log in karein' }));
    await screen.findByRole('navigation', { name: 'Main' });

    // Switch to Hindi inside the app: the tab bar and the customer list change words
    await user.click(screen.getByRole('button', { name: 'Bhasha badlein' }));
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'ग्राहक' })).toBeInTheDocument();
    await user.click(within(nav).getByRole('link', { name: 'ग्राहक' }));
    expect(await screen.findByPlaceholderText('नाम, फ़ोन या इलाका खोजें')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ग्राहक जोड़ें' })).toBeInTheDocument();
  });

  it('logging out returns to the login screen and drops the saved login', async () => {
    const user = userEvent.setup();
    await logIn(user);
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByLabelText('Password')).toBeInTheDocument();
    expect(localStorage.getItem('udhaar_token')).toBeNull();
  });
});
