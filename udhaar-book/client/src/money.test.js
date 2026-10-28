import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRupeesToPaise, formatRupees, daysText, whatsappLink } from './money.js';

test('parseRupeesToPaise reads normal amounts', () => {
  assert.equal(parseRupeesToPaise('1500'), 150000);
  assert.equal(parseRupeesToPaise('1,500'), 150000);
  assert.equal(parseRupeesToPaise('₹ 1,50,000'), 15000000);
  assert.equal(parseRupeesToPaise('1500.5'), 150050);
  assert.equal(parseRupeesToPaise('1500.05'), 150005);
  assert.equal(parseRupeesToPaise('0.50'), 50);
});

test('parseRupeesToPaise has no floating point surprises', () => {
  assert.equal(parseRupeesToPaise('19.99'), 1999);
  assert.equal(parseRupeesToPaise('1.15'), 115);
  assert.equal(parseRupeesToPaise('0.29'), 29);
});

test('parseRupeesToPaise refuses bad input', () => {
  for (const bad of ['', 'abc', '0', '0.00', '-5', '12.345', '1e5', '10,00,00,000', null, undefined, 5]) {
    assert.equal(parseRupeesToPaise(bad), null, String(bad));
  }
});

test('formatRupees uses Indian grouping', () => {
  assert.equal(formatRupees(15000000).replace(/\s/g, ''), '₹1,50,000');
  assert.equal(formatRupees(150050).replace(/\s/g, ''), '₹1,500.50');
  assert.equal(formatRupees(0).replace(/\s/g, ''), '₹0');
});

test('daysText', () => {
  assert.equal(daysText(0), 'today');
  assert.equal(daysText(1), '1 day');
  assert.equal(daysText(45), '45 days');
  assert.equal(daysText(95), '3 months');
  assert.equal(daysText(null), '');
});

test('whatsappLink needs a 10 digit number and encodes the text', () => {
  assert.equal(whatsappLink('', 'hi'), null);
  assert.equal(whatsappLink('12345', 'hi'), null);
  assert.equal(whatsappLink('98765 43210', 'a b'), 'https://wa.me/919876543210?text=a%20b');
});
