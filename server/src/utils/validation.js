const normalizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const normalizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
};

const isValidEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail);
};

const isValidPhone = (phone) => /^[0-9]{10}$/.test(normalizePhone(phone));

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
};

module.exports = {
  normalizeEmail,
  normalizePhone,
  isValidEmail,
  isValidPhone,
  isValidPassword,
};
