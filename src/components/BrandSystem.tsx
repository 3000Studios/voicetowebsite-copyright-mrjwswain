import { motion } from "motion/react";
import React from "react";

const orbs = [
  "left-[-8rem] top-20 h-[30rem] w-[30rem] bg-cyan-400/18",
  "right-[-10rem] top-[22rem] h-[34rem] w-[34rem] bg-indigo-500/20",
  "left-[22%] bottom-[-12rem] h-[28rem] w-[28rem] bg-fuchsia-500/12",
];

export const BrandWallpaper = ({ density = "default" }: { density?: "default" | "quiet" }) => {
  const quiet = density === "quiet";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--vtw-canvas)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(53,226,255,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.18),transparent_35%),linear-gradient(180deg,#050711_0%,#070a14_48%,#03040a_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_top,black,transparent_72%)]" />
      <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(115deg,transparent_0_48%,rgba(53,226,255,0.22)_49%,transparent_51%)] [background-size:160px_160px]" />
      {orbs.map((classes, index) => (
        <motion.div
          key={classes}
          className={`absolute rounded-full blur-3xl ${classes}`}
          animate={quiet ? undefined : { x: [0, index % 2 ? -34 : 34, 0], y: [0, index % 2 ? 26 : -26, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18 + index * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.035] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#03040a] to-transparent" />
    </div>
  );
};

export const SectionHeader = ({
  label,
  title,
  copy,
  align = "left",
  className = "",
}: {
  label?: string;
  title: React.ReactNode;
  copy?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) => (
  <div className={`section-intro ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
    {label ? <span className={`eyebrow ${align === "center" ? "justify-center" : ""}`}>{label}</span> : null}
    <h2 className="section-title text-gradient text-[2.35rem] leading-[1.02] sm:text-5xl lg:text-6xl">{title}</h2>
    {copy ? <p className="section-copy">{copy}</p> : null}
  </div>
);

export const MediaFrame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`media-frame ${className}`}>{children}</div>
);

export const Waveform = ({ className = "" }: { className?: string }) => {
  const bars = [24, 52, 34, 76, 44, 88, 58, 38, 68, 30, 82, 48];
  return (
    <div className={`flex h-12 items-center justify-center gap-1.5 ${className}`} aria-hidden="true">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 via-indigo-300 to-fuchsia-300 shadow-[0_0_18px_rgba(53,226,255,0.45)]"
          animate={{ height: [`${height * 0.45}%`, `${height}%`, `${height * 0.62}%`] }}
          transition={{ duration: 1.2 + index * 0.05, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};
