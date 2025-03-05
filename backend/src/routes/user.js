const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const multer = require("multer");
const User = require("../models/User");

// Multer setup for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Create or update user profile
router.post("/profile", upload.single("profilePicture"), async (req, res) => {
  try {
    const { ensName, bio, name, profilePictureHash, walletAddress } = req.body;

    // Update or create user profile
    const updateData = {
      ensName,
      name,
      bio,
      lastActive: new Date(),
      ...(profilePictureHash && { profilePicture: profilePictureHash }),
    };

    const user = await User.findOneAndUpdate({ walletAddress }, updateData, {
      new: true,
      upsert: true,
    });

    res.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get user profile
router.get("/profile/:walletAddress", async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get ENS name for wallet
router.get("/ens/:walletAddress", async (req, res) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.ETH_RPC_URL
    );
    const ensName = await provider.lookupAddress(req.params.walletAddress);
    res.json({ ensName });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ENS name" });
  }
});

module.exports = router;
