const Submission = require("../models/Submission");
exports.createSubmission = async (req, res) => {
  const { campaignId, contentUrl } = req.body;

  if (!contentUrl.startsWith("http")) {
    return res.status(400).json({ message: "Invalid URL" });
  }

  // 🔒 CHECK: already submitted?
  const existing = await Submission.findOne({
    campaign: campaignId,
    creator: req.user.id,
  });

  if (existing) {
    return res.status(400).json({
      message: "You have already submitted for this campaign",
    });
  }

  const submission = await Submission.create({
    campaign: campaignId,
    creator: req.user.id,
    contentUrl,
  });

  res.status(201).json(submission);
};



exports.selectWinner = async (req, res) => {
  await Submission.findByIdAndUpdate(req.params.id, { status: "winner" });
  res.json({ message: "Winner selected" });
};
