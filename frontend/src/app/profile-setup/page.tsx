"use client";

import React, { useState } from "react";
import Image from "next/image";
import header from "../../images/header.png";
import axios from "axios";
import ConnectWalletSection from "@/components/ConnectWalletButton";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

const ProfileSetup: React.FC = () => {
  const account = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    ensName: "",
    bio: "",
    profilePicture: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));

      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const uploadToIPFS = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

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

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let profilePictureHash = null;

      // Upload image to Pinata if a profile picture is selected
      if (formData.profilePicture) {
        const ipfsUrl = await uploadToIPFS(formData.profilePicture);
        profilePictureHash = ipfsUrl;
      }
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("ensName", formData.ensName);
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("walletAddress", account.address || "");

      if (profilePictureHash) {
        formDataToSend.append("profilePictureHash", profilePictureHash);
      }

      const response = await axios.post(
        "https://vivi-backend.vercel.app/api/users/profile",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Wallet-Address": account.address,
          },
        }
      );

      if (response.data) {
        router.push("/post"); // Redirect after successful submission
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      // Handle error (show toast notification, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-rajdhani">
      <div className="bg-gradient-to-br from-[#204660] to-[#5E3C8B] min-h-screen flex flex-col items-center text-white">
        <div className="absolute top-0 w-full flex justify-between items-center p-6">
          <header className="flex items-center space-x-2">
            <Image
              src={header}
              alt="Header Logo"
              width={180}
              height={90}
              className="h-30 w-60"
            />
          </header>
          <ConnectWalletSection />
        </div>

        <div className="mt-32 w-full max-w-lg p-8 bg-black bg-opacity-40 backdrop-blur-md rounded-2xl">
          <h2 className="text-3xl font-zenDots font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Complete Your Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-lg">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 rounded-lg bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#9F62ED]"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-lg">
                Lens ID
              </label>
              <input
                type="text"
                value={formData.ensName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ensName: e.target.value }))
                }
                className="w-full p-3 rounded-lg bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#9F62ED]"
                placeholder="Enter your Lens ID"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-lg">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full p-3 rounded-lg bg-white bg-opacity-10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#9F62ED]"
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-lg">
                Profile Picture
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-white hover:bg-opacity-5">
                  {previewUrl ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image
                        src={previewUrl}
                        alt="Profile preview"
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-7">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-400">
                        Click to upload profile picture
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-[#9F62ED] to-[#3AAEF8] hover:opacity-90 transition-opacity"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
