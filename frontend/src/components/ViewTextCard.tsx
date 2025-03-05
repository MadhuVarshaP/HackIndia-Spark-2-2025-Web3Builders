"use client";

import { abi } from "@/constants/abi";
import { contractAddress } from "@/constants/contractAddress";
import axios from "axios";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";

interface PostContent {
  text?: string;
  image?: string;
}
interface ViewTextCardProps {
  id: string;
  content: PostContent;
  timestamp: number;
  postId: number;
  hasBounty: boolean;
}

function ViewTextCard({
  id,
  content,
  timestamp,
  postId,
  hasBounty,
}: ViewTextCardProps) {
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [bountyAmount, setBountyAmount] = useState("0.005");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessing, setIsProcessing] = useState(false);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const handleAddBounty = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing bounty transaction...", { id: "bounty" });

    try {
      // Call smart contract
      writeContract(
        {
          address: contractAddress, // Make sure to define this
          abi: abi, // Make sure to import this
          functionName: "addBountyToPost",
          args: [postId],
          value: parseEther(bountyAmount), // Convert ETH amount to Wei
        },
        {
          onSuccess: async () => {
            try {
              toast.loading("Saving bounty details...", { id: "bounty" });
              // Call backend API
              const bountyInWei = parseEther(bountyAmount);
              const apiResponse = await axios.post(
                `https://vivi-backend.vercel.app/api/posts/${id}/bounty`,
                {
                  bountyAmount: Number(bountyInWei),
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (apiResponse.data.status === "success") {
                // Reset and close modal
                setBountyAmount("0.005");
                setShowBountyModal(false);
                toast.success("Bounty added successfully!", { id: "bounty" });
              }
            } catch (error) {
              console.error("Error saving bounty to backend:", error);
              toast.error("Failed to save bounty to backend", { id: "bounty" });
            }
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed", { id: "bounty" });
          },
        }
      );
    } catch (error) {
      console.error("Error adding bounty:", error);
      toast.error("Failed to add bounty", { id: "bounty" });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: "#1E293B",
              color: "#fff",
              border: "1px solid #3B82F6",
            },
          },
          error: {
            style: {
              background: "#1E293B",
              color: "#fff",
              border: "1px solid #EF4444",
            },
          },
        }}
      />
      <section className="bg-gray-800 p-5 rounded-lg mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Posted on {formatDate(timestamp)}
          </p>
        </div>
        <div className="my-3">
          <p className="text-[17px]">{content.text}</p>
        </div>

        {hasBounty ? (
          <div className="text-[16px] my-3 font-semibold text-[#7482F1]">
            Bounty Added
          </div>
        ) : (
          <button
            onClick={() => setShowBountyModal(true)}
            className="text-[16px] my-3 font-semibold border border-[#7482F1] bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500 focus:bg-gradient-to-r focus:from-purple-500 focus:to-blue-500 py-1 px-3 rounded-xl h-fit transition duration-200 whitespace-nowrap"
          >
            Add Bounty
          </button>
        )}
      </section>
      {/* Bounty Modal */}
      {showBountyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl font-semibold text-white mb-4">
              Add Bounty
            </h2>
            <div className="relative p-3 border-2 rounded-xl w-auto border-[#7482F1] mb-4">
              <div className="absolute -top-4 left-3 bg-gray-800 px-2 text-white font-semibold text-[18px]">
                Enter Amount
              </div>
              <input
                type="text"
                className="bg-transparent text-white w-full focus:outline-none"
                placeholder="Enter bounty in ETH"
                value={bountyAmount}
                onChange={(e) => setBountyAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBountyModal(false)}
                className="px-4 py-2 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBounty}
                className="px-4 py-2 bg-[#7482F1] text-white rounded-lg hover:bg-[#5b6ad4] transition-colors"
              >
                Add Bounty
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewTextCard;
