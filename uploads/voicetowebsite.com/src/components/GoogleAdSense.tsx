import React, { useEffect, useRef } from 'react';

declare global {
  interface window {
    adsbygoogle: any[];
  }
}

export const GoogleAdSense = ({ slot }: { slot?: string }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (e) {
        console.error("AdSense push error", e);
      }
    };

    // Initial push
    initAd();

    // Stability Protocol: Watch for DOM mutations that might wipe ad state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && adRef.current?.innerHTML === '') {
          initAd();
        }
      });
    });

    if (adRef.current) {
      observer.observe(adRef.current, { childList: true });
    }

    return () => observer.disconnect();
  }, [slot]);

  return (
    <div className="w-full relative px-6 md:px-24 py-12">
      <div 
        className="w-full bg-slate-900/40 border border-slate-800/50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden backdrop-blur-sm group transition-all hover:bg-slate-900/60"
        ref={adRef}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
        <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-[0.4em] mb-4 italic opacity-40">Verified Advertisement Vector</span>
        
        {/* Real AdSense Placeholder */}
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '100px' }}
             data-ad-client="ca-pub-replace-me"
             data-ad-slot={slot || "default-slot"}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>

        {!slot && (
          <div className="text-slate-700 font-black text-xs uppercase tracking-widest animate-pulse mt-4">
            Awaiting Ad Injection...
          </div>
        )}
        
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -mr-16 -mb-16 pointer-events-none" />
      </div>
      {/* Overlap Protection Buffer */}
      <div className="h-8 w-full pointer-events-none" />
    </div>
  );
};
