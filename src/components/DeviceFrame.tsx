/**
 * DeviceFrame — visual device chrome around an iframe preview.
 * Spec ref: VOICE TO WEBSITE UI/UX — PAGE: LIVE PREVIEW "Preview Device Frame"
 *
 * Usage:
 *   <DeviceFrame device="mobile" srcDoc={html} />
 *   <DeviceFrame device="tablet" src="/preview/abc" />
 *   <DeviceFrame device="desktop" srcDoc={html} />
 */
import React from "react";

export type DeviceMode = "desktop" | "tablet" | "mobile";

type Props = {
  device: DeviceMode;
  srcDoc?: string;
  src?: string;
  title?: string;
  className?: string;
  /** Fixed height for the iframe inside the frame. Defaults are reasonable. */
  height?: number | string;
};

const DEVICE_SPECS: Record<DeviceMode, { width: string; height: string; radius: string }> = {
  desktop: { width: "100%", height: "640px", radius: "12px" },
  tablet: { width: "768px", height: "1024px", radius: "32px" },
  mobile: { width: "390px", height: "844px", radius: "44px" },
};

export const DeviceFrame: React.FC<Props> = ({
  device,
  srcDoc,
  src,
  title = "Site preview",
  className = "",
  height,
}) => {
  const spec = DEVICE_SPECS[device];
  const frameHeight = height ?? spec.height;

  if (device === "desktop") {
    // Desktop: browser-style chrome (traffic lights + URL bar)
    return (
      <div
        className={`mx-auto w-full max-w-6xl rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl ${className}`}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-zinc-900">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" aria-hidden="true" />
          </div>
          <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-white/5 text-[11px] font-mono text-white/40 truncate">
            yourbusiness.voicetowebsite.com
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/35 font-bold">Desktop</span>
        </div>
        <iframe
          srcDoc={srcDoc}
          src={src}
          title={title}
          className="w-full border-0 bg-white"
          style={{ height: frameHeight }}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        />
      </div>
    );
  }

  // Tablet + Mobile: physical device bezel with notch and rounded screen
  const isMobile = device === "mobile";
  const bezelPadding = isMobile ? "p-3" : "p-4";

  return (
    <div
      className={`mx-auto ${className}`}
      style={{
        width: spec.width,
        maxWidth: "100%",
      }}
    >
      <div
        className={`relative bg-zinc-950 ${bezelPadding} shadow-2xl shadow-black/60 ring-1 ring-white/10`}
        style={{ borderRadius: spec.radius }}
      >
        {/* Notch (mobile only) */}
        {isMobile && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 rounded-b-2xl bg-black z-10"
            aria-hidden="true"
          />
        )}

        {/* Side button hints (purely decorative) */}
        {isMobile && (
          <>
            <span className="absolute left-[-2px] top-24 w-[3px] h-10 rounded-l bg-zinc-700" aria-hidden="true" />
            <span className="absolute left-[-2px] top-40 w-[3px] h-14 rounded-l bg-zinc-700" aria-hidden="true" />
            <span className="absolute right-[-2px] top-32 w-[3px] h-20 rounded-r bg-zinc-700" aria-hidden="true" />
          </>
        )}

        {/* Screen */}
        <div
          className="overflow-hidden bg-white"
          style={{
            borderRadius: `calc(${spec.radius} - 8px)`,
          }}
        >
          <iframe
            srcDoc={srcDoc}
            src={src}
            title={title}
            className="w-full border-0 bg-white"
            style={{ height: frameHeight, display: "block" }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold">
        {isMobile ? "390 × 844" : "768 × 1024"}
      </div>
    </div>
  );
};

export default DeviceFrame;
