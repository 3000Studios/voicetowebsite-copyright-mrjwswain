export const Aura3DIcon = () => {
  return (
    <div className="w-full h-full relative group overflow-hidden rounded-full border-4 border-white/5 bg-black">
      {/* Pulsing Neural Aura FX */}
      <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse pointer-events-none z-0" />

      <video
        src="/input_file_0.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover relative z-10 scale-125 filter contrast-125 brightness-90 saturate-125"
      />

      <div className="absolute inset-0 bg-linear-to-t from-indigo-900/40 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 border-20 border-black/20 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-30 pointer-events-none" />
    </div>
  );
};
