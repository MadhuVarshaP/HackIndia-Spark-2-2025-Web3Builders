"use client";

import React, { useEffect, useState } from "react";
import avatar from "../images/avatar.png";
import Image from "next/image";
import { IoMdShare } from "react-icons/io";
import { BiSolidCommentDetail } from "react-icons/bi";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import close from "../images/close.png";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import axios from "axios";
import { contractAddress } from "@/constants/contractAddress";
import { abi } from "@/constants/abi";

interface PostContent {
  text?: string;
  image?: string;
}

interface TextCardProps {
  _id: string;
  content: PostContent;
  creatorAddress: string;
  timestamp: number;
  likes: string[];
  dislikes: string[];
  commentCount: number;
  postId: number;
}

interface UserData {
  name: string;
  profilePicture?: string;
}

const TextCard: React.FC<TextCardProps> = ({
  _id,
  content,
  timestamp,
  likes,
  dislikes,
  commentCount,
  postId,
  creatorAddress,
}) => {
  const [userData, setUserData] = useState<UserData>({ name: "Anonymous" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [likesCount, setLikesCount] = useState<number>(likes.length);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dislikesCount, setDislikesCount] = useState<number>(dislikes.length);
  const { address } = useAccount();
  const [isLiked, setIsLiked] = useState<boolean>(
    likes.includes(address || "")
  );
  const [isDisliked, setIsDisliked] = useState<boolean>(
    dislikes.includes(address || "")
  );
  const { writeContract } = useWriteContract();

  // Convert timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/users/profile/${creatorAddress}`
        );
        const data = await response.json();

        if (data) {
          setUserData({
            name: data.name || "Anonymous",
            profilePicture: data.profilePicture,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (creatorAddress) {
      fetchUserData();
    }
  }, [creatorAddress]);

  useEffect(() => {
    // Check if user has already liked/disliked
    if (address) {
      setIsLiked(likes.includes(address));
      setIsDisliked(dislikes.includes(address));
    }
  }, [address, likes, dislikes]);

  useEffect(() => {
    if (address) {
      const storedReaction = localStorage.getItem(`reaction-${_id}-${address}`);
      if (storedReaction) {
        const { isLiked: storedLiked, isDisliked: storedDisliked } =
          JSON.parse(storedReaction);
        setIsLiked(storedLiked);
        setIsDisliked(storedDisliked);
      }
    }
  }, [_id, address]);

  const fetchCurrentReactions = async () => {
    try {
      const response = await axios.get(
        `https://vivi-backend.vercel.app/api/comments/${_id}/reactions?isPost=${"true"}`
      );
      if (response.data.status === "success") {
        setLikesCount(response.data.likes);
        setDislikesCount(response.data.dislikes);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  useEffect(() => {
    fetchCurrentReactions();
    const interval = setInterval(fetchCurrentReactions, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [_id]);

  const handleReaction = async (type: "like" | "dislike") => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    try {
      // Call smart contract
      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: type === "like" ? "likePost" : "dislikePost",
        args: [BigInt(postId)],
      });

      // Call backend API
      const response = await axios.post(
        `https://vivi-backend.vercel.app/api/comments/${_id}/reaction`,
        {
          type,
          isPost: true,
          creatorAddress: address,
        },
        {
          headers: {
            Authorization: `Bearer ${address}`, // Assuming authMiddleware expects address in header
          },
        }
      );

      if (response.data.status === "success") {
        setLikesCount(response.data.likes);
        setDislikesCount(response.data.dislikes);

        if (type === "like") {
          setLikesCount((prev) => prev + (isLiked ? -1 : 1));
          setIsLiked(!isLiked);
          if (isDisliked) {
            setDislikesCount((prev) => prev - 1);
            setIsDisliked(false);
          }
        } else {
          setDislikesCount((prev) => prev + (isDisliked ? -1 : 1));
          setIsDisliked(!isDisliked);
          if (isLiked) {
            setLikesCount((prev) => prev - 1);
            setIsLiked(false);
          }
        }

        // Store reaction state in localStorage
        localStorage.setItem(
          `reaction-${_id}-${address}`,
          JSON.stringify({
            isLiked: type === "like" ? !isLiked : false,
            isDisliked: type === "dislike" ? !isDisliked : false,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error(`Error ${type}ing post:`, error);
      alert(`Failed to ${type} post. Please try again.`);
    }
  };

  const handleLike = () => handleReaction("like");
  const handleDislike = () => handleReaction("dislike");

  return (
    <section className="bg-gray-800 p-5 rounded-lg mb-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={userData.profilePicture || avatar}
            alt="User Avatar"
            width={40}
            height={40}
            className="w-10 h-10 bg-gray-700 rounded-full object-cover"
          />
          <div>
            <h3 className="text-[16px] font-semibold">
              {isLoading ? "Loading..." : userData.name}
            </h3>
            <p className="text-sm text-gray-400">
              Posted on {formatDate(timestamp)}
            </p>
          </div>
        </div>
        <Image src={close} alt="Close Icon" className="h-5 w-5" />
      </div>
      <div className="my-3">
        {content.text && <p className="text-[17px]">{content.text}</p>}
        {content.image && (
          <Image
            src={content.image}
            alt="Post Content"
            className="mt-3 w-full rounded-md"
            width={500}
            height={300}
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1">
            <FaThumbsUp
              className={`h-5 w-5 ${
                isLiked ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <span className="text-white">{likesCount}</span>
          </button>
          <button onClick={handleDislike} className="flex items-center gap-1">
            <FaThumbsDown
              className={`h-5 w-5 ${
                isDisliked ? "text-red-500" : "text-gray-400"
              }`}
            />
            <span className="text-white">{dislikesCount}</span>
          </button>
          <div className="flex items-center gap-1">
            <BiSolidCommentDetail className="h-5 w-5 text-gray-400" />
            <span className="text-white">{commentCount}</span>
          </div>
          <IoMdShare className="h-5 w-5 text-gray-400" />
        </div>
        <Link href={`/details/${postId}`}>
          <button className="text-[16px] border border-[#7482F1] bg-transparent py-1 px-3 rounded-xl h-fit transition duration-200">
            Know more
          </button>
        </Link>
      </div>
    </section>
  );
};

export default TextCard;
