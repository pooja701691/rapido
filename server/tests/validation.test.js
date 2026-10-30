const assert = require('node:assert/strict');
const {
  normalizeEmail,
  normalizePhone,
  isValidEmail,
  isValidPhone,
  isValidPassword,
} = require('../src/utils/validation');

assert.equal(normalizeEmail('  Rider@Example.COM '), 'rider@example.com');
assert.equal(normalizePhone('+91 98765 43210'), '919876543210');
assert.equal(isValidEmail('rider@example.com'), true);
assert.equal(isValidEmail('invalid-email'), false);
assert.equal(isValidPhone('9876543210'), true);
assert.equal(isValidPhone('98765'), false);
assert.equal(isValidPassword('secure123'), true);
assert.equal(isValidPassword('12345'), false);
assert.equal(isValidPassword('a'.repeat(129)), false);

console.log('Validation utility tests passed');
