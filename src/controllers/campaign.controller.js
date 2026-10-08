const Campaign = require("../models/Campaign");
const Submission = require("../models/Submission");

exports.createCampaign = async (req, res) => {
  try {
    const { title, description, reward, deadline } = req.body;

    if (!title || !description || !reward || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date format" });
    }

    // Ensure deadline is in the future (minimum 1 hour ahead)
    const minFutureTime = Date.now() + 60 * 60 * 1000;
    if (parsedDeadline.getTime() <= minFutureTime) {
      return res.status(400).json({
        message: "Campaign deadline must be at least 1 hour in the future",
      });
    }

    const campaign = await Campaign.create({
      title: title.trim(),
      description: description.trim(),
      reward: reward.trim(),
      deadline: parsedDeadline,
      brand: req.user.id,
      status: "pending",
    });

    res.status(201).json(campaign);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to create campaign" });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    // Return all approved campaigns OR campaigns owned by the requesting brand user
    const campaigns = await Campaign.find({
      $or: [{ status: "approved" }, { brand: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate("brand", "name email");

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "brand",
      "name email"
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Only approved campaigns or campaigns viewed by their creator/admin are accessible
    const isOwner = campaign.brand._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (campaign.status !== "approved" && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied to pending campaign" });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaign details" });
  }
};

exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "approved") {
      return res
        .status(400)
        .json({ message: "Campaign is already approved" });
    }

    if (new Date(campaign.deadline) <= new Date()) {
      return res.status(400).json({
        message: "Cannot approve a campaign whose deadline has already passed",
      });
    }

    campaign.status = "approved";
    await campaign.save();

    res.json({ message: "Campaign approved successfully", campaign });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to approve campaign" });
  }
};

exports.rejectCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "rejected") {
      return res
        .status(400)
        .json({ message: "Campaign is already rejected" });
    }

    campaign.status = "rejected";
    await campaign.save();

    res.json({ message: "Campaign rejected successfully", campaign });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject campaign" });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (
      campaign.brand.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this campaign" });
    }

    // Check if campaign already has submissions before deleting
    const submissionsCount = await Submission.countDocuments({
      campaign: campaign._id,
    });
    if (submissionsCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete campaign with existing submissions. Consider marking it completed instead.",
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};
