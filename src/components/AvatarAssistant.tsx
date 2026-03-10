import React, { useEffect, useRef, useState } from "react";

interface AvatarMessage {
  text: string;
  type: "greeting" | "help" | "dance" | "talk";
}

const AvatarAssistant: React.FC = () => {
  const [isTalking, setIsTalking] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [particlePositions, setParticlePositions] = useState<
    Array<{ top: number; left: number }>
  >([]);
  const avatarRef = useRef<HTMLDivElement>(null);

  const messages: AvatarMessage[] = [
    { text: "Hey there! I'm your AI assistant! 👋", type: "greeting" },
    { text: "Need help with anything? Just ask!", type: "help" },
    { text: "Let me show you some moves! 💃", type: "dance" },
    { text: "I love helping you build amazing websites!", type: "talk" },
    { text: "Want to see me dance? Click me!", type: "dance" },
    { text: "I'm here to make your experience awesome!", type: "help" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage.text);
      setIsTalking(true);

      setTimeout(() => setIsTalking(false), 3000);
    }, 8000);

    return () => clearInterval(interval);
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 30;
      const y = 70 + (e.clientY / window.innerHeight) * 20;
      setPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleAvatarClick = () => {
    setIsDancing(true);
    setCurrentMessage("Wooo! Let's dance! 🎵");
    setIsTalking(true);

    // Generate particle positions
    const newParticles = [...Array(6)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
    }));
    setParticlePositions(newParticles);

    setTimeout(() => {
      setIsDancing(false);
      setIsTalking(false);
      setParticlePositions([]);
    }, 5000);
  };

  return (
    <div
      ref={avatarRef}
      className="fixed z-50 cursor-pointer transition-all duration-300 ease-out"
      style={{
        left: `${position.x}%`,
        bottom: `${position.y}px`,
        transform: "translateX(-50%)",
      }}
      onClick={handleAvatarClick}
    >
      {/* Avatar Container */}
      <div className={`relative ${isDancing ? "animate-bounce" : ""}`}>
        {/* Speech Bubble */}
        {isTalking && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-800">
              {currentMessage}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2">
              <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white/90"></div>
            </div>
          </div>
        )}

        {/* Avatar Body */}
        <div className="relative w-20 h-24">
          {/* Head */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full border-2 border-pink-400 shadow-lg">
            {/* Hair */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-8 bg-black rounded-t-full -mt-2"></div>

            {/* Face */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Eyes */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
              </div>

              {/* Mouth */}
              <div
                className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-pink-600 rounded-b-full ${isTalking ? "animate-pulse" : ""}`}
              ></div>
            </div>
          </div>

          {/* Body */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-t-lg border-2 border-pink-600 shadow-lg">
            {/* Bikini Top */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-14 h-8 bg-gradient-to-br from-pink-300 to-pink-400 rounded-t-lg border border-pink-500">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-pink-200 rounded-full"></div>
            </div>
          </div>

          {/* Arms */}
          <div
            className={`absolute top-12 left-0 w-3 h-8 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full border border-pink-400 ${isDancing ? "animate-pulse" : ""} ${isDancing ? "transform rotate-12" : ""}`}
          ></div>
          <div
            className={`absolute top-12 right-0 w-3 h-8 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full border border-pink-400 ${isDancing ? "animate-pulse" : ""} ${isDancing ? "transform -rotate-12" : ""}`}
          ></div>

          {/* Bikini Bottom */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg border-2 border-pink-600 shadow-lg"></div>

          {/* Legs */}
          <div
            className={`absolute top-24 left-2 w-3 h-8 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full border border-pink-400 ${isDancing ? "animate-pulse" : ""}`}
          ></div>
          <div
            className={`absolute top-24 right-2 w-3 h-8 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full border border-pink-400 ${isDancing ? "animate-pulse" : ""}`}
          ></div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 w-24 h-28 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
      </div>

      {/* Dance Particles */}
      {isDancing && (
        <div className="absolute inset-0 pointer-events-none">
          {particlePositions.map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full animate-ping"
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvatarAssistant;
