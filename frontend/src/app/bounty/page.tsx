"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Image from "next/image";
import logo from "../../images/vivi1.png";
import Link from "next/link";
import PendingBountyAudioCard from "../../components/PendingBountyAudioCard";
import PendingBountyTextCard from "../../components/PendingBountyTextCard";
import ClosedBountyAudioCard from "@/components/ClosedBountyAudioCard";
import ClosedBountyTextCard from "@/components/ClosedBountyTextCard";
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
  bountyStatus: string;
  bountyPaidTo: string;
}

const Bounty: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"closed" | "pending">(
    "pending"
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [postCount, setPostCount] = useState(0);
  const { address } = useAccount();

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!address) return;

      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/posts/user/${address}`
        );
        if (response.ok) {
          const { data, count } = await response.json();
          const bountyPosts = data.filter((post: Post) => post.hasBounty);
          setPosts(bountyPosts);
          setPostCount(count);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };

    fetchUserPosts();
  }, [address]);

  const pendingBountyPosts = posts.filter(
    (post) => post.bountyStatus === "OPEN"
  );
  const closedBountyPosts = posts.filter(
    (post) => post.bountyStatus === "CLOSED"
  );

  return (
    <div className="bg-gradient-to-br from-[#204660] to-[#5E3C8B] min-h-screen text-white font-rajdhani">
      <div className="absolute flex justify-between w-full top-6">
        <div className=" left-0 flex items-center justify-start space-x-3 mr-5">
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
        <h2 className="text-3xl font-zenDots mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
          Bounty Management
        </h2>
        <div className="flex space-x-4 items-center mb-4">
          <p>Choose Filters:</p>
          <button
            className={`text-[16px] font-semibold border border-[#7482F1] py-1 px-3 rounded-xl h-fit transition duration-200 whitespace-nowrap ${
              activeFilter === "closed"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500"
            }`}
            onClick={() => setActiveFilter("closed")}
          >
            Closed Bounties
          </button>
          <button
            className={`text-[16px] font-semibold border border-[#7482F1] py-1 px-3 rounded-xl h-fit transition duration-200 whitespace-nowrap ${
              activeFilter === "pending"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500"
            }`}
            onClick={() => setActiveFilter("pending")}
          >
            Pending Bounties
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeFilter === "pending" && (
            <>
              {pendingBountyPosts.length > 0 ? (
                pendingBountyPosts.map((post) =>
                  post.postType === "VOICE" ? (
                    <PendingBountyAudioCard
                      key={post._id}
                      audioUrl={getAudioUrl(post)}
                      timestamp={post.timestamp}
                      postId={post.postId}
                      bountyAmount={post.bountyAmount}
                      responseCount={post.commentCount}
                    />
                  ) : (
                    <PendingBountyTextCard
                      key={post._id}
                      content={post.content.text || ""}
                      timestamp={post.timestamp}
                      postId={post.postId}
                      bountyAmount={post.bountyAmount}
                      responseCount={post.commentCount}
                    />
                  )
                )
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-xl text-gray-300">
                    No pending bounty posts available
                  </p>
                </div>
              )}
            </>
          )}
          {activeFilter === "closed" && (
            <>
              {closedBountyPosts.length > 0 ? (
                closedBountyPosts.map((post) =>
                  post.postType === "VOICE" ? (
                    <ClosedBountyAudioCard
                      key={post._id}
                      audioUrl={getAudioUrl(post)}
                      timestamp={post.timestamp}
                      postId={post.postId}
                      bountyAmount={post.bountyAmount}
                      responseCount={post.commentCount}
                      rewardedAddress={post.bountyPaidTo}
                    />
                  ) : (
                    <ClosedBountyTextCard
                      key={post._id}
                      content={post.content.text || ""}
                      timestamp={post.timestamp}
                      postId={post.postId}
                      bountyAmount={post.bountyAmount}
                      responseCount={post.commentCount}
                      rewardedAddress={post.bountyPaidTo}
                    />
                  )
                )
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-xl text-gray-300">
                    No closed bounty posts available
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper function to get audio URL from post
const getAudioUrl = (post: Post) => {
  let audioUrl = "";
  try {
    if (post.content?.voice?.data) {
      const base64String =
        typeof post.content.voice.data === "object"
          ? Buffer.from(post.content.voice.data).toString("base64")
          : post.content.voice.data;

      const byteCharacters = Buffer.from(base64String, "base64").toString(
        "binary"
      );
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/wav" });
      audioUrl = URL.createObjectURL(blob);
    } else if (post.contentHash) {
      audioUrl = post.contentHash;
    }
  } catch (error) {
    console.error("Error converting audio data:", error);
    audioUrl = post.contentHash;
  }
  return audioUrl;
};

export default Bounty;
