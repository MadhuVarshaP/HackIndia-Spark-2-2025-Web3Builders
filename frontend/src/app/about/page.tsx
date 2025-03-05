"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import logo from "../../images/vivi1.png";
import ConnectWalletSection from "@/components/ConnectWalletButton";

const AboutUs: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-[#204660] to-[#5E3C8B] min-h-screen text-white font-rajdhani relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute flex justify-between w-full top-6">
        {/* Logo */}
        <div className="left-0 flex items-center justify-start space-x-3 mr-5">
          <Link href="/">
            <Image
              src={logo}
              alt="logo"
              className="ml-10 h-16 w-16 rounded-full"
            />
          </Link>
        </div>
        {/* User Avatar */}

        <ConnectWalletSection />
      </div>

      {/* Navbar */}
      <div className="flex justify-center items-center">
        <Navbar />
      </div>

      {/* Header */}
      <header className="flex justify-center items-center py-16 px-4 relative z-10 animate-fadeIn">
        <Image
          src={logo}
          alt="Vivi Logo"
          className="h-24 w-24 rounded-full border-4 border-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8] shadow-xl"
        />
        <h1 className="text-4xl font-zenDots ml-8 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
          About Vivi
        </h1>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-5xl mx-auto relative z-10">
        {/* Introduction */}
        <section
          className="mb-16 animate-fadeIn opacity-0"
          style={{ animationDelay: "0.4s" }}
        >
          <h2 className="text-2xl font-semibold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Who We Are
          </h2>
          <p className="text-lg leading-relaxed text-gray-200 tracking-wide">
            Vivi is a cutting-edge platform designed to revolutionize the way
            you interact with digital content. Our mission is to provide an
            immersive and seamless experience that integrates advanced
            technology with user-friendly design.
          </p>
        </section>

        {/* Key Features */}
        <section
          className="mb-16 animate-fadeIn opacity-0"
          style={{ animationDelay: "0.6s" }}
        >
          <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                title: "Voice-Activated Q&A",
                description:
                  "Users can ask and answer questions using voice commands, making the platform more interactive and accessible.",
                emoji: "🎤",
              },
              {
                title: "Voice-to-Text Integration",
                description:
                  "Our voice-to-text feature converts voice responses or questions into accurate text, providing a hands-free, accessible experience for users who prefer speaking over typing.",
                emoji: "📝",
              },
              {
                title: "Decentralized Knowledge Sharing",
                description:
                  "Vivi runs on a decentralized network, ensuring secure, private, and transparent data, giving users control over their knowledge and contributions.",
                emoji: "🔗",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 p-8 rounded-3xl shadow-2xl hover:scale-105 hover:-rotate-3 transition-all duration-300 ease-in-out animate-fadeIn opacity-0"
                style={{ animationDelay: `${0.7 + index * 0.2}s` }}
              >
                <div className="text-2xl mb-4">{feature.emoji}</div>
                <h3 className="text-xl font-semibold mb-3 font-zenDots">
                  {feature.title}
                </h3>
                <p className="text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Mission */}
        <section
          className="mb-16 animate-fadeIn opacity-0"
          style={{ animationDelay: "1s" }}
        >
          <h2 className="text-2xl font-semibold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-[#9F62ED] via-[#FFFFFF] to-[#3AAEF8]">
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-gray-200 tracking-wide">
            At Vivi, we strive to innovate and lead in the digital space,
            constantly enhancing our platform to meet the evolving needs of our
            users. Our goal is to empower individuals and businesses by
            providing tools that drive success and growth.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
