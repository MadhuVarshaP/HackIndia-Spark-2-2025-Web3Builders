"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import avatar from "../images/avatar.png";
import { FaReplyAll, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import AudioPlayer from "./AudioPlayer";

interface UserData {
  name: string;
  profilePicture?: string;
}

interface CommentAudioCardProps {
  comment: {
    _id: string;
    audioUrl: string;
    creatorAddress: string;
    isAnonymous: boolean;
    createdAt: string;
    likes?: number;
    dislikes?: number;
  };
}

function CommentAudioCard({ comment }: CommentAudioCardProps) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: "Anonymous" });
  const [audioUrl, setAudioUrl] = useState<string>("");

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

  useEffect(() => {
    const processAudioUrl = async () => {
      try {
        if (!comment.audioUrl) {
          console.error("No audio URL provided");
          return;
        }

        if (comment.audioUrl.startsWith("blob:")) {
          console.log("Using existing blob URL");
          setAudioUrl(comment.audioUrl);
        } else if (comment.audioUrl.startsWith("data:")) {
          console.log("Using data URL");
          setAudioUrl(comment.audioUrl);
        } else {
          console.log("Fetching from URL:", comment.audioUrl);
          const response = await fetch(comment.audioUrl);
          const blob = await response.blob();
          console.log("Blob type:", blob.type); // Debug the MIME type
          const blobUrl = URL.createObjectURL(blob);
          setAudioUrl(blobUrl);
        }
      } catch (error) {
        console.error("Error processing audio URL:", error);
      }
    };

    processAudioUrl();
  }, [comment.audioUrl]);

  const handleLike = () => {
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

  const handleDislike = () => {
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
    <section className="bg-gray-800 p-5 rounded-lg mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={userData.profilePicture || avatar}
            width={40}
            height={40}
            alt=""
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
      <div className="my-3 flex justify-center w-fit">
        <div className="w-fit bg-gray-700/50 rounded-lg p-2">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
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
}

export default CommentAudioCard;
