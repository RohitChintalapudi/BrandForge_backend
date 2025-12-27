const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const {
  createCampaign,
  getAllCampaigns,
  approveCampaign,
} = require("../controllers/campaign.controller");

router.post("/", auth, role(["brand"]), createCampaign);
router.get("/", getAllCampaigns);
router.put("/:id/approve", auth, role(["admin"]), approveCampaign);

module.exports = router;
