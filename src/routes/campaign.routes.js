const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");

const {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  approveCampaign,
  rejectCampaign,
  deleteCampaign,
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

router.get("/:id", authMiddleware, validateObjectId(["id"]), getCampaignById);

router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateObjectId(["id"]),
  approveCampaign
);

router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateObjectId(["id"]),
  rejectCampaign
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["brand", "admin"]),
  validateObjectId(["id"]),
  deleteCampaign
);

module.exports = router;
