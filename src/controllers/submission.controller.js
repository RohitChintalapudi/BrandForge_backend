const Submission = require("../models/Submission");
const Campaign = require("../models/Campaign");

exports.createSubmission = async (req, res) => {
  try {
    const { campaignId, contentUrl } = req.body;

    if (!campaignId || !contentUrl) {
      return res
        .status(400)
        .json({ message: "Campaign ID and Content URL are required" });
    }

    const trimmedUrl = String(contentUrl).trim();

    // 1. Verify Campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // 2. Verify Campaign is approved
    if (campaign.status !== "approved") {
      return res.status(400).json({
        message: `Submissions are not allowed for ${campaign.status} campaigns`,
      });
    }

    // 3. Verify Campaign deadline has not passed
    if (new Date(campaign.deadline) <= new Date()) {
      return res.status(400).json({
        message: "Campaign deadline has passed. Submissions are closed.",
      });
    }

    // 4. Prevent brand from submitting to their own campaign
    if (campaign.brand.toString() === req.user.id) {
      return res.status(400).json({
        message: "Brand owners cannot submit entries to their own campaigns",
      });
    }

    // 5. Check if user already submitted for this campaign
    const existing = await Submission.findOne({
      campaign: campaignId,
      creator: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already submitted an entry for this campaign",
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
        message: "You have already submitted an entry for this campaign",
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
    const submission = await Submission.findById(req.params.id).populate(
      "campaign"
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const campaign = submission.campaign;
    if (!campaign) {
      return res
        .status(404)
        .json({ message: "Associated campaign not found" });
    }

    // Authorization check: Only the brand that created the campaign or an admin can select the winner
    const isBrandOwner = campaign.brand.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isBrandOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Unauthorized: You can only select winners for your own campaigns",
      });
    }

    if (submission.status === "winner") {
      return res.status(400).json({
        message: "This submission has already been selected as a winner",
      });
    }

    submission.status = "winner";
    submission.reviewedAt = new Date();
    await submission.save();

    res.json({ message: "Winner selected successfully", submission });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to select winner" });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const { feedback, status } = req.body;

    const submission = await Submission.findById(req.params.id).populate("campaign");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const campaign = submission.campaign;
    const isBrandOwner = campaign && campaign.brand.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isBrandOwner && !isAdmin) {
      return res.status(403).json({
        message: "Unauthorized: You can only review submissions for your own campaigns",
      });
    }

    if (status && !["pending", "rejected", "winner"].includes(status)) {
      return res.status(400).json({ message: "Invalid submission review status" });
    }

    if (feedback !== undefined) {
      submission.feedback = String(feedback).trim();
    }

    if (status) {
      submission.status = status;
    }

    submission.reviewedAt = new Date();
    await submission.save();

    res.json({ message: "Submission review updated successfully", submission });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to update submission review" });
  }
};
