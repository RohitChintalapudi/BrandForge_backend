const router = require("express").Router();
const Submission = require("../models/Submission");
const Campaign = require("../models/Campaign");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId.middleware");
const {
  createSubmission,
  selectWinner,
} = require("../controllers/submission.controller");

router.post("/", auth, role(["creator"]), createSubmission);

router.put(
  "/:id/winner",
  auth,
  role(["brand", "admin"]),
  validateObjectId(["id"]),
  selectWinner
);

router.get(
  "/campaign/:campaignId",
  auth,
  role(["brand", "admin"]),
  validateObjectId(["campaignId"]),
  async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Check ownership: Only the campaign owner or an admin can view campaign submissions
      const isBrandOwner = campaign.brand.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isBrandOwner && !isAdmin) {
        return res.status(403).json({
          message: "Unauthorized: You can only view submissions for your own campaigns",
        });
      }

      const submissions = await Submission.find({
        campaign: req.params.campaignId,
      })
        .sort({ createdAt: -1 })
        .populate("creator", "name email");

      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  }
);

router.get("/my-wins", auth, role(["creator"]), async (req, res) => {
  try {
    const wins = await Submission.find({
      creator: req.user.id,
      status: "winner",
    })
      .sort({ createdAt: -1 })
      .populate("campaign", "title reward deadline status");

    res.json(wins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch winning submissions" });
  }
});

router.get("/mine", auth, role(["creator"]), async (req, res) => {
  try {
    const subs = await Submission.find({
      creator: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("campaign", "title reward deadline status");

    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your submissions" });
  }
});

module.exports = router;
