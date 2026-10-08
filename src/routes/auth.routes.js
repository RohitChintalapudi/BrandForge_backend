const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;
