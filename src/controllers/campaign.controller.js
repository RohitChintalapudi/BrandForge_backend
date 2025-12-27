const Campaign = require("../models/Campaign");

exports.createCampaign = async (req, res) => {
  const campaign = await Campaign.create({
    ...req.body,
    brand: req.user.id,
  });
  res.status(201).json(campaign);
};

exports.getAllCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ status: "approved" });
  res.json(campaigns);
};

exports.approveCampaign = async (req, res) => {
  await Campaign.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ message: "Campaign approved" });
};
