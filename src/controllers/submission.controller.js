const Submission = require("../models/Submission");

exports.createSubmission = async (req, res) => {
  const { campaignId, contentUrl } = req.body;

  if (!contentUrl.startsWith("http")) {
    return res.status(400).json({ message: "Invalid URL" });
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
