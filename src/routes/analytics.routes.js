const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  getAdminStats,
  getBrandStats,
  getCreatorStats,
} = require("../controllers/analytics.controller");

// Admin platform metrics
router.get("/admin", auth, role(["admin"]), getAdminStats);

// Brand dashboard metrics
router.get("/brand", auth, role(["brand"]), getBrandStats);

// Creator statistics & win rates
router.get("/creator", auth, role(["creator"]), getCreatorStats);

module.exports = router;
