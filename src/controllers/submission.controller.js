const Submission = require("../models/Submission");

exports.createSubmission = async (req, res) => {
  try {
    const { campaignId, contentUrl } = req.body;

    if (!campaignId || !contentUrl) {
      return res
        .status(400)
        .json({ message: "Campaign ID and Content URL are required" });
    }

    const trimmedUrl = String(contentUrl).trim();

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
      contentUrl: trimmedUrl,
    });

    res.status(201).json(submission);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted for this campaign",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to create submission" });
  }
};

exports.selectWinner = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status: "winner" },
      { new: true, runValidators: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({ message: "Winner selected", submission });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to select winner" });
  }
};
