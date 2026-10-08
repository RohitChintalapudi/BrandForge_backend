const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const { authLimiter } = require("../middleware/rateLimiter.middleware");
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;
