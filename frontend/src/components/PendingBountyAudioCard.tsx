"use client";

import React, { useEffect, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import AwardPopup from "./AwardPopup"; // Import the AwardPopup component
import { formatEther } from "viem";

interface BountyAudioCardProps {
  audioUrl: string;
  timestamp: number;
  postId: number;
  bountyAmount: string;
  expiryDate?: string;
  responseCount?: number;
  creatorAddress?: string;
  creatorName?: string;
}

interface Comment {
  _id: string;
  commentType: "TEXT" | "VOICE";
  content?: {
    text?: string;
    voice?: {
      data: string | Buffer;
      contentType: string;
    };
  };
  contentHash?: string;
  creatorAddress: string;
  isAnonymous: boolean;
  createdAt: string;
  likes?: number;
  dislikes?: number;
}

function PendingBountyAudioCard({
  audioUrl,
  timestamp,
  postId,
  bountyAmount, // Default value
  responseCount = 0,
}: BountyAudioCardProps) {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  // Handle reward payment
  const handlePayReward = (selectedUser: string) => {
    alert(`Reward paid to ${selectedUser}`);
    // Implement logic for paying the reward to the selected user.
  };

  const formatBountyAmount = (amount: string) => {
    try {
      return `${formatEther(BigInt(amount))} ETH`;
    } catch (error) {
      console.error("Error formatting bounty amount:", error);
      return "0 ETH";
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Fetch comments when popup is opened
  useEffect(() => {
    const fetchComments = async () => {
      // if (isPopupVisible) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/comments/${postId}/comments`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        const data = await response.json();
        console.log(data, "comment");
        setComments(data.comments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
      // }
    };

    fetchComments();
  }, [isPopupVisible, postId]);

  // Toggle popup visibility
  const togglePopup = () => setIsPopupVisible(!isPopupVisible);

  return (
    <section className="bg-gray-800 p-5 rounded-lg mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Posted on {formatTimestamp(timestamp)}
        </p>
      </div>
      <div className="my-3 flex justify-center w-fit">
        <div className="w-fit bg-gray-700/50 rounded-lg p-2">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="bg-gray-600 w-fit px-3 rounded-xl ">
          <p className="text-white">
            Amount:{" "}
            <span className="font-semibold">
              {formatBountyAmount(bountyAmount)}
            </span>
          </p>
        </div>
        <div className="bg-gray-600 w-fit px-3 rounded-xl ">
          <p className="text-white">
            Responses: <span className="font-semibold">{responseCount}</span>
          </p>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={togglePopup}
          className="text-[16px] mt-3 font-semibold border border-[#7482F1] bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500 focus:bg-gradient-to-r focus:from-purple-500 focus:to-blue-500 py-1 px-3 rounded-xl h-fit transition duration-200 whitespace-nowrap"
        >
          Award Manually
        </button>
      </div>

      {/* Use the AwardPopup component */}
      <AwardPopup
        isVisible={isPopupVisible}
        onClose={togglePopup}
        onPayReward={handlePayReward}
        bountyAmount={formatBountyAmount(bountyAmount)}
        totalResponses={responseCount}
        comments={comments}
        postId={postId}
      />
    </section>
  );
}

export default PendingBountyAudioCard;
