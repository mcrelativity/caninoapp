const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const validateEmail = (email) => emailRegex.test(email);

const validatePassword = (password) => passwordRegex.test(password);

module.exports = {
  validateEmail,
  validatePassword
};
