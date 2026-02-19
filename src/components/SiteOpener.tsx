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

  useEffect(() => {
    if (!show) return;
    doneRef.current = false;

    // Hide nav/widget/footer while the opener is on-screen.
    document.documentElement.dataset.vtwPhase = "opener";

    const ms = reduceMotion ? 500 : 3800;
    const t = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    }, ms);

    return () => {
      window.clearTimeout(t);
      // If opener unmounts, restore normal chrome.
      if (document.documentElement.dataset.vtwPhase === "opener") {
        delete document.documentElement.dataset.vtwPhase;
      }
    };
  }, [show, onDone, reduceMotion]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="vtw-site-opener"
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
                  filter: "brightness(0.55)",
                }}
              />
            ) : (
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={FALLBACK_IMG}
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/80" />
          </div>

          <div className="relative z-10 h-full w-full flex flex-col items-center justify-end pb-10 md:pb-16 px-6">
            <div className="text-center">
              <div className="font-orbitron text-[10px] tracking-[0.6em] text-white/70 uppercase">
                VoiceToWebsite
              </div>
              <div className="mt-3 font-orbitron text-3xl md:text-5xl tracking-[0.18em] text-white">
                Command Center
              </div>
              <div className="mt-4 text-white/60 max-w-xl mx-auto">
                Speak it. Ship it. Securely.
              </div>
            </div>

            <button
              type="button"
              onClick={finish}
              className="mt-8 px-6 py-3 rounded-full border border-white/20 bg-white/10 hover:bg-white hover:text-black transition font-orbitron tracking-widest uppercase text-[10px]"
            >
              Skip
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
