const router = require("express").Router();
const Submission = require("../models/Submission");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  createSubmission,
  selectWinner,
} = require("../controllers/submission.controller");

router.post("/", auth, role(["creator"]), createSubmission);

router.put("/:id/winner", auth, role(["brand"]), selectWinner);

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

router.get("/my-wins", auth, role(["creator"]), async (req, res) => {
  const wins = await Submission.find({
    creator: req.user.id,
    status: "winner",
  }).populate("campaign", "title");

  res.json(wins);
});

router.get("/mine", auth, role(["creator"]), async (req, res) => {
  const subs = await Submission.find({
    creator: req.user.id,
  });

  res.json(subs);
});

module.exports = router;
