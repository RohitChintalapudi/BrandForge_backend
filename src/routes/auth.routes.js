const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const { register, login, logout } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
  });
});

module.exports = router;
