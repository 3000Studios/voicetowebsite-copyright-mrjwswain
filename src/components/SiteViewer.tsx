import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const SiteViewer = () => {
  const { id } = useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`/api/site/${id}`);
        if (!response.ok) throw new Error("Site not found");
        const rawHtml = await response.text();
        if (!rawHtml?.trim()) throw new Error("Site content empty");
        setHtml(rawHtml);
      } catch (err) {
        setError("Failed to load site");
      }
    };
    fetchSite();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-white mb-4 uppercase italic">Error 404</h1>
        <p className="text-slate-400 text-xl italic">{error}</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-indigo-400 font-black uppercase tracking-widest animate-pulse italic">Manifesting Digital Empire...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white">
      <iframe 
        srcDoc={html}
        className="w-full h-full border-none"
        title="Generated Site"
        sandbox="allow-scripts"
      />
    </div>
  );
};
