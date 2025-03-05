"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import Image, { StaticImageData } from "next/image";
import avatar from "../../images/avatar.png";
import { FaMicrophone } from "react-icons/fa";
import { IoMdArrowDropdown, IoMdImages } from "react-icons/io";
import { LuMessageSquareText } from "react-icons/lu";
import AudioCard from "../../components/AudioCard";
import TextCard from "../../components/TextCard";
import logo from "../../images/vivi1.png";
import Link from "next/link";
import AudioPlayer from "../../components/AudioPlayer";
import ConnectWalletSection from "@/components/ConnectWalletButton";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import axios from "axios";
import { contractAddress } from "@/constants/contractAddress";
import { abi } from "@/constants/abi";
import toast, { Toaster } from "react-hot-toast";

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
}

const Dashboard: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [postType, setPostType] = useState<"text" | "audio">("text");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | StaticImageData>(avatar);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isUploading, setIsUploading] = useState(false);
  const { data: postCount } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "postCount",
  });
  const [posts, setPosts] = useState<Post[]>([]);

  const { writeContract } = useWriteContract();

  const convertBigIntToString = (value: bigint | null | undefined): string => {
    if (!value) return "1";
    return (Number(value.toString()) + 1).toString();
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file); // Store the file instead of just the name
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!address) return;

      try {
        const response = await fetch(
          `https://vivi-backend.vercel.app/api/users/profile/${address}`
        );
        if (response.ok) {
          const userData = await response.json();
          if (userData.profilePicture) {
            setAvatarUrl(userData.profilePicture);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [address]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        "https://vivi-backend.vercel.app/api/posts"
      );
      if (response.status) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  const uploadToIPFS = async (file: File | Blob | string) => {
    try {
      const formData = new FormData();

      if (typeof file === "string") {
        // If it's text content
        const blob = new Blob([file], { type: "text/plain" });
        formData.append("file", blob);
      } else {
        // If it's a file or blob (audio/image)
        formData.append("file", file);
      }

      toast.loading("Uploading to IPFS...", { id: "ipfs-upload" });

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
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      toast.error("Failed to upload to IPFS", { id: "ipfs-upload" });
      throw error;
    }
  };

  function makeEnhancedDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      // Smoother distortion curve
      curve[i] = Math.tanh(amount * x) * Math.cos(x * deg);

      // Add subtle harmonics
      if (i % 2 === 0) {
        curve[i] *= 1.05;
      }
    }
    return curve;
  }

  const handlePost = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const currentTimestamp = Date.now();
      const newPostId = convertBigIntToString(postCount as bigint);

      // Common fields
      formData.append("author", address);
      formData.append("postId", newPostId);
      formData.append("isAnonymous", isAnonymous.toString());
      formData.append("timestamp", currentTimestamp.toString());
      formData.append("type", postType === "audio" ? "VOICE" : "TEXT");

      // Handle content based on post type
      if (postType === "audio" && audioUrl) {
        // Convert audio URL to blob
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        formData.append("voice", audioBlob, "audio.wav");
      } else {
        formData.append("content", content);
      }
      let contentHash;

      if (postType === "audio" && audioUrl) {
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        contentHash = await uploadToIPFS(audioBlob);
      } else {
        contentHash = await uploadToIPFS(content);
      }

      const metadata = {
        content: contentHash,
        type: postType,
        isAnonymous,
        timestamp: currentTimestamp,
        image: selectedImage ? await uploadToIPFS(selectedImage) : null,
      };

      const metadataHash = await uploadToIPFS(JSON.stringify(metadata));
      formData.append("metadataHash", metadataHash);

      // Call contract
      writeContract(
        {
          address: contractAddress,
          abi: abi,
          functionName: "createPost",
          args: [metadataHash, postType === "audio" ? 1 : 0],
        },
        {
          onSuccess: async () => {
            try {
              const apiResponse = await axios.post(
                "https://vivi-backend.vercel.app/api/posts",
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              if (apiResponse.data.status === "success") {
                // Reset form
                setContent("");
                setAudioUrl("");
                setSelectedImage(null);
                setPostType("text");
                setIsAnonymous(false);
                setRefreshTrigger((prev) => prev + 1);
                await fetchPosts();
                toast.success("Post created successfully!");
              }
            } catch (error) {
              console.error("Error saving to backend:", error);
              toast.error("Failed to save post to backend");
            }
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed");
            setIsUploading(false);
          },
        }
      );
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      setIsUploading(false);
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
      {/* Header */}
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

      {/* Main Section */}
      <main className="p-4 max-w-3xl mx-auto">
        {/* Create a New Post */}
        <section className="mb-6 bg-gray-800 p-5 rounded-lg">
          <h2 className="text-3xl font-zenDots mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Create a new Post
          </h2>

          <div className="flex my-2 space-x-3">
            <Image
              src={avatarUrl}
              alt=""
              height={20}
              width={20}
              className="border-2 border-white h-12 w-12 rounded-full"
            />
            <textarea
              className="w-full bg-gray-700 text-white p-2 rounded-md mb-3 focus:outline-none focus:ring"
              placeholder="What's on your mind?"
              rows={3}
              value={content} // Add this
              onChange={(e) => setContent(e.target.value)} // Add this
            />
            <button
              onClick={handlePost}
              className="text-[18px] font-semibold border border-[#7482F1] bg-transparent hover:bg-gradient-to-r from-purple-500 to-blue-500 focus:bg-gradient-to-r focus:from-purple-500 focus:to-blue-500 py-1 px-3 rounded-xl h-fit transition duration-200"
            >
              Post
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
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
                <div className="flex flex-col items-center">
                  <div
                    className={`bg-gradient-to-r from-purple-500 to-blue-500 rounded-full cursor-pointer ${
                      isRecording ? "opacity-70" : "hover:opacity-90"
                    }`}
                    onClick={handleRecordClick}
                  >
                    <FaMicrophone className="h-9 w-9 text-white p-2" />
                  </div>
                </div>

                {/* Attach Image */}
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full cursor-pointer"
                  onClick={handleImageClick}
                >
                  <IoMdImages className="h-9 w-9 text-white p-2" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                {selectedImage && (
                  <span className="text-sm text-gray-300 ml-[-10px]">
                    {selectedImage.name} {/* Display file name */}
                  </span>
                )}
              </div>

              {/* Anonymous Toggle */}
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
            {isRecording && (
              <span className="text-red-500 flex items-center gap-2 mt-2">
                <span className="animate-pulse h-2 w-2 rounded-full bg-red-500"></span>
                Recording...
              </span>
            )}
            {audioUrl && (
              <div className="w-full bg-gray-700/50 rounded-lg p-2">
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            )}
          </div>
        </section>

        {/* Posts */}
        <div className="space-y-4">
          {posts?.map((post) => {
            if (post.postType === "TEXT") {
              return (
                <TextCard
                  key={post._id}
                  _id={post._id}
                  content={{
                    text: post.content.text, // Handle both object and string content
                    image: post.content.image || undefined,
                  }}
                  creatorAddress={post.creatorAddress}
                  timestamp={post.timestamp}
                  likes={post.likes}
                  dislikes={post.dislikes}
                  commentCount={post.commentCount}
                  postId={post.postId}
                />
              );
            } else if (post.postType === "VOICE") {
              const AudioProcessor: React.FC = () => {
                const [audioUrl, setAudioUrl] = React.useState<string>(
                  post.contentHash || ""
                );
                const [isProcessing, setIsProcessing] = React.useState(true);
                const audioContextRef = React.useRef<AudioContext | null>(null);

                React.useEffect(() => {
                  const processAudio = async (
                    byteArray: Uint8Array
                  ): Promise<string> => {
                    if (post.isAnonymous) {
                      try {
                        audioContextRef.current = new AudioContext();
                        const audioContext = audioContextRef.current;

                        // Create a new ArrayBuffer and copy the data
                        const arrayBuffer = new ArrayBuffer(byteArray.length);
                        const view = new Uint8Array(arrayBuffer);
                        view.set(byteArray);

                        const audioBuffer = await audioContext.decodeAudioData(
                          arrayBuffer
                        );

                        // Rest of your audio processing code...
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;

                        // Noise gate to reduce background noise
                        const noiseGate =
                          audioContext.createDynamicsCompressor();
                        noiseGate.threshold.value = -50;
                        noiseGate.knee.value = 40;
                        noiseGate.ratio.value = 12;
                        noiseGate.attack.value = 0;
                        noiseGate.release.value = 0.25;

                        // High-pass filter to remove low frequency noise
                        const highpass = audioContext.createBiquadFilter();
                        highpass.type = "highpass";
                        highpass.frequency.value = 80;
                        highpass.Q.value = 0.7;

                        // Bass boost
                        const bassBoost = audioContext.createBiquadFilter();
                        bassBoost.type = "lowshelf";
                        bassBoost.frequency.value = 200;
                        bassBoost.gain.value = 15;

                        // Carriers for robotic effect
                        const carrier1 = audioContext.createOscillator();
                        carrier1.type = "square";
                        carrier1.frequency.value = 30; // Lower frequency for deeper voice

                        const carrier2 = audioContext.createOscillator();
                        carrier2.type = "sawtooth";
                        carrier2.frequency.value = 50; // Additional bass frequency

                        // Modulation gains
                        const modGain1 = audioContext.createGain();
                        modGain1.gain.value = 0.3; // Reduced modulation for clarity

                        const modGain2 = audioContext.createGain();
                        modGain2.gain.value = 0.2;

                        // Pitch shifting
                        const pitchShift = audioContext.createBiquadFilter();
                        pitchShift.type = "bandpass";
                        pitchShift.frequency.value = 500; // Lower frequency for deeper voice
                        pitchShift.Q.value = 8; // Reduced Q for smoother sound

                        // Enhanced distortion
                        const distortion = audioContext.createWaveShaper();
                        distortion.curve = makeEnhancedDistortionCurve(200);

                        // Main compressor for consistent volume
                        const mainCompressor =
                          audioContext.createDynamicsCompressor();
                        mainCompressor.threshold.value = -24;
                        mainCompressor.knee.value = 30;
                        mainCompressor.ratio.value = 12;
                        mainCompressor.attack.value = 0.003;
                        mainCompressor.release.value = 0.25;

                        // Final EQ stage
                        const finalEQ = audioContext.createBiquadFilter();
                        finalEQ.type = "peaking";
                        finalEQ.frequency.value = 1000;
                        finalEQ.Q.value = 1;
                        finalEQ.gain.value = -6; // Reduce harsh frequencies

                        // Final gain stage
                        const mainGain = audioContext.createGain();
                        mainGain.gain.value = 1.2;

                        const destination =
                          audioContext.createMediaStreamDestination();

                        // Connect the processing chain
                        source
                          .connect(noiseGate)
                          .connect(highpass)
                          .connect(bassBoost)
                          .connect(pitchShift)
                          .connect(distortion)
                          .connect(mainCompressor)
                          .connect(finalEQ)
                          .connect(mainGain);

                        // Connect modulation
                        carrier1.connect(modGain1);
                        carrier2.connect(modGain2);
                        modGain1.connect(mainGain.gain);
                        modGain2.connect(mainGain.gain);

                        mainGain.connect(destination);

                        // Start oscillators
                        carrier1.start();
                        carrier2.start();

                        return new Promise((resolve, reject) => {
                          const mediaRecorder = new MediaRecorder(
                            destination.stream,
                            {
                              mimeType: "audio/webm;codecs=opus",
                              bitsPerSecond: 256000, // Increased bitrate for better quality
                            }
                          );
                          const chunks: Blob[] = [];

                          mediaRecorder.ondataavailable = (e: BlobEvent) =>
                            chunks.push(e.data);

                          mediaRecorder.onstop = () => {
                            carrier1.stop();
                            carrier2.stop();
                            const modifiedBlob = new Blob(chunks, {
                              type: "audio/webm",
                            });
                            resolve(URL.createObjectURL(modifiedBlob));
                          };

                          mediaRecorder.onerror = () =>
                            reject(new Error("MediaRecorder error"));

                          source.start(0);
                          mediaRecorder.start();

                          setTimeout(() => {
                            mediaRecorder.stop();
                            source.stop();
                          }, audioBuffer.duration * 1000);
                        });
                      } catch (error) {
                        console.error("Error processing audio", error);
                        throw error;
                      }
                    } else {
                      const blob = new Blob([byteArray], { type: "audio/wav" });
                      return URL.createObjectURL(blob);
                    }
                  };

                  const initializeAudio = async () => {
                    setIsProcessing(true);
                    try {
                      if (post.content?.voice?.data) {
                        const base64String =
                          typeof post.content.voice.data === "object"
                            ? Buffer.from(post.content.voice.data).toString(
                                "base64"
                              )
                            : post.content.voice.data;

                        const byteArray = Uint8Array.from(
                          atob(base64String),
                          (c) => c.charCodeAt(0)
                        );
                        const url = await processAudio(byteArray);
                        setAudioUrl(url);
                      }
                    } catch (error) {
                      console.error("Error initializing audio:", error);
                      setAudioUrl(post.contentHash || "");
                    } finally {
                      setIsProcessing(false);
                    }
                  };

                  initializeAudio();

                  return () => {
                    if (audioUrl && audioUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(audioUrl);
                    }
                    if (audioContextRef.current) {
                      audioContextRef.current.close();
                    }
                  };
                }, [
                  post.content?.voice?.data,
                  post.contentHash,
                  post.isAnonymous,
                ]);

                return (
                  <AudioCard
                    key={post._id}
                    _id={post._id}
                    audioUrl={audioUrl}
                    creatorAddress={post.creatorAddress}
                    timestamp={post.timestamp}
                    likes={post.likes}
                    dislikes={post.dislikes}
                    commentCount={post.commentCount}
                    postId={post.postId}
                    isProcessing={isProcessing}
                  />
                );
              };

              // Return the component with a key
              return <AudioProcessor key={post._id} />;
            }
            return null;
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
