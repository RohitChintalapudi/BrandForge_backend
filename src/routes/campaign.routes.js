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

// Brand creates campaign
router.post("/", authMiddleware, roleMiddleware(["brand"]), createCampaign);

// Creator gets approved campaigns
router.get("/", authMiddleware, getAllCampaigns);

// Admin gets pending campaigns
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const campaigns = await Campaign.find({ status: "pending" });
    res.json(campaigns);
  }
);

// Admin approves campaign
router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  approveCampaign
);

module.exports = router;
