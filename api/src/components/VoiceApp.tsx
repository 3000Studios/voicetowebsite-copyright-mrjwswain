import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Mic2, Send, Loader2, Play, Shield, Monitor, Smartphone, Tablet, Sparkles, Cpu, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";

import { useSound } from '@/lib/sounds';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const Spark = ({ x, y }: { x: number, y: number }) => (
  <motion.div
    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
    animate={{ 
      x: (Math.random() - 0.5) * 100, 
      y: (Math.random() - 0.5) * 100, 
      scale: 0, 
      opacity: 0 
    }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="absolute w-1 h-1 bg-white rounded-full pointer-events-none z-50"
    style={{ left: x, top: y }}
  />
);

export const VoiceApp = () => {
  const { playClick, playSuccess, playZap, playTick } = useSound();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sparks, setSparks] = useState<{ id: number, x: number, y: number }[]>([]);
  const sparkIdRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addSparks = (e: React.MouseEvent, count: number = 10) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSparks = Array.from({ length: count }).map(() => ({
      id: sparkIdRef.current++,
      x,
      y
    }));
    
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id)));
    }, 600);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 3000);

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const toggleListening = () => {
    playClick();
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const inferRequest = (text: string) => {
    const lower = text.toLowerCase().trim();
    if (lower.length < 15) {
      if (lower.includes('restaurant') || lower.includes('food')) {
        return "A premium, high-conversion restaurant website with a stunning visual menu, online reservation system, local SEO optimization, and a warm, inviting aesthetic. Use high-quality food imagery placeholders.";
      }
      if (lower.includes('portfolio') || lower.includes('work')) {
        return "A minimalist, high-end creative portfolio for a top-tier designer, featuring smooth transitions, a bento-style project grid, and a focus on typography and white space. Include sections for work, about, and contact.";
      }
      if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce')) {
        return "A modern, conversion-focused e-commerce landing page with product showcases, trust badges, Stripe integration placeholders, and a seamless checkout flow. Use vibrant product placeholders.";
      }
      if (lower.includes('saas') || lower.includes('app')) {
        return "A futuristic SaaS landing page with a conversion-first layout, feature bento grid, tiered pricing table, and a live demo interactive section. Use tech-focused imagery.";
      }
      return `A professional, high-end, conversion-optimized website for ${text} with award-winning design, smooth animations, and clear call-to-actions.`;
    }
    return text;
  };

  const handleGenerate = async (text: string = input) => {
    if (!text.trim()) return;
    const expandedRequest = inferRequest(text);
    playZap();
    setIsGenerating(true);
    setPreviewHtml(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a high-end, professional, single-file HTML website for: ${expandedRequest}. 
        Use Tailwind CSS via CDN. 
        Ensure the design is modern, conversion-focused, and mobile-responsive. 
        Include a hero section, features, about, and a contact section. 
        Use Georgia as the primary font. 
        Return ONLY the raw HTML code without any markdown formatting or backticks.`,
      });

      let generatedHtml = response.text || '';
      
      // Cleanup: Remove markdown code blocks if present
      generatedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();
      
      if (!generatedHtml.includes('<!DOCTYPE html>')) {
        throw new Error("Invalid generation output");
      }
      
      setPreviewHtml(generatedHtml.trim());

      try {
        await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            html: generatedHtml.trim(), 
            isDraft: true,
            username: 'anonymous' 
          }),
        });
      } catch (saveErr) {
        console.error("Failed to save site:", saveErr);
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
      
      const utterance = new SpeechSynthesisUtterance("Your website is ready. Take a look at the preview.");
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-1">
      <div className="bg-black/40 backdrop-blur-3xl p-8 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        
        {/* Microchip Graphic */}
        <div className="absolute top-10 right-10 w-64 h-64 opacity-10 pointer-events-none group/chip">
          <motion.div
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative"
          >
            <Cpu size={256} className="text-indigo-500" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onMouseEnter={(e) => { addSparks(e as any, 20); playTick(); }}
            className="w-32 h-32 bg-indigo-600 flex items-center justify-center mb-8 btn-oval cursor-pointer group relative"
          >
            {isListening && <div className="pulse-ring scale-150" />}
            <Mic2 className="text-white group-hover:scale-110 transition-transform relative z-10" size={48} />
            {sparks.map(spark => <Spark key={spark.id} x={spark.x} y={spark.y} />)}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase italic text-3d leading-none spark-container inline-text"
          >
            The <span className="text-indigo-400">Engine</span>
            <motion.div 
              animate={{ opacity: [0, 1, 0], x: [0, 10, -10, 0] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute -top-4 -right-4 text-white"
            >
              <Zap size={24} className="fill-current" />
            </motion.div>
          </motion.h2>
          <p className="text-slate-400 max-w-3xl text-2xl font-medium leading-relaxed italic">
            Speak your vision into existence. Our neural engine manifests professional digital empires in real-time.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-16 relative z-10">
          <div className="relative flex-1 group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak your vision..."
              className="w-full bg-white/5 border border-white/10 text-white h-20 pl-8 pr-20 rounded-full focus:outline-none focus:border-white transition-all font-light text-xl placeholder:text-slate-600 backdrop-blur-md italic"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={toggleListening}
              onMouseEnter={playTick}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${
                isListening 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isListening && <div className="pulse-ring" />}
              <Mic size={24} className="relative z-10" />
            </button>
          </div>
          <button 
            onClick={(e) => { 
              addSparks(e as any, 50); 
              handleGenerate(input); 
            }}
            onMouseEnter={(e) => { addSparks(e as any, 30); playTick(); }}
            disabled={isGenerating || !input.trim()}
            className="btn-oval text-white h-20 px-16 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={24} className="group-hover:animate-bounce" />}
            Manifest
            {sparks.map(spark => <Spark key={spark.id} x={spark.x} y={spark.y} />)}
          </button>
        </div>

        {/* Voice Waveform Animation */}
        <AnimatePresence>
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-end justify-center gap-1.5 h-16 mb-12 overflow-hidden"
            >
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [15, Math.random() * 50 + 15, 15],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.03,
                  }}
                  className="w-1.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewHtml && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="space-y-8 relative z-10"
            >
              <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/50 backdrop-blur-3xl p-6 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                    <div className="w-4 h-4 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-full">
                      <Shield size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase tracking-widest text-[10px]">Security Protocol</p>
                      <p className="text-indigo-400 font-bold text-xs uppercase italic">IP Shield Active</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-full border border-white/10">
                  <button 
                    onClick={() => setViewMode('desktop')}
                    className={`p-3 rounded-full transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    <Monitor size={24} />
                  </button>
                  <button 
                    onClick={() => setViewMode('tablet')}
                    className={`p-3 rounded-full transition-all ${viewMode === 'tablet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    <Tablet size={24} />
                  </button>
                  <button 
                    onClick={() => setViewMode('mobile')}
                    className={`p-3 rounded-full transition-all ${viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    <Smartphone size={24} />
                  </button>
                </div>
              </div>

              <div className="relative group">
                <div 
                  className={`mx-auto transition-all duration-700 overflow-hidden border-4 border-slate-800 bg-white rounded-[2rem] shadow-2xl ${
                    viewMode === 'desktop' ? 'w-full h-[800px]' : 
                    viewMode === 'tablet' ? 'w-[768px] h-[800px]' : 
                    'w-[375px] h-[800px]'
                  }`}
                >
                  <iframe 
                    srcDoc={previewHtml}
                    className="w-full h-full border-none"
                    title="Website Preview"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute inset-0 pointer-events-none border-[24px] border-indigo-600/5 mix-blend-overlay" />
                </div>
                
                <div className="mt-16 flex justify-center">
                  <button 
                    onMouseEnter={playTick}
                    className="btn-oval text-white text-2xl px-20"
                    onClick={() => window.location.href = '/store'}
                  >
                    Deploy This Empire
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!previewHtml && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-slate-800 bg-slate-950/20 rounded-[3rem] relative z-10">
            <div className="w-24 h-24 bg-slate-900 border-2 border-slate-800 flex items-center justify-center mb-8 rounded-full shadow-2xl">
              <Play className="text-slate-700 fill-slate-700" size={48} />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-2xl italic">Awaiting Your Vision</p>
            <div className="mt-8 flex gap-4">
              <div className="px-4 py-2 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-full">Neural Engine Ready</div>
              <div className="px-4 py-2 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-full">Voice Link Active</div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-950/20 border-4 border-slate-800 rounded-[3rem] relative z-10">
            <div className="relative">
              <div className="w-32 h-32 border-8 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Mic className="text-indigo-400 animate-pulse" size={48} />
              </div>
            </div>
            <p className="mt-12 text-indigo-400 font-black uppercase tracking-[0.3em] text-3xl animate-pulse italic">Neural Synthesis in Progress...</p>
            <div className="mt-8 font-mono text-indigo-500/50 text-xs">
              Compiling assets... Mapping voice vectors... Optimizing SEO...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
