import React from 'react';

export const GoogleAdSense = ({ slot }: { slot?: string }) => {
  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 p-6 flex flex-col items-center justify-center min-h-[120px] my-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800" />
      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3 italic">Advertisement</span>
      <div className="text-slate-600 font-black text-xs uppercase tracking-widest">Google AdSense Space</div>
      {slot && <div className="text-[8px] text-slate-700 mt-2 font-mono">ID: {slot}</div>}
    </div>
  );
};
