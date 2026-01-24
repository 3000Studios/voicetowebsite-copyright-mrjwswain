
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS, INTRO_VIDEO, BACKGROUND_TUNNEL, INTRO_SONG } from './constants';
import { NavigationLink } from './types';
import { audioEngine } from './services/audioEngine';
import CursorInstrument from './components/CursorInstrument';
import WarpTunnel from './components/WarpTunnel';
import ElectricText from './components/ElectricText';

const App: React.FC = () => {
  const [phase, setPhase] = useState<'intro' | 'home'>('intro');
  const [isWarping, setIsWarping] = useState(false);
  const [isDetonating, setIsDetonating] = useState<string | null>(null);
  const [splatterActive, setSplatterActive] = useState(false);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isBoltsEnabled, setIsBoltsEnabled] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const blobRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  // Voice Command Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
          .toLowerCase();

        if (isBoltsEnabled && (transcript.includes('shoot') || transcript.includes('spark'))) {
          setIsShooting(true);
          audioEngine.playSpark();
          // Reset shooting after a short burst
          setTimeout(() => setIsShooting(false), 1500);
        }
      };

      recognition.onend = () => {
        if (isBoltsEnabled) recognition.start();
      };

      recognitionRef.current = recognition;
    }
  }, [isBoltsEnabled]);

  const toggleBolts = () => {
    const nextState = !isBoltsEnabled;
    setIsBoltsEnabled(nextState);
    if (nextState) {
      recognitionRef.current?.start();
      audioEngine.playHum();
    } else {
      recognitionRef.current?.stop();
    }
  };

  const getBlobStyles = () => {
    if (!blobRef.current) return {};
    const rect = blobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dist = Math.hypot(mousePos.x - centerX, mousePos.y - centerY);
    const maxPull = 50;
    const pullRadius = 300;
    
    if (dist < pullRadius) {
      const pullFactor = (1 - dist / pullRadius) * maxPull;
      const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
      return {
        x: Math.cos(angle) * pullFactor,
        y: Math.sin(angle) * pullFactor,
      };
    }
    return { x: 0, y: 0 };
  };

  const startExperience = () => {
    audioEngine.enable();
    audioEngine.playGlassTing();
    audioEngine.playMusic(INTRO_SONG);
    setIsAudioPlaying(true);
    setSplatterActive(true);
    
    setTimeout(() => {
      setPhase('home');
      setTimeout(() => {
        Object.values(videoRefs.current).forEach((v) => {
          const video = v as HTMLVideoElement | null;
          if (video) {
            video.currentTime = 0;
            video.muted = true;
            video.play().catch(e => console.warn("Video playback issue:", e));
          }
        });
      }, 50);
    }, 800);
  };

  const handleLinkClick = (link: NavigationLink) => {
    setIsDetonating(link.id);
    audioEngine.playImpact();
    
    setTimeout(() => {
      audioEngine.playSwoosh(); 
      setIsWarping(true);
      audioEngine.playWarp();
    }, 300);

    setTimeout(() => {
      window.location.href = link.url;
    }, 1500);
  };

  const togglePanel = (id: string) => {
    if (activePanelId === id) {
      setActivePanelId(null);
    } else {
      audioEngine.playHum();
      setActivePanelId(id);
    }
  };

  const handleStopAudio = () => {
    audioEngine.stopMusic();
    setIsAudioPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioEngine.setVolume(v);
  };

  return (
    <div className="relative w-screen h-screen bg-black select-none cursor-none overflow-hidden" style={{ perspective: '2000px' }}>
      <CursorInstrument isShooting={isShooting} />
      <WarpTunnel isVisible={isWarping} />

      {/* Persistent Audio Controls */}
      {phase === 'home' && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-2 right-2 md:top-4 md:right-4 z-[150] flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-full shadow-2xl scale-[0.25] origin-top-right"
        >
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={handleVolumeChange}
              className="w-16 accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-none"
            />
          </div>
          <button 
            onClick={isAudioPlaying ? handleStopAudio : () => { audioEngine.playMusic(INTRO_SONG); setIsAudioPlaying(true); }}
            className="group flex items-center gap-2"
          >
            <div className={`w-3 h-3 rounded-full ${isAudioPlaying ? 'bg-cyan-500 animate-pulse' : 'bg-white/20'}`} />
            <span className="font-orbitron text-[10px] tracking-[0.2em] text-white/60 group-hover:text-white transition-colors uppercase whitespace-nowrap">
              {isAudioPlaying ? 'LIVE FEED' : 'RECONNECT'}
            </span>
          </button>
        </motion.div>
      )}

      {/* Enable Bolts Button - Lower Left */}
      {phase === 'home' && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={toggleBolts}
          className="fixed bottom-6 left-6 z-[150] flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg hover:border-cyan-500/50 transition-all group"
        >
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${isBoltsEnabled ? 'bg-cyan-500 shadow-cyan-500 animate-pulse' : 'bg-white/20 shadow-white/10'}`} />
          <span className="font-orbitron text-[9px] tracking-[0.2em] text-white/70 group-hover:text-white uppercase">
            Enable Bolts with Mic
          </span>
          <span className="text-[8px] text-white/30 italic ml-2">(say "shoot")</span>
        </motion.button>
      )}

      {/* Initiation Overlay */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div 
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(50px)' }}
            transition={{ duration: 1.5, ease: "circIn" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
               <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-40 scale-105">
                 <source src={INTRO_VIDEO} type="video/mp4" />
               </video>
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
            </div>

            <div className="relative z-10 text-center liquid-container flex items-center justify-center">
               <motion.div
                  ref={blobRef}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: splatterActive ? 25 : [1, 1.05, 1],
                    borderRadius: splatterActive ? "50%" : ["50% 50% 50% 50%", "48% 52% 45% 55%", "52% 48% 55% 45%"],
                    ...getBlobStyles()
                  }}
                  transition={{ 
                    opacity: { duration: 1 },
                    scale: { duration: splatterActive ? 1.2 : 4, ease: splatterActive ? "expoIn" : "easeInOut", repeat: splatterActive ? 0 : Infinity },
                    borderRadius: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    x: { type: 'spring', damping: 15, stiffness: 60 },
                    y: { type: 'spring', damping: 15, stiffness: 60 }
                  }}
                  onClick={startExperience}
                  className="w-48 h-48 md:w-64 md:h-64 metallic-goo cursor-none flex flex-col items-center justify-center group relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/20 pointer-events-none" />
                  {!splatterActive && (
                    <motion.span 
                      animate={{ opacity: [0.6, 1, 0.6], letterSpacing: ["0.3em", "0.5em", "0.3em"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="font-orbitron text-[8px] md:text-[9px] text-black font-black uppercase pointer-events-none z-20 text-center px-4"
                    >
                      IGNITE INTERFACE
                    </motion.span>
                  )}
               </motion.div>
            </div>
            
            <div className="absolute bottom-10 md:bottom-20 w-full text-center z-10 px-4">
               <h1 className="font-orbitron text-2xl md:text-4xl font-black gold-platinum-text opacity-80 tracking-[0.3em] md:tracking-[0.5em] uppercase">
                  VOICE TO WEBSITE
               </h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Content Section */}
      <div className="relative w-full h-full flex flex-col items-center bg-black overflow-hidden">
        {/* Background Atmosphere */}
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-20 brightness-50">
            <source src={BACKGROUND_TUNNEL} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />
        </div>

        {/* Video Navigation Grid */}
        <motion.div 
          className="relative z-20 w-full flex flex-col md:flex-row h-full items-stretch overflow-hidden md:p-6 lg:p-12 gap-2 md:gap-4"
          initial={{ opacity: 0 }}
          animate={phase === 'home' ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
        >
          {NAV_LINKS.map((link) => {
            const isSelected = isDetonating === link.id;
            const isOpen = activePanelId === link.id;
            const isHovered = hoveredId === link.id;

            return (
              <motion.div 
                key={link.id}
                layout
                onHoverStart={() => {
                  setHoveredId(link.id);
                  if (phase === 'home') audioEngine.playSpark();
                }}
                onHoverEnd={() => setHoveredId(null)}
                className={`relative flex-1 flex flex-col transition-all duration-500 ease-out border border-white/5 rounded-xl group ${isSelected ? 'z-50' : 'z-10'} overflow-hidden shadow-2xl`}
                animate={{
                    flex: isSelected ? 12 : (isHovered ? 2 : 1),
                    scale: isHovered && !isSelected ? 1.02 : 1,
                    opacity: isDetonating && !isSelected ? 0 : 1,
                    borderColor: isHovered ? 'rgba(34, 211, 238, 0.3)' : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black/40">
                  <video
                    ref={(el) => (videoRefs.current[link.id] = el)}
                    muted loop playsInline
                    className={`absolute w-full h-full transition-all duration-700 ${isHovered ? 'object-contain scale-100 grayscale-0' : 'object-cover scale-110 grayscale'}`}
                  >
                    <source src={link.videoUrl} type="video/mp4" />
                  </video>
                  
                  <div className={`absolute inset-0 transition-all duration-700 ${isHovered ? 'bg-transparent' : 'bg-black/60'}`} />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <AnimatePresence>
                      {!isSelected && (
                        <motion.div
                          className="relative flex flex-col items-center"
                          animate={{ y: isOpen ? -80 : 0, scale: isOpen ? 0.7 : 1 }}
                        >
                           <ElectricText 
                             text={link.label} 
                             className="text-lg md:text-2xl lg:text-3xl tracking-[0.4em] mb-4"
                             onClick={() => togglePanel(link.id)}
                             active={isOpen}
                           />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 2], opacity: [0.8, 0] }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-white blur-3xl rounded-full z-[60]"
                    />
                  )}
                </div>

                <AnimatePresence>
                  {isOpen && !isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/90 backdrop-blur-2xl border-t border-cyan-500/20 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <p className="font-orbitron text-[8px] md:text-[9px] tracking-[0.3em] text-white/50 mb-6 uppercase leading-relaxed max-w-xs">
                        {link.description}
                      </p>
                      <button
                        onClick={() => handleLinkClick(link)}
                        className="px-6 py-2 border border-cyan-500/30 bg-cyan-500/5 font-orbitron text-[8px] tracking-[0.4em] text-cyan-400 uppercase transition-all hover:bg-cyan-500 hover:text-black hover:scale-105"
                      >
                        ACCESS PORTAL
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, black 100%);
        }
      `}</style>
    </div>
  );
};

export default App;
