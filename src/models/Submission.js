const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contentUrl: String,
    status: {
      type: String,
      enum: ["pending", "winner"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
