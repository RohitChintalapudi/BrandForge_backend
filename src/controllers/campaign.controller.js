const Campaign = require("../models/Campaign");
const Submission = require("../models/Submission");
const {
  getPaginationOptions,
  buildPaginationMetadata,
  escapeRegex,
} = require("../utils/queryHelper");

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
    const { page, limit, skip } = getPaginationOptions(req.query, 10, 50);
    const { search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Base filter: Approved campaigns OR campaigns owned by requesting brand/admin
    const baseCondition =
      req.user.role === "admin"
        ? {}
        : { $or: [{ status: "approved" }, { brand: req.user.id }] };

    const queryFilter = { ...baseCondition };

    // Specific status filter (e.g. status=approved or status=pending)
    if (status) {
      queryFilter.status = status;
    }

    // Search filter across title and description
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      queryFilter.$and = queryFilter.$and || [];
      queryFilter.$and.push({
        $or: [
          { title: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    const sortConfig = {};
    const validSortFields = ["createdAt", "deadline", "title"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortConfig[sortField] = sortOrder === "asc" ? 1 : -1;

    const [campaigns, totalCount] = await Promise.all([
      Campaign.find(queryFilter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .populate("brand", "name email"),
      Campaign.countDocuments(queryFilter),
    ]);

    const pagination = buildPaginationMetadata(totalCount, page, limit);

    // If request includes query params like page or search, return structured response
    if (req.query.page || req.query.limit || req.query.search || req.query.status) {
      return res.json({
        data: campaigns,
        pagination,
      });
    }

    // Backwards compatibility with frontend direct array expectations
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

exports.updateCampaign = async (req, res) => {
  try {
    const { title, description, reward, deadline } = req.body;

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const isOwner = campaign.brand.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to edit this campaign" });
    }

    if (campaign.status === "completed" || campaign.status === "rejected") {
      return res.status(400).json({
        message: `Cannot edit a ${campaign.status} campaign`,
      });
    }

    if (title) campaign.title = String(title).trim();
    if (description) campaign.description = String(description).trim();
    if (reward) campaign.reward = String(reward).trim();

    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime()) || parsedDeadline.getTime() <= Date.now()) {
        return res.status(400).json({
          message: "Updated deadline must be a valid future date",
        });
      }
      campaign.deadline = parsedDeadline;
    }

    await campaign.save();

    res.json({ message: "Campaign updated successfully", campaign });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to update campaign" });
  }
};

exports.completeCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const isOwner = campaign.brand.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to complete this campaign" });
    }

    if (campaign.status === "completed") {
      return res.status(400).json({ message: "Campaign is already marked as completed" });
    }

    campaign.status = "completed";
    await campaign.save();

    res.json({ message: "Campaign marked as completed", campaign });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete campaign" });
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
