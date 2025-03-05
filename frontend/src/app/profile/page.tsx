"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Image, { StaticImageData } from "next/image";
import avatar from "../../images/avatar.png"; // Default avatar
import logo from "../../images/vivi1.png";
import Link from "next/link";
import ViewAudioCard from "@/components/ViewAudioCard";
import ViewTextCard from "@/components/ViewTextCard";
import ConnectWalletSection from "@/components/ConnectWalletButton";
import { useAccount } from "wagmi";

interface VoiceData {
  data: string | Buffer;
  contentType: string;
  fileName: string;
  fileSize: number;
}

interface PostContent {
  text?: string;
  image?: string;
  voice?: VoiceData;
}

interface Post {
  _id: string;
  contentHash: string;
  postId: number;
  postType: "TEXT" | "VOICE";
  content: PostContent;
  creatorAddress: string;
  status: string;
  bountyAmount: string;
  bountyToken: string;
  likes: string[];
  dislikes: string[];
  commentCount: number;
  isAnonymous: boolean;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  hasBounty: boolean;
}

const Profile: React.FC = () => {
  const { address } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | StaticImageData>(avatar);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!address) return;

      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/users/profile/${address}`
        );
        if (response.ok) {
          const userData = await response.json();
          setName(userData.name || "");
          setBio(userData.bio || "");
          // If the user has an avatar URL from the backend
          if (userData.profilePicture) {
            setAvatarUrl(userData.profilePicture);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      if (!address) return;

      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/posts/user/${address}`
        );
        if (response.ok) {
          const { data, count } = await response.json();
          setPosts(data);
          setPostCount(count);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };

    fetchUserPosts();

    fetchUserProfile();
  }, [address]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save changes, you can connect this to a backend or local storage
  };

  // Handle avatar image selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUrl(URL.createObjectURL(file)); // Update avatar image with string URL
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioUrl, setAudioUrl] = useState<string>("");
  return (
    <div className="bg-gradient-to-br from-[#204660] to-[#5E3C8B] min-h-screen text-white font-rajdhani">
      <div className="absolute flex justify-between w-full top-6">
        <div className="left-0 flex items-center justify-start space-x-3 mr-5">
          <Link href="/">
            <Image
              src={logo}
              alt="logo"
              className="ml-10 h-16 w-16 rounded-full"
            />
          </Link>
        </div>

        <ConnectWalletSection />
      </div>
      <div className="flex justify-center items-center">
        <Navbar />
      </div>

      <main className="p-4 max-w-3xl mx-auto">
        {/* Create a new Post */}
        <section className="mb-6 bg-gray-800 p-5 rounded-lg">
          <div className="flex gap-5 items-center">
            <div className="relative">
              <Image
                src={avatarUrl}
                alt="avatar"
                width={30}
                height={30}
                className="border-2 border-white h-20 w-20 rounded-full object-cover"
              />
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute bottom-0 right-0 opacity-0 cursor-pointer"
                />
              )}
            </div>
            <div className="flex my-2 space-x-3">
              <div className="flex flex-col">
                <p className="text-[24px] font-semibold truncate">
                  {isEditing ? (
                    <input
                      type="text"
                      className="bg-transparent text-white w-full focus:outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    name
                  )}
                </p>
                <div>
                  {isEditing ? (
                    <textarea
                      className="bg-transparent text-white w-full focus:outline-none"
                      placeholder="Write a description about yourself"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  ) : (
                    <p>{bio}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end w-full">
                {isEditing ? (
                  <button
                    className="border border-white bg-transparent text-white p-2 rounded-md h-fit"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="border border-white bg-transparent text-white p-2 rounded-md h-fit"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="flex justify-between items-center">
          <div className="flex space-x-5 items-center">
            <h2 className="text-2xl font-zenDots mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
              My Posts
            </h2>
            <p>{postCount} posts</p>
          </div>
          <p className="cursor-pointer hover:underline">See all</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post) => {
            if (post.postType === "VOICE") {
              let newaudioUrl;
              try {
                if (post.content?.voice?.data) {
                  // Check if the data is already a string or needs conversion
                  const base64String =
                    typeof post.content.voice.data === "object"
                      ? Buffer.from(post.content.voice.data).toString("base64")
                      : post.content.voice.data;

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
                  newaudioUrl = URL.createObjectURL(blob);
                } else if (post.contentHash) {
                  newaudioUrl = post.contentHash;
                }

                return (
                  <ViewAudioCard
                    key={post._id}
                    audioUrl={newaudioUrl}
                    timestamp={post.timestamp}
                    postId={post.postId}
                    id={post._id}
                    hasBounty={post.hasBounty}
                  />
                );
              } catch (error) {
                console.error("Error converting audio data:", error);
                return (
                  <ViewAudioCard
                    key={post._id}
                    audioUrl={post.contentHash}
                    timestamp={post.timestamp}
                    postId={post.postId}
                    id={post._id}
                    hasBounty={post.hasBounty}
                  />
                );
              }
            } else {
              return (
                <ViewTextCard
                  key={post._id}
                  content={post.content || ""}
                  timestamp={post.timestamp}
                  postId={post.postId}
                  id={post._id}
                  hasBounty={post.hasBounty}
                />
              );
            }
          })}
        </div>
      </main>
    </div>
  );
};

export default Profile;
