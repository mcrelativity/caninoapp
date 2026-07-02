const { validateEmail, validatePassword } = require("../utils/validators");

describe("validateEmail", () => {
  test("accepts a well-formed email", () => {
    expect(validateEmail("usuario@example.com")).toBe(true);
  });

  test("rejects an email without domain", () => {
    expect(validateEmail("usuario@")).toBe(false);
  });

  test("rejects an email without @", () => {
    expect(validateEmail("usuario.example.com")).toBe(false);
  });
});

describe("validatePassword", () => {
  test("accepts a password with 8+ chars, uppercase and digit", () => {
    expect(validatePassword("Password1")).toBe(true);
  });

  test("rejects a password shorter than 8 characters", () => {
    expect(validatePassword("Pass1")).toBe(false);
  });

  test("rejects a password without an uppercase letter", () => {
    expect(validatePassword("password1")).toBe(false);
  });

  test("rejects a password without a digit", () => {
    expect(validatePassword("Password")).toBe(false);
  });
});
