"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "../../../components/Navbar";
import Image from "next/image";
import avatar from "../../../images/avatar.png";
import { FaMicrophone } from "react-icons/fa";
import { IoMdArrowDropdown } from "react-icons/io";
import { LuMessageSquareText } from "react-icons/lu";
import logo from "../../../images/vivi1.png";
import Link from "next/link";
import CommentAudioCard from "@/components/CommentAudioCard";
import CommentTextCard from "@/components/CommentTextCard";
import AudioPlayer from "@/components/AudioPlayer";
import ConnectWalletSection from "@/components/ConnectWalletButton";
import { useParams } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import axios from "axios";
import { contractAddress } from "@/constants/contractAddress";
import { abi } from "@/constants/abi";
import toast, { Toaster } from "react-hot-toast";

// Types remain the same...
interface Post {
  _id: string;
  postType: "TEXT" | "VOICE";
  content: {
    text?: string;
    voice?: {
      data: string;
      contentType: string;
    };
  };
  contentHash?: string;
  creatorAddress: string;
  timestamp: number;
  likes: string[];
  dislikes: string[];
  commentCount: number;
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

interface UserData {
  name: string;
  profilePicture?: string;
}

// API request configuration
const API_CONFIG = {
  baseURL: "https://vivi-backend.vercel.app/api",
  retryDelay: 1000,
  maxRetries: 3,
};

// Reusable API caller with retry logic
const apiCall = async (url: string, options: RequestInit = {}) => {
  let attempts = 0;

  while (attempts < API_CONFIG.maxRetries) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${url}`, options);

      if (response.status === 429) {
        attempts++;
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.retryDelay * attempts)
        );
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempts === API_CONFIG.maxRetries - 1) throw error;
      attempts++;
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.retryDelay * attempts)
      );
    }
  }
};

function Details() {
  const params = useParams();
  const postId = params.id;
  const [post, setPost] = useState<Post | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [comment, setComment] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [postType, setPostType] = useState<"text" | "audio">("text");
  const { address } = useAccount();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userData, setUserData] = useState<UserData>({ name: "Anonymous" });
  const [currentUserData, setCurrentUserData] = useState<UserData>({
    name: "Anonymous",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  const { writeContract } = useWriteContract();

  // Memoized fetch functions
  const fetchPostDetails = useCallback(async () => {
    try {
      const data = await apiCall(`/posts/${postId}`);
      setPost(data);
      return data;
    } catch (error) {
      setError("Failed to load post details");
      console.error("Error fetching post details:", error);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await apiCall(`/comments/${postId}/comments`);
      if (data.status === "success") {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [postId]);

  const fetchUserData = useCallback(async (userAddress: string) => {
    try {
      const data = await apiCall(`/users/profile/${userAddress}`);
      return {
        name: data.name || "Anonymous",
        profilePicture: data.profilePicture,
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { name: "Anonymous" };
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const postData = await fetchPostDetails();

        if (isMounted && postData) {
          await Promise.all([
            fetchComments(),
            fetchUserData(postData.creatorAddress).then((data) =>
              setUserData(data)
            ),
          ]);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (postId) {
      loadInitialData();
    }

    return () => {
      isMounted = false;
    };
  }, [postId, fetchPostDetails, fetchComments, fetchUserData]);

  // Fetch current user data when address changes
  useEffect(() => {
    if (address) {
      fetchUserData(address).then((data) => setCurrentUserData(data));
    }
  }, [address, fetchUserData]);

  // IPFS upload with rate limiting
  const uploadToIPFS = async (file: File | Blob | string) => {
    const formData = new FormData();

    if (typeof file === "string") {
      const blob = new Blob([file], { type: "text/plain" });
      formData.append("file", blob);
    } else {
      formData.append("file", file);
    }

    let attempts = 0;
    toast.loading("Uploading to IPFS...", { id: "ipfs-upload" });
    while (attempts < API_CONFIG.maxRetries) {
      try {
        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              pinata_api_key: "d26b8c8b9b067edc4e44",
              pinata_secret_api_key:
                "cc601543bf1f7a0e879ec59fe958f400ea871cd1561fa920f17636f29409e0cb",
            },
          }
        );

        toast.success("Successfully uploaded to IPFS!", { id: "ipfs-upload" });
        return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          attempts++;
          toast.loading(`Retrying upload... Attempt ${attempts}`, {
            id: "ipfs-upload",
          });
          await new Promise((resolve) =>
            setTimeout(resolve, API_CONFIG.retryDelay * attempts)
          );
          continue;
        }
        toast.error("Failed to upload to IPFS", { id: "ipfs-upload" });
        throw error;
      }
    }
    toast.error("Failed to upload after multiple attempts", {
      id: "ipfs-upload",
    });
    throw new Error("Failed to upload to IPFS after multiple attempts");
  };

  const handleRecordClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          toast.success("Recording completed!");
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.success("Recording started...");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Failed to access microphone");
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleAddComment = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      toast.error("Please connect your wallet first");
      return;
    }

    if (!postId || Array.isArray(postId)) {
      alert("Invalid post ID");
      toast.error("Invalid post ID");
      return;
    }

    try {
      toast.loading("Uploading comment...", { id: "comment" });
      const formData = new FormData();
      let contentHash;

      // Upload to IPFS based on post type
      if (postType === "audio" && audioUrl) {
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        contentHash = await uploadToIPFS(audioBlob);
        formData.append("voice", audioBlob, "audio.wav");
      } else {
        contentHash = await uploadToIPFS(comment);
        formData.append("content", comment);
      }

      // Add common fields to formData
      formData.append("type", postType === "audio" ? "VOICE" : "TEXT");
      formData.append("creatorAddress", address);
      formData.append("isAnonymous", isAnonymous.toString());
      formData.append("metadataHash", contentHash);
      formData.append("contractPostId", postId);

      // Call smart contract
      const commentType = postType === "audio" ? 1 : 0; // 1 for VOICE, 0 for TEXT
      writeContract(
        {
          address: contractAddress,
          abi: abi,
          functionName: "addComment",
          args: [
            BigInt(postId), // Convert postId to BigInt
            contentHash,
            commentType,
            isAnonymous,
          ],
        },
        {
          onSuccess: async () => {
            try {
              const apiResponse = await fetch(
                `https://vivi-backend.vercel.app/api/comments/${post?._id}/comments`,
                {
                  method: "POST",
                  body: formData,
                }
              );

              if (apiResponse.ok) {
                // Reset form
                setComment("");
                setAudioUrl("");
                setPostType("text");
                setIsAnonymous(false);
                toast.success("Comment added successfully!", { id: "comment" });
                // Optionally refresh comments
                await fetchComments();
              }
            } catch (error) {
              console.error("Error saving to backend:", error);
              toast.error("Failed to save comment to backend", {
                id: "comment",
              });
            }
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed", { id: "comment" });
          },
        }
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.", {
        id: "comment",
      });
    }
  };

  const handlePostTypeSelect = (type: "text" | "audio") => {
    setPostType(type);
    setShowDropdown(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#204660] to-[#5E3C8B] min-h-screen text-white font-rajdhani">
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
      <div className="absolute flex justify-between w-full top-6">
        <div className=" left-0 flex items-center justify-start space-x-3 mr-5">
          <Link href="/">
            <Image
              src={logo}
              alt="logo"
              className="ml-10 h-16 w-16 rounded-full"
              width={20}
              height={20}
            />
          </Link>
        </div>

        <ConnectWalletSection />
      </div>
      <div className="flex justify-center items-center">
        <Navbar />
      </div>

      <main className="p-4 max-w-3xl mx-auto">
        {/* Display original post */}
        {post && (
          <section className="bg-gray-800 p-5 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={userData.profilePicture || avatar}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
                width={20}
                height={20}
              />
              <div>
                <h3 className="font-semibold">
                  {post.creatorAddress.slice(0, 6)}...
                  {post.creatorAddress.slice(-4)}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(post.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>

            {post.postType === "TEXT" && post.content.text && (
              <p className="text-lg mb-4">{post.content.text}</p>
            )}

            {post.postType === "VOICE" && post.contentHash && (
              <AudioContent post={post} />
            )}

            <div className="flex items-center gap-4 mt-4">
              <span>{post.likes.length} likes</span>
              <span>{post.dislikes.length} dislikes</span>
              <span>{post.commentCount} comments</span>
            </div>
          </section>
        )}

        <section className="mt-6 bg-gray-800 p-5 rounded-lg">
          <h2 className="text-2xl font-zenDots mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Comments
          </h2>
          <div className="flex items-start gap-3 my-2">
            <Image
              src={currentUserData.profilePicture || avatar}
              alt=""
              className="border-2 border-white h-12 w-12 rounded-full"
              width={20}
              height={20}
            />
            <div className="flex-1 flex gap-3">
              <textarea
                className="flex-1 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring"
                placeholder="Add your comments"
                rows={2}
                value={comment} // Add this
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                onClick={handleAddComment}
                className="text-[16px] font-semibold border border-[#7482F1] bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500 focus:bg-gradient-to-r focus:from-purple-500 focus:to-blue-500 py-1 px-3 rounded-xl h-fit transition duration-200 whitespace-nowrap"
              >
                Add Comment
              </button>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-4 ">
                {/* Post Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-[16px] bg-gray-800 p-3 rounded-xl flex items-center gap-2 transition-colors border border-[#7482F1]"
                  >
                    {postType === "audio" ? (
                      <>
                        <FaMicrophone className="text-purple-400" />
                        <span>Post as Audio</span>
                      </>
                    ) : (
                      <>
                        <LuMessageSquareText className="text-green-400" />
                        <span>Post as Text</span>
                      </>
                    )}
                    <IoMdArrowDropdown className="text-white" />
                  </button>
                  {showDropdown && (
                    <div className="absolute top-full mt-2 bg-gray-800 rounded shadow-lg w-40 z-10">
                      <div
                        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handlePostTypeSelect("audio")}
                      >
                        <FaMicrophone className="text-purple-400" />
                        <span>Post as Audio</span>
                      </div>
                      <div
                        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handlePostTypeSelect("text")}
                      >
                        <LuMessageSquareText className="text-green-400" />
                        <span>Post as Text</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Microphone Button */}
                <div className="flex justify-center items-center gap-2">
                  <div
                    className={`bg-gradient-to-r from-purple-500 to-blue-500 rounded-full cursor-pointer ${
                      isRecording ? "opacity-70" : "hover:opacity-90"
                    }`}
                    onClick={handleRecordClick}
                  >
                    <FaMicrophone className="h-9 w-9 text-white p-2" />
                  </div>
                  {isRecording && (
                    <span className="text-red-500 flex items-center gap-2 ">
                      <span className="animate-pulse h-2 w-2 rounded-full bg-red-500"></span>
                      Recording...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label
                  className={`relative inline-block w-12 h-6 cursor-pointer ${
                    isAnonymous ? "bg-blue-600" : "bg-gray-700"
                  } rounded-full transition-colors`}
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(!isAnonymous)}
                  />
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform peer-checked:translate-x-6" />
                </label>
                <span className="text-sm text-white">
                  {isAnonymous ? "Go Incognito" : "Go Public"}
                </span>
              </div>
            </div>
            {audioUrl && (
              <div className="w-full bg-gray-700/50 rounded-lg p-2">
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            )}
          </div>
        </section>
        {/* Replace the existing comment cards with this */}
        <div className="space-y-4">
          {comments?.map((comment) => {
            if (comment.commentType === "TEXT") {
              return (
                <CommentTextCard
                  key={comment._id}
                  comment={{
                    _id: comment._id,
                    content:
                      typeof comment.content === "object" &&
                      comment.content?.text
                        ? comment.content.text
                        : (comment.content as string) || "",
                    creatorAddress: comment.creatorAddress,
                    isAnonymous: comment.isAnonymous,
                    createdAt: comment.createdAt,
                    likes: comment.likes || 0,
                    dislikes: comment.dislikes || 0,
                  }}
                />
              );
            } else if (comment.commentType === "VOICE") {
              let audioUrl;
              try {
                if (comment.content?.voice?.data) {
                  // Check if the data is already a string or needs conversion
                  const base64String =
                    typeof comment.content.voice.data === "object"
                      ? Buffer.from(comment.content.voice.data).toString(
                          "base64"
                        )
                      : comment.content.voice.data;

                  // Create blob from base64
                  const byteCharacters = Buffer.from(
                    base64String,
                    "base64"
                  ).toString("binary");
                  const byteNumbers = new Array(byteCharacters.length);

                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }

                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: "audio/wav" });
                  audioUrl = URL.createObjectURL(blob);
                }
              } catch (error) {
                console.error("Error converting audio data:", error);
                audioUrl = comment.contentHash;
              }

              return (
                <CommentAudioCard
                  key={comment._id}
                  comment={{
                    _id: comment._id,
                    audioUrl: audioUrl || "",
                    creatorAddress: comment.creatorAddress,
                    isAnonymous: comment.isAnonymous,
                    createdAt: comment.createdAt,
                    likes: comment.likes || 0,
                    dislikes: comment.dislikes || 0,
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </main>
    </div>
  );
}

export default Details;

const AudioContent: React.FC<{ post: Post | null }> = ({ post }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(() => {
    if (post?.postType === "VOICE") {
      if (post.content?.voice?.data) {
        const base64String =
          typeof post.content.voice.data === "object"
            ? Buffer.from(post.content.voice.data).toString("base64")
            : post.content.voice.data;

        // Create blob from base64
        const byteCharacters = Buffer.from(base64String, "base64").toString(
          "binary"
        );
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Cleanup
        return () => {
          URL.revokeObjectURL(url);
        };
      }
    }
  }, [post]);

  if (!audioUrl) return null;

  return <AudioPlayer audioUrl={audioUrl} />;
};
