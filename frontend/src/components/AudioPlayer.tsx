import React, { useState, useRef, useEffect } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

type AudioPlayerProps = {
  audioUrl: string | undefined;
};

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load(); // Reload audio when URL changes
    }
  }, [audioUrl]);

  useEffect(() => {
    // Initialize audio element on client side only
    audioRef.current = new Audio(audioUrl);

    const audio = audioRef.current;
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime)
    );
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      if (audio) {
        audio.removeEventListener("loadedmetadata", () =>
          setDuration(audio.duration)
        );
        audio.removeEventListener("timeupdate", () =>
          setCurrentTime(audio.currentTime)
        );
        audio.removeEventListener("ended", () => setIsPlaying(false));
        audio.pause();
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Generate wave bars
  const generateWaveBars = () => {
    return Array.from({ length: 40 }, (_, i) => {
      const height = Math.random() * 50;
      const isActive = (currentTime / duration) * 40 > i;

      return (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-200 ${
            isActive ? "bg-purple-400" : "bg-purple-200/30"
          }`}
          style={{ height: `${height}%` }}
        />
      );
    });
  };

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-1 w-full">
      <button
        onClick={togglePlay}
        className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {isPlaying ? (
          <FaPause className="text-white h-5 w-5" />
        ) : (
          <FaPlay className="text-white h-5 w-5 pl-1 " />
        )}
      </button>

      <div className="flex-1 h-16">
        <div className="relative h-full flex items-center gap-0.5">
          {generateWaveBars()}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
