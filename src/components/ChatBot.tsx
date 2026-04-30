import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useSound } from '@/lib/sounds';

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; content: string }[]>([
    { role: 'bot', content: 'Hello, how can I help you today? I can help you build an empire, or just tell you a joke about websites.' }
  ]);
  const [input, setInput] = useState('');
  const { playTick, playClick } = useSound();

  const answers: Record<string, string> = {
    'joke': "Why did the website go to the doctor? Because it had too many 'pings'!",
    'empire': "Building an empire starts with a single voice command. Just speak, and I'll build the rest.",
    'who are you': "I am the VoiceToWebsite AI. I'm like a genie, but instead of a lamp, I live in your browser and I don't grant wishes—I build digital realities.",
    'price': "Our plans start at $19.99/mo. It's a small price to pay for digital dominance.",
    'help': "I can help you with pricing, features, or just keep you company while you launch your vision.",
    'hello': "Greetings, visionary! Ready to speak your dreams into existence?",
  };

  const handleSend = () => {
    if (!input.trim()) return;
    playClick();
    const userMsg = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    setTimeout(() => {
      let botResponse = "That's a deep thought. Let me prepare an answer for you soon. For now, try asking about 'pricing', 'empire', or a 'joke'.";
      
      for (const key in answers) {
        if (userMsg.includes(key)) {
          botResponse = answers[key];
          break;
        }
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.5, filter: 'blur(10px)' }}
            className="mb-6"
          >
            <div className="w-[380px] bg-slate-900/90 backdrop-blur-3xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="bg-slate-950/50 p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center pulse-ring relative">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <span className="text-white font-black uppercase italic tracking-tight text-3d">VoiceToWebsite AI</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="h-[400px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'bot' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium italic ${
                      msg.role === 'bot' ? 'bg-white/5 text-slate-300' : 'bg-indigo-600 text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-950/30">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all italic"
                  />
                  <button 
                    onClick={handleSend}
                    className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition-all"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => { playClick(); setIsOpen(!isOpen); }}
        onMouseEnter={playTick}
        animate={{ 
          scale: [1, 1.1, 1],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center shadow-2xl hover:brightness-110 transition-all relative group overflow-hidden btn-oval"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          className="relative z-10"
        >
          {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
        </motion.div>
        {!isOpen && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 relative z-10">Chat</span>
        )}
      </motion.button>
    </div>
  );
};
