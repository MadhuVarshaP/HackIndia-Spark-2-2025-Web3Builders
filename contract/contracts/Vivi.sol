// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownable.sol";

contract Vivi is Ownable {
    constructor() Ownable() {
        // Initialize with msg.sender as the initial owner
    }

    enum PostType {
        TEXT,
        VOICE
    }

    struct Post {
        uint256 id;
        address creator;
        string contentHash;
        PostType postType;
        uint256 bountyAmount;
        bool isActive;
    }

    struct Comment {
        uint256 id;
        uint256 postId;
        address commenter;
        string contentHash;
        PostType commentType;
        bool isAnonymous;
        bool isActive;
    }

    mapping(uint256 => Post) public posts;
    mapping(uint256 => Comment) public comments;
    mapping(uint256 => uint256[]) public postComments;
    mapping(uint256 => address[]) public postLikes;
    mapping(uint256 => address[]) public postDislikes;
    mapping(uint256 => address[]) public commentLikes;
    mapping(uint256 => address[]) public commentDislikes;
    mapping(address => mapping(uint256 => bool)) public hasLikedPost;
    mapping(address => mapping(uint256 => bool)) public hasDislikedPost;
    mapping(address => mapping(uint256 => bool)) public hasLikedComment;
    mapping(address => mapping(uint256 => bool)) public hasDislikedComment;

    uint256 public postCount;
    uint256 public commentCount;

    event PostCreated(
        uint256 indexed postId,
        address indexed creator,
        string contentHash,
        PostType postType,
        uint256 bountyAmount
    );

    event BountyAdded(
        uint256 indexed postId,
        address indexed sender,
        uint256 bountyAmount
    );

    event BountyAwarded(uint256 indexed postId, address indexed winner);
    event PostCancelled(uint256 indexed postId, address indexed creator);
    event EmergencyEthRecovered(uint256 amount);

    event CommentAdded(
        uint256 indexed postId,
        uint256 indexed commentId,
        address indexed commenter,
        bool isAnonymous,
        string contentHash,
        PostType commentType
    );

    event PostLiked(uint256 indexed postId, address indexed liker);
    event PostDisliked(uint256 indexed postId, address indexed disliker);
    event CommentLiked(uint256 indexed commentId, address indexed liker);
    event CommentDisliked(uint256 indexed commentId, address indexed disliker);
    event CommentEdited(uint256 indexed commentId, string newContentHash);
    event CommentDeleted(uint256 indexed commentId);

    function createPost(
        string memory contentHash,
        PostType postType
    ) external payable {
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");

        postCount++;
        posts[postCount] = Post({
            id: postCount,
            creator: msg.sender,
            contentHash: contentHash,
            postType: postType,
            bountyAmount: msg.value,
            isActive: true
        });

        emit PostCreated(
            postCount,
            msg.sender,
            contentHash,
            postType,
            msg.value
        );
    }

    function addComment(
        uint256 postId,
        string memory contentHash,
        PostType commentType,
        bool isAnonymous
    ) external {
        require(posts[postId].isActive, "Post is not active");
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");

        commentCount++;
        comments[commentCount] = Comment({
            id: commentCount,
            postId: postId,
            commenter: isAnonymous ? address(0) : msg.sender,
            contentHash: contentHash,
            commentType: commentType,
            isAnonymous: isAnonymous,
            isActive: true
        });

        postComments[postId].push(commentCount);

        emit CommentAdded(
            postId,
            commentCount,
            msg.sender,
            isAnonymous,
            contentHash,
            commentType
        );
    }

    function likePost(uint256 postId) external {
        require(posts[postId].isActive, "Post is not active");
        require(!hasLikedPost[msg.sender][postId], "Already liked this post");

        if (hasDislikedPost[msg.sender][postId]) {
            removeDislikeFromPost(postId);
        }

        postLikes[postId].push(msg.sender);
        hasLikedPost[msg.sender][postId] = true;

        emit PostLiked(postId, msg.sender);
    }

    function dislikePost(uint256 postId) external {
        require(posts[postId].isActive, "Post is not active");
        require(
            !hasDislikedPost[msg.sender][postId],
            "Already disliked this post"
        );

        if (hasLikedPost[msg.sender][postId]) {
            removeLikeFromPost(postId);
        }

        postDislikes[postId].push(msg.sender);
        hasDislikedPost[msg.sender][postId] = true;

        emit PostDisliked(postId, msg.sender);
    }

    function likeComment(uint256 commentId) external {
        require(comments[commentId].isActive, "Comment is not active");
        require(
            !hasLikedComment[msg.sender][commentId],
            "Already liked this comment"
        );

        if (hasDislikedComment[msg.sender][commentId]) {
            removeDislikeFromComment(commentId);
        }

        commentLikes[commentId].push(msg.sender);
        hasLikedComment[msg.sender][commentId] = true;

        emit CommentLiked(commentId, msg.sender);
    }

    function dislikeComment(uint256 commentId) external {
        require(comments[commentId].isActive, "Comment is not active");
        require(
            !hasDislikedComment[msg.sender][commentId],
            "Already disliked this comment"
        );

        if (hasLikedComment[msg.sender][commentId]) {
            removeLikeFromComment(commentId);
        }

        commentDislikes[commentId].push(msg.sender);
        hasDislikedComment[msg.sender][commentId] = true;

        emit CommentDisliked(commentId, msg.sender);
    }

    function removeLikeFromPost(uint256 postId) internal {
        address[] storage likes = postLikes[postId];
        for (uint i = 0; i < likes.length; i++) {
            if (likes[i] == msg.sender) {
                likes[i] = likes[likes.length - 1];
                likes.pop();
                hasLikedPost[msg.sender][postId] = false;
                break;
            }
        }
    }

    function removeDislikeFromPost(uint256 postId) internal {
        address[] storage dislikes = postDislikes[postId];
        for (uint i = 0; i < dislikes.length; i++) {
            if (dislikes[i] == msg.sender) {
                dislikes[i] = dislikes[dislikes.length - 1];
                dislikes.pop();
                hasDislikedPost[msg.sender][postId] = false;
                break;
            }
        }
    }

    function removeLikeFromComment(uint256 commentId) internal {
        address[] storage likes = commentLikes[commentId];
        for (uint i = 0; i < likes.length; i++) {
            if (likes[i] == msg.sender) {
                likes[i] = likes[likes.length - 1];
                likes.pop();
                hasLikedComment[msg.sender][commentId] = false;
                break;
            }
        }
    }

    function removeDislikeFromComment(uint256 commentId) internal {
        address[] storage dislikes = commentDislikes[commentId];
        for (uint i = 0; i < dislikes.length; i++) {
            if (dislikes[i] == msg.sender) {
                dislikes[i] = dislikes[dislikes.length - 1];
                dislikes.pop();
                hasDislikedComment[msg.sender][commentId] = false;
                break;
            }
        }
    }

    function addBountyToPost(uint256 postId) external payable {
        Post storage post = posts[postId];
        require(post.isActive, "Post is not active");
        require(post.id == postId, "Post does not exist");
        require(msg.value > 0, "Bounty amount must be greater than zero");

        post.bountyAmount += msg.value;

        emit BountyAdded(postId, msg.sender, msg.value);
    }

    function awardBounty(uint256 postId, address payable winner) external {
        Post storage post = posts[postId];
        require(msg.sender == post.creator, "Only creator can award bounty");
        require(post.isActive, "Post is not active");
        require(post.bountyAmount > 0, "No bounty available");

        uint256 amount = post.bountyAmount;
        post.bountyAmount = 0;
        post.isActive = false;

        (bool success, ) = winner.call{value: amount}("");
        require(success, "Failed to send bounty");

        emit BountyAwarded(postId, winner);
    }

    function cancelPost(uint256 postId) external {
        Post storage post = posts[postId];
        require(msg.sender == post.creator, "Only creator can cancel");
        require(post.isActive, "Post is not active");

        if (post.bountyAmount > 0) {
            (bool success, ) = post.creator.call{value: post.bountyAmount}("");
            require(success, "Failed to return bounty");
            post.bountyAmount = 0;
        }

        post.isActive = false;

        emit PostCancelled(postId, msg.sender);
    }

    function editComment(
        uint256 commentId,
        string memory newContentHash
    ) external {
        Comment storage comment = comments[commentId];
        require(comment.isActive, "Comment is not active");
        require(msg.sender == comment.commenter, "Only commenter can edit");
        require(
            bytes(newContentHash).length > 0,
            "Content hash cannot be empty"
        );

        comment.contentHash = newContentHash;
        emit CommentEdited(commentId, newContentHash);
    }

    function deleteComment(uint256 commentId) external {
        Comment storage comment = comments[commentId];
        require(comment.isActive, "Comment is not active");
        require(msg.sender == comment.commenter, "Only commenter can delete");

        comment.isActive = false;
        emit CommentDeleted(commentId);
    }

    function recoverEth() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Failed to recover ETH");
        emit EmergencyEthRecovered(balance);
    }

    receive() external payable {
        revert("Use createPost or addBountyToPost functions");
    }
}
