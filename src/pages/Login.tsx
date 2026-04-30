import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-12 relative overflow-hidden text-center"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
        <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">Manifest <span className="text-indigo-500">Identity</span></h2>
        <p className="text-slate-400 mb-10 font-light italic">Unlock the command center using your Google account. <br /> <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 block">Note: Access requires an active subscription protocol.</span></p>
        
        <button 
          onClick={loginWithGoogle}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(79,70,229,0.6)] transition-all mb-6"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>

        <button 
          onClick={() => navigate('/#pricing')}
          className="text-[10px] font-black underline uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all italic"
        >
          View Subscription Models
        </button>

        <p className="mt-12 text-[10px] text-slate-500 font-black uppercase tracking-widest italic opacity-50">
          Neural Handshake Protocol V4.2
        </p>
      </motion.div>
    </div>
  );
};
