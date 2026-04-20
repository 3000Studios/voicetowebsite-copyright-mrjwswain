import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { GoogleAdSense } from '@/components/GoogleAdSense';

export const Stories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch('/api/stories');
        const data = await res.json();
        setStories(data);
      } catch (err) {
        console.error("Failed to fetch stories", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const latestStory = stories[0];
  const previousStories = stories.slice(1);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase italic"
          >
            TECH <span className="text-indigo-400">STORIES</span>
          </motion.h1>
          <p className="text-slate-400 text-xl max-w-2xl font-medium leading-relaxed">
            Hourly insights into the intersection of voice, AI, and the future of the web.
          </p>
        </div>
        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <video src="/input_file_3.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
        </div>
      </div>

      <GoogleAdSense slot="stories-top" />

      {latestStory && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-32"
        >
          <div className="lifted-section bg-slate-900 overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-[400px] lg:h-auto overflow-hidden border-r-2 border-slate-800">
                <img 
                  src={`https://picsum.photos/seed/${latestStory.heroVideoDescription || 'tech'}/1200/800`} 
                  alt={latestStory.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="w-20 h-20 bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                    <Play className="text-white fill-white ml-1" size={32} />
                  </div>
                </div>
                <div className="absolute top-6 left-6">
                  <Badge className="bg-indigo-600 text-white px-4 py-1 text-sm font-black uppercase tracking-widest rounded-none border-none shadow-lg">LATEST STORY</Badge>
                </div>
              </div>
              <div className="p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-slate-500 mb-6 text-sm font-black uppercase tracking-widest italic">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(latestStory.timestamp).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(latestStory.timestamp).toLocaleTimeString()}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight uppercase italic tracking-tight">{latestStory.title}</h2>
                <Badge className="w-fit mb-6 bg-slate-800 text-indigo-400 font-black uppercase tracking-widest rounded-none border-none">{latestStory.topic}</Badge>
                <p className="text-slate-400 text-lg leading-relaxed mb-8 line-clamp-4 font-medium">
                  {latestStory.story}
                </p>
                <button className="w-fit bg-indigo-600 hover:bg-indigo-500 text-white h-16 px-10 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.4)] hover:-translate-x-1 hover:-translate-y-1 transition-all flex items-center">
                  Read Full Story <ArrowRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {previousStories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="lifted-section bg-slate-900 h-full flex flex-col group">
              <div className="relative h-56 overflow-hidden border-b-2 border-slate-800">
                <img 
                  src={`https://picsum.photos/seed/${story.heroVideoDescription || 'tech'}/800/600`} 
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-slate-500 mb-4 text-xs font-black uppercase tracking-widest italic">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(story.timestamp).toLocaleDateString()}</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 group-hover:text-indigo-400 transition-colors uppercase italic tracking-tight">
                  {story.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                  {story.story}
                </p>
                <div className="mt-auto pt-6 border-t border-slate-800 flex items-center justify-between">
                  <Badge className="bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-none border-none">{story.topic}</Badge>
                  <button className="text-indigo-400 text-sm font-black uppercase tracking-widest italic flex items-center gap-1 hover:gap-2 transition-all">
                    Read More <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <GoogleAdSense slot="stories-bottom" />
    </div>
  );
};
