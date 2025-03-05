"use client"

import React from "react";
import { motion } from "framer-motion";
import voice from "../images/voice-gradient.png";
import Image from "next/image";

const VoiceEffect: React.FC = () => {
  const circleVariants = {
    animate: {
      scale: [1, 2], // Slow, uniform expanding effect for each ring
      opacity: [0.2, 0.1], // Opacity decreases as the rings expand outward
      transition: {
        duration: 6, // Longer duration for slow expansion
        repeat: Infinity, // Repeat infinitely
        ease: "easeOut", // Smooth transition for natural movement
      },
    },
  };

  const ringsCount = 3; // Number of rings to create

  return (
    <div className="relative flex items-center justify-center h-72 w-72"> {/* Increase the overall size to fit bigger image */}
      {/* Animated Consecutive Thin Rings */}
      {[...Array(ringsCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            height: `${80 + i * 60}px`, // Adjust the rings to have more space between them
            width: `${80 + i * 60}px`,
            border: `1px solid #6D99F1`, // Thin, light blue border
            background: "transparent", // No background effect, just ring lines
          }}
          variants={circleVariants}
          initial={{ scale: 1, opacity: 0.1 }} // Set initial opacity to higher value
          animate="animate"
        />
      ))}

      {/* Center Microphone Icon */}
      <div className="relative flex items-center justify-center rounded-full overflow-hidden">
        <Image
          src={voice}
          alt="Voice Graphic"
          className="h-28 w-28 object-cover" // Increased size of the image
        />
      </div>
    </div>
  );
};

export default VoiceEffect;
