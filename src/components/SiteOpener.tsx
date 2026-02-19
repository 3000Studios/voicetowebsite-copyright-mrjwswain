import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  show: boolean;
  onDone: () => void;
  reduceMotion?: boolean;
};

const VIDEO_SRC = "/media/vtw-opener.mp4";
const FALLBACK_IMG = "/vtw-wallpaper.png";

export default function SiteOpener({
  show,
  onDone,
  reduceMotion = false,
}: Props) {
  const doneRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!show) return;
    doneRef.current = false;

    // Hide nav/widget/footer while the opener is on-screen.
    document.documentElement.dataset.vtwPhase = "opener";

    if (reduceMotion) {
      safetyTimerRef.current = window.setTimeout(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        onDone();
      }, 500);
    }

    return () => {
      if (safetyTimerRef.current) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      // If opener unmounts, restore normal chrome.
      if (document.documentElement.dataset.vtwPhase === "opener") {
        delete document.documentElement.dataset.vtwPhase;
      }
    };
  }, [show, onDone, reduceMotion]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;

    // Ensure chrome becomes visible immediately (even during fade-out).
    if (document.documentElement.dataset.vtwPhase === "opener") {
      delete document.documentElement.dataset.vtwPhase;
    }
    onDone();
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="vtw-site-opener"
          data-testid="vtw-site-opener"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[400] bg-black"
        >
          <div className="absolute inset-0">
            {reduceMotion ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${FALLBACK_IMG})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(0.9)",
                }}
              />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                preload="metadata"
                poster={FALLBACK_IMG}
                onLoadedMetadata={() => {
                  if (videoRef.current) videoRef.current.playbackRate = 1;
                }}
                onEnded={finish}
                onError={() => {
                  if (doneRef.current) return;
                  safetyTimerRef.current = window.setTimeout(finish, 800);
                }}
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
