"use client";
import React, { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { IoWallet } from "react-icons/io5";
import Image, { StaticImageData } from "next/image";
import avatar from "../images/avatar.png"; // Adjust the import path as needed
import { useAccount } from "wagmi";

interface ConnectWalletButtonProps {
  className?: string;
}

const ConnectWalletSection: React.FC<ConnectWalletButtonProps> = ({
  className = "",
}) => {
  const { address } = useAccount();
  const [avatarUrl, setAvatarUrl] = useState<string | StaticImageData>(avatar);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [address]);
  return (
    <div className="right-0 flex items-center justify-end space-x-3 mr-5">
      <Image
        width={20}
        height={20}
        src={avatarUrl}
        alt="avatar"
        className="h-12 w-12"
      />
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName }) => {
          return (
            <button
              onClick={show}
              className={`flex items-center justify-center gap-2 bg-black bg-opacity-40 font-semibold backdrop-blur-md p-4 text-[20px] rounded-full ${className}`}
            >
              <IoWallet />
              {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
};

export default ConnectWalletSection;
