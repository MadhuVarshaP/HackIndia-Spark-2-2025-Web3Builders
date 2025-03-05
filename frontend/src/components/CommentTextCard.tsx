"use client";

import React, { useEffect, useState } from "react";
import avatar from "../images/avatar.png";
import Image from "next/image";
import { FaReplyAll, FaThumbsDown, FaThumbsUp } from "react-icons/fa";

interface CommentTextCardProps {
  comment: {
    _id: string;
    content: string;
    creatorAddress: string;
    isAnonymous: boolean;
    createdAt: string;
    likes?: number;
    dislikes?: number;
  };
}

interface UserData {
  name: string;
  profilePicture?: string;
}

const CommentTextCard: React.FC<CommentTextCardProps> = ({ comment }) => {
  const [likes, setLikes] = useState<number>(0);
  const [dislikes, setDislikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({ name: "Anonymous" });

  useEffect(() => {
    const fetchUserData = async () => {
      if (comment.isAnonymous) return;

      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/users/profile/${comment.creatorAddress}`
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
      }
    };

    fetchUserData();
  }, [comment.creatorAddress, comment.isAnonymous]);

  const handleLike = (): void => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      if (isDisliked) {
        setDislikes(dislikes - 1);
        setIsDisliked(false);
      }
      setIsLiked(true);
    }
  };

  const handleDislike = (): void => {
    if (isDisliked) {
      setDislikes(dislikes - 1);
      setIsDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      if (isLiked) {
        setLikes(likes - 1);
        setIsLiked(false);
      }
      setIsDisliked(true);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="bg-gray-800 p-5 rounded-lg mt-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={userData.profilePicture || avatar}
            alt="User Avatar"
            width={40}
            height={40}
            className="w-10 h-10 bg-gray-700 rounded-full"
          />
          <div>
            <h3 className="text-[16px] font-semibold">
              {comment.isAnonymous
                ? "Anonymous"
                : `${comment.creatorAddress.slice(
                    0,
                    6
                  )}...${comment.creatorAddress.slice(-4)}`}
            </h3>
            <p className="text-sm text-gray-400">
              Posted on {formatDate(comment.createdAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="my-3">
        <p className="text-[17px]">{comment.content}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1">
            <FaThumbsUp
              className={`h-5 w-5 ${
                isLiked ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <span className="text-white">{likes}</span>
          </button>
          <button onClick={handleDislike} className="flex items-center gap-1">
            <FaThumbsDown
              className={`h-5 w-5 ${
                isDisliked ? "text-red-500" : "text-gray-400"
              }`}
            />
            <span className="text-white">{dislikes}</span>
          </button>
          <FaReplyAll className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </section>
  );
};

export default CommentTextCard;
