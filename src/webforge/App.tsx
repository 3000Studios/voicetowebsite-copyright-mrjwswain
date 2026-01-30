
import React, { useState, useEffect, useRef } from 'react';
import { analyzeSource, forgeWebsite } from './services/geminiService';
import { AppState, StylePreferences, ComponentType, AppMode } from './types';
import ScreenshotUpload from './components/ScreenshotUpload';
import ResultView from './components/ResultView';
import Logo from './components/Logo';
import VoiceInput from './components/VoiceInput';

const statusMessages = [
  "Infecting Neural Pathways...",
  "Acquiring Target DOM Nodes...",
  "Calibrating Style Protocols...",
  "Synthesizing Content Stream...",
  "Applying Platinum UX Overrides...",
  "Finalizing Neural Forge...",
  "Ready for Extraction."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: 'CLONE',
    isAnalyzing: false,
    progress: 0,
    screenshot: null,
    result: null,
    error: null,
    preferences: {
      primaryColor: '#00e5ff',
      fontFamily: 'Orbitron',
      spacing: 'Normal'
    },
    componentType: 'Full Page',
    customContent: '',
    forgeSections: { header: true, main: true, footer: true },
    forgeDescription: ''
  });

  const [urlInput, setUrlInput] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playSfx = (url: string) => {
    new Audio(url).play().catch(() => {});
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.1;
  }, []);

  useEffect(() => {
    let timer: any;
    let statusTimer: any;
    if (state.isAnalyzing) {
      setState(s => ({ ...s, progress: 0 }));
      setStatusIdx(0);
      timer = setInterval(() => {
        setState(s => ({
          ...s,
          progress: Math.min(s.progress + (Math.random() * 8), 98)
        }));
      }, 400);

      statusTimer = setInterval(() => {
        setStatusIdx(i => (i + 1) % (statusMessages.length - 1));
      }, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
      if (statusTimer) clearInterval(statusTimer);
    };
  }, [state.isAnalyzing]);

  const runAnalysis = async (source: string, isUrl: boolean) => {
    playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529');
    setState(prev => ({ ...prev, isAnalyzing: true, screenshot: isUrl ? null : source, error: null }));
    try {
      const result = await analyzeSource(source, state.preferences, state.componentType, state.customContent, isUrl);
      setState(prev => ({ ...prev, isAnalyzing: false, progress: 100, result }));
      playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258532');
    } catch (err) {
      setState(prev => ({ ...prev, isAnalyzing: false, error: "CRITICAL ERROR: NEURAL LINK SEVERED." }));
    }
  };

  const runForge = async () => {
    if (!state.forgeDescription) return;
    playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529');
    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null }));
    try {
      const result = await forgeWebsite(state.forgeDescription, state.forgeSections, state.preferences);
      setState(prev => ({ ...prev, isAnalyzing: false, progress: 100, result }));
      playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258532');
    } catch (err) {
      setState(prev => ({ ...prev, isAnalyzing: false, error: "FORGE OVERLOAD: NEURAL COLLAPSE." }));
    }
  };

  const handleEnhanceGlobal = () => {
    const colors = ['#00e5ff', '#6366f1', '#f43f5e', '#10b981', '#8b5cf6'];
    const fonts = ['Orbitron', 'Space Grotesk', 'Syncopate', 'Bebas Neue'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];

    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, primaryColor: randomColor, fontFamily: randomFont }
    }));
    playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative selection:bg-cyan-500/40">
      <audio ref={audioRef} loop autoPlay>
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" type="audio/mpeg" />
      </audio>

      <header className="relative h-[550px] flex flex-col items-center justify-center overflow-hidden border-b-8 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <video autoPlay loop muted playsInline className="header-bg-video">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-diving-deep-under-the-ocean-1563-large.mp4" type="video/mp4" />
        </video>

        <div className="z-10 text-center space-y-8 px-4 max-w-5xl">
          <div className="logo-container inline-block mb-4 cursor-pointer" onClick={() => setState(s => ({ ...s, result: null }))}>
            <div className="silver-border p-[4px] shadow-[0_0_60px_rgba(0,229,255,0.2)]">
              <div className="bg-slate-950 rounded-[14px] p-8 flex flex-col items-center justify-center border border-white/10">
                 <Logo className="w-48 h-48" />
                 <h1 className="text-4xl font-black orbitron tracking-[0.2em] text-slate-100 glow-text italic mt-6" style={{ fontFamily: state.preferences.fontFamily }}>
                  3000STUDIOS.COM
                 </h1>
                 <p className="text-slate-500 text-[10px] font-black tracking-[0.5em] mt-2 uppercase">J.W. Swain Platinum Forge Protocol</p>
              </div>
            </div>
          </div>
          <h2 className="text-6xl md:text-9xl font-black orbitron text-white italic header-shadow uppercase tracking-tighter" style={{ fontFamily: state.preferences.fontFamily }}>
            GET <span className="text-cyan-400">OVER</span> HERE
          </h2>
          <div className="flex flex-wrap justify-center gap-8 pt-6">
            <button
              onClick={() => { setState(s => ({ ...s, mode: 'CLONE', result: null })); playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529'); }}
              className={`px-12 py-5 rounded-2xl orbitron font-black tracking-widest text-sm transition-all border-2 btn-3d ${state.mode === 'CLONE' ? 'bg-white text-slate-950 border-white shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'bg-transparent text-white border-slate-700 hover:border-white'}`}
            >
              ACQUISITION
            </button>
            <button
              onClick={() => { setState(s => ({ ...s, mode: 'FORGE', result: null })); playSfx('https://www.soundboard.com/handler/Downloadaudio.ashx?id=258529'); }}
              className={`px-12 py-5 rounded-2xl orbitron font-black tracking-widest text-sm transition-all border-2 btn-3d ${state.mode === 'FORGE' ? 'bg-white text-slate-950 border-white shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'bg-transparent text-white border-slate-700 hover:border-white'}`}
            >
              NEURAL FORGE
            </button>
          </div>
        </div>

        <button
          onClick={handleEnhanceGlobal}
          className="absolute bottom-10 right-10 btn-3d bg-cyan-400 text-slate-950 px-8 py-4 rounded-2xl font-black orbitron text-xs animate-pulse shadow-[0_0_30px_#00e5ff] z-20"
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-3"></i> AUTO-ENHANCE INTERFACE
        </button>
      </header>

      {state.isAnalyzing && (
        <div className="fixed top-[550px] left-0 w-full h-3 bg-slate-900 z-50 overflow-hidden">
          <div className="h-full progress-bar-fill shadow-[0_0_40px_#fff]" style={{ width: `${state.progress}%` }} />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-black orbitron text-xl italic tracking-widest animate-pulse drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
             {statusMessages[statusIdx]}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        {state.error && (
          <div className="mb-16 p-10 beveled-box border-4 border-red-500 bg-red-950/30 text-red-400 font-black orbitron uppercase text-center tracking-[0.3em] animate-pulse rounded-3xl">
            <i className="fa-solid fa-triangle-exclamation text-5xl mb-6 block"></i>
            {state.error}
          </div>
        )}

        {!state.result && !state.isAnalyzing ? (
          state.mode === 'CLONE' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7 space-y-16">
                <div className="beveled-box p-16 border-slate-700/50 space-y-12">
                  <div className="space-y-8">
                    <h3 className="text-sm font-black orbitron text-slate-400 uppercase tracking-[0.4em] border-b border-slate-800 pb-6">
                      <i className="fa-solid fa-bolt mr-3 text-cyan-500"></i> Acquisition Protocol
                    </h3>
                    <form onSubmit={(e) => { e.preventDefault(); runAnalysis(urlInput, true); }} className="flex gap-4">
                      <div className="flex-1 flex gap-3">
                        <input
                          type="url"
                          placeholder="TARGET URL DECONSTRUCTION..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl py-6 px-8 text-sm font-black orbitron text-white outline-none focus:border-cyan-400 transition-all shadow-inner"
                        />
                        <VoiceInput onResult={(t) => setUrlInput(t)} className="h-[74px] w-[74px] text-xl" />
                      </div>
                      <button type="submit" className="btn-3d btn-3d-primary px-12 py-6 rounded-2xl font-black orbitron text-xs">ACQUIRE</button>
                    </form>
                  </div>
                  <div className="relative py-6 flex items-center justify-center">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="mx-10 text-[12px] font-black orbitron text-slate-600 uppercase tracking-[0.8em]">OR DROP DATA</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                  </div>
                  <ScreenshotUpload onUpload={(b) => runAnalysis(b, false)} isLoading={false} />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-10">
                <div className="beveled-box p-12 border-slate-700/50 space-y-10">
                  <h3 className="text-sm font-black orbitron text-slate-400 uppercase tracking-[0.4em] border-b border-slate-800 pb-6">
                    <i className="fa-solid fa-code-merge mr-3 text-cyan-500"></i> Content Injector
                  </h3>
                  <textarea
                    placeholder="Input custom restaurant data, menus, or branding overrides here..."
                    value={state.customContent}
                    onChange={(e) => setState(s => ({ ...s, customContent: e.target.value }))}
                    className="w-full h-72 bg-slate-950 border-2 border-slate-800 rounded-2xl p-10 text-xs font-bold text-slate-300 outline-none focus:border-cyan-500 code-scrollbar resize-none shadow-inner"
                  />
                  <div className="flex justify-end">
                    <VoiceInput onResult={(t) => setState(s => ({ ...s, customContent: s.customContent + " " + t }))} className="w-[60px] h-[60px]" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-16">
              <div className="beveled-box p-16 border-slate-700/50 space-y-12">
                <h3 className="text-3xl font-black orbitron text-white uppercase tracking-tighter italic glow-text">
                  <i className="fa-solid fa-atom mr-4 text-cyan-400"></i> Neural Forge: Universal Synthesis
                </h3>

                <div className="space-y-8">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Protocol Architectures</label>
                  <div className="flex flex-wrap gap-12">
                    {['Header', 'Main', 'Footer'].map(s => (
                      <label key={s} className="flex items-center space-x-5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(state.forgeSections as any)[s.toLowerCase()]}
                          onChange={() => setState(prev => ({
                            ...prev,
                            forgeSections: { ...prev.forgeSections, [s.toLowerCase()]: !(prev.forgeSections as any)[s.toLowerCase()] }
                          }))}
                          className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-slate-700 text-cyan-400 focus:ring-0"
                        />
                        <span className="text-lg font-black orbitron text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Forge Concept Transmission</label>
                    <VoiceInput onResult={(t) => setState(s => ({ ...s, forgeDescription: s.forgeDescription + " " + t }))} className="w-[70px] h-[70px]" />
                  </div>
                  <textarea
                    placeholder="Detailed vision: 'A high-converting SaaS landing page for cyber-security, featuring futuristic data-viz, glowing blue accents, and a tiered pricing table'..."
                    value={state.forgeDescription}
                    onChange={(e) => setState(s => ({ ...s, forgeDescription: e.target.value }))}
                    className="w-full h-64 bg-slate-950 border-2 border-slate-800 rounded-2xl p-10 text-lg font-bold text-slate-200 outline-none focus:border-cyan-400 transition-all resize-none shadow-inner"
                  />
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    onClick={runForge}
                    disabled={!state.forgeDescription}
                    className="btn-3d btn-3d-primary px-24 py-8 rounded-3xl font-black orbitron text-lg shadow-[0_0_60px_rgba(0,229,255,0.3)] tracking-[0.2em]"
                  >
                    IGNITE NEURAL SYNTHESIS
                  </button>
                </div>
              </div>
            </div>
          )
        ) : state.isAnalyzing ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="relative w-64 h-64 mb-16 animate-pulse">
               <div className="silver-border p-[8px] rounded-full shadow-[0_0_100px_rgba(0,229,255,0.4)]">
                <div className="bg-slate-950 rounded-full w-full h-full flex items-center justify-center border-8 border-slate-800">
                  <Logo className="w-32 h-32 animate-spin-slow" />
                </div>
              </div>
            </div>
            <h2 className="text-6xl font-black orbitron text-white mb-8 italic tracking-tighter glow-text">SYNTHESIZING REALITY...</h2>
            <div className="flex space-x-8">
              {[0,1,2].map(i => <div key={i} className="w-5 h-5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_25px_#00e5ff]" style={{ animationDelay: `${i*0.2}s` }} />)}
            </div>
            <p className="mt-12 text-slate-600 font-black orbitron uppercase tracking-[0.8em] text-[14px]">Forging Platinum-Grade Dom Components</p>
          </div>
        ) : state.result ? (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
              <div className="space-y-8">
                <button
                  onClick={() => setState(s => ({ ...s, result: null }))}
                  className="text-slate-500 hover:text-cyan-400 font-black orbitron text-[12px] uppercase tracking-[0.5em] transition-all flex items-center group"
                >
                  <i className="fa-solid fa-chevron-left mr-4 group-hover:-translate-x-2 transition-transform"></i> ABANDON FORGE
                </button>
                <div className="flex items-center space-x-10">
                  <h2 className="text-7xl font-black orbitron text-white tracking-tighter uppercase glow-text italic">
                    {state.result.title}
                  </h2>
                  <span className="btn-3d px-8 py-3 rounded-2xl text-[12px] font-black orbitron text-slate-300 uppercase tracking-widest border-cyan-500/50">
                    {state.mode}
                  </span>
                </div>
              </div>
              <div className="beveled-box p-10 flex items-center space-x-10 border-slate-800 bg-slate-900/60 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <div className="text-right">
                  <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3">Protocol Success</p>
                  <p className="text-lg font-black orbitron text-green-400 uppercase tracking-[0.3em] animate-pulse">VICTORY ACHIEVED</p>
                </div>
                <div className="w-24 h-24 rounded-3xl bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-inner shadow-green-500/20">
                  <i className="fa-solid fa-check-double text-5xl text-green-400"></i>
                </div>
              </div>
            </div>

            <ResultView
              result={state.result}
              onUpdate={(r) => setState(s => ({ ...s, result: r }))}
              isAnalyzing={state.isAnalyzing}
              setIsAnalyzing={(v) => setState(s => ({ ...s, isAnalyzing: v }))}
            />
          </div>
        ) : null}
      </main>

      <footer className="bg-slate-950 border-t-[10px] border-slate-900 pt-48 pb-20 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24">
            <div className="lg:col-span-2 space-y-12">
              <div className="flex items-center">
                <div className="silver-border p-[2px] mr-8">
                  <div className="bg-slate-950 p-4 flex items-center justify-center rounded-[16px]">
                    <Logo className="w-16 h-16" />
                  </div>
                </div>
                <div>
                  <span className="text-4xl font-black orbitron text-white tracking-tighter italic glow-text block">3000STUDIOS.COM</span>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-[1em] mt-2 block">FORGE THE FUTURE</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] leading-loose max-w-lg">
                Universal Neural Web Acquisition Engine. Designed, engineered, and deployed by J.W. Swain. 3000 Studios Proprietary Protocol Alpha-9. Optimized for store-ready deployment.
              </p>
            </div>

            <div className="space-y-10">
              <h4 className="text-[12px] font-black orbitron text-slate-500 uppercase tracking-[0.6em]">Core Protocols</h4>
              <ul className="space-y-6 text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">Neural Sync v4.8</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">DOM Deconstruction</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">Acquisition Engine</a></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="text-[12px] font-black orbitron text-slate-500 uppercase tracking-[0.6em]">Secure Terminal</h4>
              <ul className="space-y-6 text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">Store Access</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">Private Vault</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-all hover:translate-x-2 block">Architect SDK</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-48 pt-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-end text-[12px] font-black orbitron text-slate-700 tracking-[0.5em]">
            <div className="space-y-3">
              <p className="text-slate-500">&copy; 2024 J.W. SWAIN | ARCHITECT & OWNER</p>
              <p className="text-slate-800 font-black italic shadow-text">3000STUDIOS.COM | TOTAL DESIGN DOMINANCE</p>
            </div>
            <div className="mt-12 md:mt-0 text-right space-y-4">
              <div className="flex items-center justify-end space-x-4 text-slate-500">
                <i className="fa-solid fa-fingerprint text-cyan-500 text-xl"></i>
                <p>IDENTIFIED AS PROPRIETARY 3000TECH</p>
              </div>
              <p className="text-slate-800 text-[10px] max-w-sm ml-auto font-black uppercase">Protected by 3000 Studios Proprietary Technology. Copyright 2024 J.W. Swain. Unauthorized replication detected will trigger neural purge protocols.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
