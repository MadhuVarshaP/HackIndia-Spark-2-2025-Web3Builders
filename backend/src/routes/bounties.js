const express = require("express");
const bountyRouter = express.Router();
const Post = require("../models/Post"); // Add Post model import
const ethers = require("ethers");

/**
 * @route POST /api/bounties/:postId/award
 * @desc Award a bounty to a user
 * @access Private
 */
bountyRouter.post("/:postId/award", async (req, res) => {
  try {
    const { postId } = req.params;
    const { recipientAddress } = req.body;

    const post = await Post.findOne({ postId });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.creatorAddress !== req.walletAddress) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (post.status === "awarded") {
      return res.status(400).json({ error: "Bounty already awarded" });
    }

    // Interact with smart contract to award bounty
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL
      );
      const contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Emit event for frontend to handle contract interaction
      post.status = "awarded";
      post.awardedTo = recipientAddress;
      post.awardedAt = new Date();
      await post.save();

      res.json({
        success: true,
        post,
        contractDetails: {
          address: process.env.CONTRACT_ADDRESS,
          postId,
          recipientAddress,
        },
      });
    } catch (error) {
      throw new Error(`Contract interaction failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Award bounty error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/bounties/active
 * @desc Get all active bounties
 * @access Public
 */
bountyRouter.get("/active", async (req, res) => {
  try {
    const activeBounties = await Post.find({
      bountyAmount: { $gt: 0 },
      status: "active",
    }).sort({ bountyAmount: -1 });

    res.json(activeBounties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = bountyRouter;
