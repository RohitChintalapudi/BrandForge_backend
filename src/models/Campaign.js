const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    description: String,
    reward: String,
    deadline: Date,
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
