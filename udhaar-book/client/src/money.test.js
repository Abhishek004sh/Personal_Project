import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRupeesToPaise, formatRupees, formatDate, whatsappLink } from './money.js';

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

test('formatDate: Hindi month names only in Hindi, same day in every language', () => {
  const iso = '2026-08-15T06:30:00Z';
  assert.equal(formatDate(iso), '15 Aug 2026');
  assert.equal(formatDate(iso, 'hinglish'), '15 Aug 2026');
  assert.match(formatDate(iso, 'hi'), /[ऀ-ॿ]/);
  assert.match(formatDate(iso, 'hi'), /15/);
  assert.equal(formatDate(''), '');
});

test('whatsappLink needs a 10 digit number and encodes the text', () => {
  assert.equal(whatsappLink('', 'hi'), null);
  assert.equal(whatsappLink('12345', 'hi'), null);
  assert.equal(whatsappLink('98765 43210', 'a b'), 'https://wa.me/919876543210?text=a%20b');
});
