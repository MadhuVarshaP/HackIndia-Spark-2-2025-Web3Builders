const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vivi", function () {
  let Vivi;
  let vivi;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    try {
      // Get signers
      [owner, addr1, addr2, addr3] = await ethers.getSigners();

      // Deploy Vivi
      Vivi = await ethers.getContractFactory("Vivi");
      vivi = await Vivi.deploy();

      // Wait for deployment
      await vivi.waitForDeployment();
    } catch (error) {
      console.error("Deployment Error:", error);
      throw error;
    }
  });

  describe("Post Creation and Management", function () {
    it("Should create a post correctly with bounty", async function () {
      const contentHash = "QmTest123";
      const postType = 0; // TEXT
      const bountyAmount = ethers.parseEther("1");

      await vivi.connect(addr1).createPost(contentHash, postType, {
        value: bountyAmount,
      });

      const post = await vivi.posts(1);
      expect(post.creator).to.equal(addr1.address);
      expect(post.contentHash).to.equal(contentHash);
      expect(post.postType).to.equal(postType);
      expect(post.bountyAmount).to.equal(bountyAmount);
      expect(post.isActive).to.equal(true);
    });

    it("Should create a post without bounty", async function () {
      await vivi.connect(addr1).createPost("QmTest123", 0);
      const post = await vivi.posts(1);
      expect(post.bountyAmount).to.equal(0);
    });

    it("Should allow adding bounty to existing post", async function () {
      await vivi.connect(addr1).createPost("QmTest123", 0);
      const bountyAmount = ethers.parseEther("1");

      await vivi.connect(addr2).addBountyToPost(1, {
        value: bountyAmount,
      });

      const post = await vivi.posts(1);
      expect(post.bountyAmount).to.equal(bountyAmount);
    });

    it("Should allow post creator to award bounty", async function () {
      const bountyAmount = ethers.parseEther("1");
      await vivi.connect(addr1).createPost("QmTest123", 0, {
        value: bountyAmount,
      });

      const initialBalance = await ethers.provider.getBalance(addr2.address);
      await vivi.connect(addr1).awardBounty(1, addr2.address);

      const finalBalance = await ethers.provider.getBalance(addr2.address);
      expect(finalBalance - initialBalance).to.equal(bountyAmount);
    });

    it("Should allow post creator to cancel post and receive bounty back", async function () {
      const bountyAmount = ethers.parseEther("1");
      await vivi.connect(addr1).createPost("QmTest123", 0, {
        value: bountyAmount,
      });

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const tx = await vivi.connect(addr1).cancelPost(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance + gasUsed - initialBalance).to.equal(bountyAmount);
    });
  });

  describe("Comments", function () {
    beforeEach(async function () {
      await vivi.connect(addr1).createPost("QmTest123", 0);
    });

    it("Should add a comment to a post", async function () {
      await vivi.connect(addr2).addComment(1, "QmComment123", 0, false);

      const comment = await vivi.comments(1);
      expect(comment.commenter).to.equal(addr2.address);
      expect(comment.contentHash).to.equal("QmComment123");
      expect(comment.isAnonymous).to.equal(false);
    });

    it("Should handle anonymous comments", async function () {
      await vivi.connect(addr2).addComment(1, "QmComment123", 0, true);

      const comment = await vivi.comments(1);
      expect(comment.isAnonymous).to.equal(true);
      expect(comment.commenter).to.equal(ethers.ZeroAddress);
    });

    it("Should edit comment correctly", async function () {
      await vivi.connect(addr2).addComment(1, "QmComment123", 0, false);
      await vivi.connect(addr2).editComment(1, "QmNewComment123");

      const comment = await vivi.comments(1);
      expect(comment.contentHash).to.equal("QmNewComment123");
    });

    it("Should delete comment correctly", async function () {
      await vivi.connect(addr2).addComment(1, "QmComment123", 0, false);
      await vivi.connect(addr2).deleteComment(1);

      const comment = await vivi.comments(1);
      expect(comment.isActive).to.equal(false);
    });
  });

  describe("Likes and Dislikes", function () {
    beforeEach(async function () {
      await vivi.connect(addr1).createPost("QmTest123", 0);
      await vivi.connect(addr2).addComment(1, "QmComment123", 0, false);
    });

    describe("Post Reactions", function () {
      it("Should allow liking a post", async function () {
        await vivi.connect(addr2).likePost(1);
        expect(await vivi.hasLikedPost(addr2.address, 1)).to.be.true;
      });

      it("Should allow disliking a post", async function () {
        await vivi.connect(addr2).dislikePost(1);
        expect(await vivi.hasDislikedPost(addr2.address, 1)).to.be.true;
      });

      it("Should remove like when disliking", async function () {
        await vivi.connect(addr2).likePost(1);
        await vivi.connect(addr2).dislikePost(1);
        expect(await vivi.hasLikedPost(addr2.address, 1)).to.be.false;
        expect(await vivi.hasDislikedPost(addr2.address, 1)).to.be.true;
      });

      it("Should remove dislike when liking", async function () {
        await vivi.connect(addr2).dislikePost(1);
        await vivi.connect(addr2).likePost(1);
        expect(await vivi.hasDislikedPost(addr2.address, 1)).to.be.false;
        expect(await vivi.hasLikedPost(addr2.address, 1)).to.be.true;
      });

      it("Should prevent liking twice", async function () {
        await vivi.connect(addr2).likePost(1);
        await expect(vivi.connect(addr2).likePost(1)).to.be.revertedWith(
          "Already liked this post"
        );
      });

      it("Should prevent disliking twice", async function () {
        await vivi.connect(addr2).dislikePost(1);
        await expect(vivi.connect(addr2).dislikePost(1)).to.be.revertedWith(
          "Already disliked this post"
        );
      });
    });

    describe("Comment Reactions", function () {
      it("Should allow liking a comment", async function () {
        await vivi.connect(addr3).likeComment(1);
        expect(await vivi.hasLikedComment(addr3.address, 1)).to.be.true;
      });

      it("Should allow disliking a comment", async function () {
        await vivi.connect(addr3).dislikeComment(1);
        expect(await vivi.hasDislikedComment(addr3.address, 1)).to.be.true;
      });

      it("Should remove like when disliking", async function () {
        await vivi.connect(addr3).likeComment(1);
        await vivi.connect(addr3).dislikeComment(1);
        expect(await vivi.hasLikedComment(addr3.address, 1)).to.be.false;
        expect(await vivi.hasDislikedComment(addr3.address, 1)).to.be.true;
      });

      it("Should remove dislike when liking", async function () {
        await vivi.connect(addr3).dislikeComment(1);
        await vivi.connect(addr3).likeComment(1);
        expect(await vivi.hasDislikedComment(addr3.address, 1)).to.be.false;
        expect(await vivi.hasLikedComment(addr3.address, 1)).to.be.true;
      });

      it("Should prevent liking twice", async function () {
        await vivi.connect(addr3).likeComment(1);
        await expect(vivi.connect(addr3).likeComment(1)).to.be.revertedWith(
          "Already liked this comment"
        );
      });

      it("Should prevent disliking twice", async function () {
        await vivi.connect(addr3).dislikeComment(1);
        await expect(vivi.connect(addr3).dislikeComment(1)).to.be.revertedWith(
          "Already disliked this comment"
        );
      });
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to recover ETH", async function () {
      // Send ETH to contract through post creation
      await vivi.connect(addr1).createPost("QmTest123", 0, {
        value: ethers.parseEther("1"),
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await vivi.connect(owner).recoverEth();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance + gasUsed - initialBalance).to.equal(
        ethers.parseEther("1")
      );
    });

    it("Should prevent non-owners from recovering ETH", async function () {
      await expect(vivi.connect(addr1).recoverEth()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
