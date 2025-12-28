const router = require("express").Router();
const Submission = require("../models/Submission");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  createSubmission,
  selectWinner,
} = require("../controllers/submission.controller");

// Creator submits content
router.post("/", auth, role(["creator"]), createSubmission);

// Brand selects winner
router.put("/:id/winner", auth, role(["brand"]), selectWinner);

// Brand: get submissions for a campaign
router.get("/campaign/:campaignId", auth, role(["brand"]), async (req, res) => {
  try {
    const submissions = await Submission.find({
      campaign: req.params.campaignId,
    }).populate("creator", "name email");

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

module.exports = router;
