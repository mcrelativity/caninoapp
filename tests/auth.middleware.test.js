process.env.JWT_SECRET = "test_secret_for_ci";

const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authMiddleware", () => {
  test("rejects requests without an Authorization header", () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects an invalid or expired token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } };
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("populates req.user and calls next() for a valid token", () => {
    const token = jwt.sign({ sub: 42, email: "usuario@example.com" }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 42, email: "usuario@example.com" });
  });
});
