const Campaign = require("../models/Campaign");

exports.createCampaign = async (req, res) => {
  try {
    const { title, description, reward, deadline } = req.body;

    if (!title || !description || !reward || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const campaign = await Campaign.create({
      title,
      description,
      reward,
      deadline,
      brand: req.user.id,
      status: "pending",
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to create campaign" });
  }
};
exports.getAllCampaigns = async (req, res) => {
  try {
    // Return all approved campaigns OR campaigns owned by the requesting brand user
    const campaigns = await Campaign.find({
      $or: [
        { status: "approved" },
        { brand: req.user.id }
      ]
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};
exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    campaign.status = "approved";
    await campaign.save();

    res.json({ message: "Campaign approved" });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve campaign" });
  }
};
