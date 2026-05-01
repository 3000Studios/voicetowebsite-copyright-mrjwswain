import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Waveform } from "./BrandSystem";

interface VideoHeroProps {
  videoSrc: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: () => void;
  overlayOpacity?: number;
  showControls?: boolean;
}

export const VideoHero: React.FC<VideoHeroProps> = ({
  videoSrc,
  title,
  subtitle,
  ctaText,
  ctaAction,
  overlayOpacity = 0.55,
  showControls = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    video.play().catch(() => setIsPlaying(false));
  }, [videoFailed]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    if (isPlaying) {
      video.pause();
    } else {
      void video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative min-h-[86vh] w-full overflow-hidden">
      <div className="absolute inset-0 responsive-wallpaper" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:68px_68px]" />

      {!videoFailed ? (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${videoReady ? "opacity-45" : "opacity-0"}`}
        />
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,10,0.32),rgba(3,4,10,0.72)_62%,#03040a_100%)]" style={{ opacity: overlayOpacity }} />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ rotate: { duration: 48, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
      />

      <div className="relative z-10 flex min-h-[86vh] flex-col items-center justify-center px-6 py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-5xl space-y-8"
        >
          <Waveform className="mx-auto opacity-90" />
          {title ? <h1 className="hero-headline">{title}</h1> : null}
          {subtitle ? <p className="section-copy mx-auto max-w-3xl text-xl sm:text-2xl">{subtitle}</p> : null}
          {ctaText && ctaAction ? (
            <button onClick={ctaAction} className="hero-primary-button px-10 py-5 text-base">
              {ctaText}
            </button>
          ) : null}
        </motion.div>

        {showControls && !videoFailed ? (
          <div className="absolute bottom-8 right-8 flex gap-3">
            <button onClick={togglePlay} className="nav-ghost-button h-12 w-12 p-0" aria-label={isPlaying ? "Pause video" : "Play video"}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={toggleMute} className="nav-ghost-button h-12 w-12 p-0" aria-label={isMuted ? "Unmute video" : "Mute video"}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default VideoHero;
