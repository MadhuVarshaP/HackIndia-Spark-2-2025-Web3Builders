const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    unique: true,
    sparse: true,
  },
  ensName: {
    type: String,
    unique: true,
    sparse: true,
  },
  profilePicture: {
    type: String, // IPFS hash
  },
  bio: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
