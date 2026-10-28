import test from 'node:test';
import assert from 'node:assert/strict';
import { DICTIONARIES, LANGS, t, setLang, getLang } from './strings.js';

test('all three languages have exactly the same words', () => {
  const keysOf = (lang) => Object.keys(DICTIONARIES[lang]).sort();
  assert.deepEqual(keysOf('hi'), keysOf('en'));
  assert.deepEqual(keysOf('hinglish'), keysOf('en'));
});

test('a word that is a function in English is a function in every language', () => {
  for (const [key, value] of Object.entries(DICTIONARIES.en)) {
    for (const lang of LANGS) {
      assert.equal(typeof DICTIONARIES[lang][key], typeof value, `${lang}.${key}`);
    }
  }
});

test('no word is left empty', () => {
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(DICTIONARIES[lang])) {
      if (typeof value === 'string') assert.ok(value.trim().length > 0, `${lang}.${key}`);
    }
  }
});

test('hindi words really are in Devanagari', () => {
  assert.match(DICTIONARIES.hi.gotPayment, /[ऀ-ॿ]/);
  assert.match(DICTIONARIES.hi.appName, /[ऀ-ॿ]/);
  assert.doesNotMatch(DICTIONARIES.hinglish.gotPayment, /[ऀ-ॿ]/);
});

test('switching language changes what t returns', () => {
  setLang('en');
  assert.equal(getLang(), 'en');
  assert.equal(t.gotPayment, 'Got payment');
  setLang('hinglish');
  assert.equal(t.gotPayment, 'Paisa mila');
  setLang('hi');
  assert.equal(t.gotPayment, 'पैसा मिला');
  setLang('klingon'); // ignored
  assert.equal(getLang(), 'hi');
});

test('days wording in each language', () => {
  setLang('en');
  assert.deepEqual([t.days(0), t.days(1), t.days(45), t.days(95), t.days(null)], ['today', '1 day', '45 days', '3 months', '']);
  setLang('hinglish');
  assert.deepEqual([t.days(0), t.days(1), t.days(45), t.days(95)], ['aaj', '1 din', '45 din', '3 mahine']);
  setLang('hi');
  assert.deepEqual([t.days(0), t.days(1), t.days(45), t.days(95)], ['आज', '1 दिन', '45 दिन', '3 महीने']);
});

test('sentences with a number or name', () => {
  setLang('hi');
  assert.equal(t.customersOwing(1), '1 ग्राहक का पैसा बाकी है');
  assert.equal(t.customersOwing(3), '3 ग्राहकों का पैसा बाकी है');
  assert.match(t.reminderMessage('रमेश', '₹500'), /रमेश जी.*₹500/);
  setLang('hinglish');
  assert.equal(t.since(t.days(45)), '45 din se');
});
