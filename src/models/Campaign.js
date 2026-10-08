const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Brand reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    reward: {
      type: String,
      required: [true, "Reward information is required"],
      trim: true,
      minlength: [1, "Reward cannot be empty"],
      maxlength: [100, "Reward cannot exceed 100 characters"],
    },
    deadline: {
      type: Date,
      required: [true, "Campaign deadline is required"],
      validate: {
        validator: function (value) {
          if (this.isNew || this.isModified("deadline")) {
            return value instanceof Date && !isNaN(value) && value.getTime() > Date.now();
          }
          return true;
        },
        message: "Deadline must be a valid future date",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "completed"],
        message: "{VALUE} is not a valid campaign status",
      },
      default: "pending",
      trim: true,
      lowercase: true,
      index: true,
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

// Optimize query performance for campaign retrieval
campaignSchema.index({ status: 1, createdAt: -1 });
campaignSchema.index({ brand: 1, createdAt: -1 });
campaignSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);
