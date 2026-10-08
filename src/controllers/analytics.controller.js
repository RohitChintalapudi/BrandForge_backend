const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Submission = require("../models/Submission");

/**
 * Returns platform-level overview statistics for Admins
 */
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      campaignsByStatus,
      totalSubmissions,
      totalWinners,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Campaign.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Submission.countDocuments(),
      Submission.countDocuments({ status: "winner" }),
    ]);

    const roleBreakdown = usersByRole.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { brand: 0, creator: 0, admin: 0 });

    const statusBreakdown = campaignsByStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    res.json({
      users: {
        total: totalUsers,
        breakdown: roleBreakdown,
      },
      campaigns: {
        total: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
        breakdown: statusBreakdown,
      },
      submissions: {
        total: totalSubmissions,
        winners: totalWinners,
        winRatePercent: totalSubmissions > 0
          ? ((totalWinners / totalSubmissions) * 100).toFixed(2)
          : "0.00",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to aggregate admin analytics" });
  }
};

/**
 * Returns performance metrics for a specific brand user
 */
exports.getBrandStats = async (req, res) => {
  try {
    const brandId = req.user.id;

    const brandCampaigns = await Campaign.find({ brand: brandId }).select("_id status deadline");
    const campaignIds = brandCampaigns.map((c) => c._id);

    const [totalSubmissions, totalWinners] = await Promise.all([
      Submission.countDocuments({ campaign: { $in: campaignIds } }),
      Submission.countDocuments({ campaign: { $in: campaignIds }, status: "winner" }),
    ]);

    const activeCampaigns = brandCampaigns.filter(
      (c) => c.status === "approved" && new Date(c.deadline) > new Date()
    ).length;

    const pendingCampaigns = brandCampaigns.filter(
      (c) => c.status === "pending"
    ).length;

    res.json({
      totalCampaigns: brandCampaigns.length,
      activeCampaigns,
      pendingCampaigns,
      totalSubmissionsReceived: totalSubmissions,
      winnersSelected: totalWinners,
      averageSubmissionsPerCampaign:
        brandCampaigns.length > 0
          ? (totalSubmissions / brandCampaigns.length).toFixed(1)
          : "0.0",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to aggregate brand analytics" });
  }
};

/**
 * Returns participation & win statistics for a specific creator user
 */
exports.getCreatorStats = async (req, res) => {
  try {
    const creatorId = req.user.id;

    const [totalSubmissions, totalWins, pendingSubmissions] = await Promise.all([
      Submission.countDocuments({ creator: creatorId }),
      Submission.countDocuments({ creator: creatorId, status: "winner" }),
      Submission.countDocuments({ creator: creatorId, status: "pending" }),
    ]);

    const winRate =
      totalSubmissions > 0
        ? ((totalWins / totalSubmissions) * 100).toFixed(1)
        : "0.0";

    res.json({
      totalSubmissions,
      totalWins,
      pendingSubmissions,
      winRatePercent: winRate,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to aggregate creator analytics" });
  }
};
