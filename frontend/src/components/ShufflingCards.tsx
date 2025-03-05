"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import React from "react";

const ShufflingCards: React.FC = () => {
  const [positions, setPositions] = useState([
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 250, y: 0 },
    { id: 2, x: 0, y: 250 },
    { id: 3, x: 250, y: 250 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => {
        return [
          { ...prev[3], x: 0, y: 0 },
          { ...prev[0], x: 250, y: 0 },
          { ...prev[1], x: 250, y: 250 },
          { ...prev[2], x: 0, y: 250 },
        ];
      });
    }, 4000); // Change position every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const features = [
    "Decentralized Knowledge Sharing",
    "Voice-based Interaction",
    "Voice-to-Text Conversion",
    "Enhanced Privacy with Blockchain",
  ];

  const emojis = ["📚", "🎙️", "🗣️", "🔒"]; // Emojis for each feature

  return (
    <div className="relative w-[500px] h-[500px]">
      {positions.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ x: card.x, y: card.y }}
          animate={{ x: card.x, y: card.y }}
          transition={{ duration: 1, type: "spring" }}
          className="absolute w-[220px] h-[220px] bg-white bg-opacity-15 text-white text-center flex items-center justify-center rounded-lg shadow-2xl border-4 border-purple-300 backdrop-blur-lg transform hover:scale-110 hover:rotate-[10deg] transition-transform"
        >
          <div className="relative w-full h-full p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-40 rounded-lg" />
            <div className="relative z-10 text-3xl mb-2">{emojis[index]}</div>{" "}
            {/* Emoji added here */}
            <h3 className="relative z-10 text-lg font-bold font-zenDots">
              {features[index]}
            </h3>
            <p className="relative z-10 text-sm mt-2 font-medium">
              {index === 0 &&
                "Share knowledge and insights securely on a decentralized platform."}
              {index === 1 &&
                "Interact seamlessly using voice commands and responses."}
              {index === 2 &&
                "Convert voice inputs to text for better accessibility."}
              {index === 3 &&
                "Ensure data privacy and integrity with blockchain."}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ShufflingCards;
