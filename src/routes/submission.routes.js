const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createSubmission,
  selectWinner,
} = require("../controllers/submission.controller");

router.post("/", auth, role(["creator"]), createSubmission);
router.put("/:id/winner", auth, role(["brand"]), selectWinner);

module.exports = router;
