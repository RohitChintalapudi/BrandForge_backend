import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  createCampaign,
  getAllCampaigns,
  approveCampaign,
} from "../controllers/campaign.controller.js";
import Campaign from "../models/Campaign.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["brand"]), createCampaign);
router.get("/", authMiddleware, getAllCampaigns);

// 👇 ADD THIS (admin only)
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

export default router;
