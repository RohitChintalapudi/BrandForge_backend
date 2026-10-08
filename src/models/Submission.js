const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "Campaign reference is required"],
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
      index: true,
    },
    contentUrl: {
      type: String,
      required: [true, "Content URL is required"],
      trim: true,
      match: [
        /^(https?:\/\/)[^\s]+$/i,
        "Please provide a valid web URL starting with http:// or https://",
      ],
      maxlength: [2048, "Content URL cannot exceed 2048 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "winner", "rejected"],
        message: "{VALUE} is not a valid submission status",
      },
      default: "pending",
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Database-level unique constraint preventing duplicate submissions per creator per campaign
submissionSchema.index({ campaign: 1, creator: 1 }, { unique: true });

// Optimize query performance for creator & campaign queries
submissionSchema.index({ creator: 1, status: 1 });
submissionSchema.index({ creator: 1, createdAt: -1 });
submissionSchema.index({ campaign: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
