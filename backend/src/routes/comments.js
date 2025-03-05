const express = require("express");
const router = express.Router();
const multer = require("multer");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Multer configuration for voice comments
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
});

// Create comment (supports both text and voice)
router.post("/:postId/comments", upload.single("voice"), async (req, res) => {
  try {
    const {
      type,
      content: textContent,
      creatorAddress,
      isAnonymous,
      metadataHash,
      contractPostId,
    } = req.body;
    const postRef = req.params.postId;
    let content = {};

    // Validate post exists
    const post = await Post.findById(postRef);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Handle TEXT comments
    if (type === "TEXT") {
      if (!textContent) {
        return res.status(400).json({
          status: "error",
          message: "Content is required for text comments",
        });
      }
      content.text = textContent;
    }
    // Handle VOICE comments
    else if (type === "VOICE") {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "Voice file is required for voice comments",
        });
      }
      content.voice = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      };
    } else {
      return res.status(400).json({
        status: "error",
        message: "Invalid comment type",
      });
    }

    // Create comment
    const comment = new Comment({
      postRef, // MongoDB reference
      contractPostId,
      content,
      contentHash: metadataHash,
      commentType: type,
      creatorAddress,
      isAnonymous: isAnonymous || false,
      likes: [],
      dislikes: [],
    });

    await comment.save();

    await Post.findByIdAndUpdate(postRef, { $inc: { commentCount: 1 } });

    res.json({
      contentHash: metadataHash,
      commentId: comment._id,
      status: "success",
    });
  } catch (error) {
    console.error("Comment creation error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get comments for a post
router.get("/:postId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({
      contractPostId: req.params.postId,
    }).sort({
      createdAt: -1,
    });

    res.json({
      status: "success",
      comments,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get voice comment content
router.get("/comments/:commentId/voice", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.commentType !== "VOICE" || !comment.content.voice) {
      return res.status(404).json({
        status: "error",
        message: "Voice content not found",
      });
    }

    res.set("Content-Type", comment.content.voice.contentType);
    res.send(comment.content.voice.data);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Toggle like/dislike for post or comment (unchanged)
router.post("/:id/reaction", async (req, res) => {
  try {
    const { type, isPost, creatorAddress } = req.body;
    const id = req.params.id;

    const Model = isPost ? Post : Comment;
    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: isPost ? "Post not found" : "Comment not found",
      });
    }

    item.likes = item.likes.filter((address) => address !== creatorAddress);
    item.dislikes = item.dislikes.filter(
      (address) => address !== creatorAddress
    );

    if (type === "like") {
      item.likes.push(creatorAddress);
    } else if (type === "dislike") {
      item.dislikes.push(creatorAddress);
    }

    await item.save();

    res.json({
      status: "success",
      likes: item.likes.length,
      dislikes: item.dislikes.length,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get reactions count for a post or comment
router.get("/:id/reactions", async (req, res) => {
  try {
    const { isPost } = req.query;
    const id = req.params.id;

    const Model = isPost === "true" ? Post : Comment;
    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: isPost === "true" ? "Post not found" : "Comment not found",
      });
    }

    // Return current reaction counts and status
    res.json({
      status: "success",
      likes: item.likes.length,
      dislikes: item.dislikes.length,
      // Optional: Include arrays of addresses for verification
      likedBy: item.likes,
      dislikedBy: item.dislikes,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
