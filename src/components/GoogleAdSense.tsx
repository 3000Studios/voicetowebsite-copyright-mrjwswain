import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = "ca-pub-5800977493749262";

export const GoogleAdSense = ({ slot }: { slot?: string }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!slot || pushedRef.current) return;

    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch (error) {
      console.error("AdSense push error", error);
    }
  }, [slot]);

  return (
    <div className="content-grid py-6">
      <div
        ref={adRef}
        className="rounded-[28px] border border-white/10 bg-white/4 p-4 backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span>Sponsored space</span>
          <span className="text-cyan-300">Ready</span>
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: "100px", width: "100%" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot || "default-slot"}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
