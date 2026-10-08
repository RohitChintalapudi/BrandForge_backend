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
    try {
      const campaigns = await Campaign.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .populate("brand", "name email");
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending campaigns" });
    }
  }
);

router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  approveCampaign
);

module.exports = router;
