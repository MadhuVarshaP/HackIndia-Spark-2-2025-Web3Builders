const mongoose = require("mongoose");
const { ethers } = require("ethers");

const postSchema = new mongoose.Schema(
  {
    contentHash: {
      type: String,
      required: true,
    },
    postId: {
      type: Number,
    },
    postType: {
      type: String,
      enum: ["TEXT", "VOICE"],
      required: true,
    },
    content: {
      text: {
        type: String,
      },
      voice: {
        data: Buffer, // For storing binary voice data
        contentType: String, // For MIME type
        fileName: String,
        fileSize: Number,
      },
    },
    creatorAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    bountyAmount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: String, // wallet addresses
        lowercase: true,
      },
    ],
    dislikes: [
      {
        type: String, // wallet addresses
        lowercase: true,
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    postId: {
      type: Number,
      required: true,
      unique: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Number,
      default: Date.now,
    },
    hasBounty: {
      type: Boolean,
      default: false,
    },
    bountyStatus: {
      type: String,
      enum: ["NONE", "OPEN", "CLOSED"],
      default: "NONE",
    },
    bountyPaidTo: {
      type: String,
      default: null,
    },
    bountyPaidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that either text or voice content is present based on postType
postSchema.pre("save", function (next) {
  if (this.postType === "TEXT" && !this.content.text) {
    next(new Error("Text content is required for TEXT posts"));
  } else if (this.postType === "VOICE" && !this.content.voice.data) {
    next(new Error("Voice content is required for VOICE posts"));
  } else {
    next();
  }
});

module.exports = mongoose.model("Post", postSchema);
