const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {
  createCampaign,
  getAllCampaigns,
  approveCampaign,
} = require("../controllers/campaign.controller");

const Campaign = require("../models/Campaign");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["brand"]), createCampaign);

router.get("/", authMiddleware, getAllCampaigns);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const campaigns = await Campaign.find({ status: "pending" });
    res.json(campaigns);
  }
);

router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  approveCampaign
);

module.exports = router;
