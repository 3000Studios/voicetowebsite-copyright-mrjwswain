import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Type, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Loader2,
  Sparkles,
  Building2,
  Palette,
  Layout,
  Globe
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

interface OnboardingWizardProps {
  onComplete: (data: WizardData) => void;
  onClose: () => void;
}

export interface WizardData {
  inputType: 'voice' | 'text';
  businessName: string;
  industry: string;
  style: 'modern' | 'classic' | 'minimal' | 'bold';
  pages: string[];
  transcript?: string;
  description?: string;
}

const INDUSTRIES = [
  { id: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
  { id: 'coach', label: 'Coaching / Consulting', icon: '🎯' },
  { id: 'retail', label: 'Retail / E-commerce', icon: '🛍️' },
  { id: 'health', label: 'Health / Wellness', icon: '💪' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
  { id: 'creative', label: 'Creative / Design', icon: '🎨' },
  { id: 'tech', label: 'Technology / SaaS', icon: '💻' },
  { id: 'professional', label: 'Professional Services', icon: '💼' },
  { id: 'education', label: 'Education / Training', icon: '📚' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const STYLES = [
  { id: 'modern', label: 'Modern', description: 'Clean, contemporary design', color: 'bg-blue-500' },
  { id: 'classic', label: 'Classic', description: 'Timeless, elegant style', color: 'bg-amber-600' },
  { id: 'minimal', label: 'Minimal', description: 'Simple, focused layout', color: 'bg-gray-600' },
  { id: 'bold', label: 'Bold', description: 'Vibrant, eye-catching', color: 'bg-red-500' },
];

const PAGE_OPTIONS = [
  { id: 'home', label: 'Home', default: true },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio / Gallery' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
  { id: 'blog', label: 'Blog' },
  { id: 'faq', label: 'FAQ' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'booking', label: 'Booking / Schedule' },
];

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<WizardData>({
    inputType: 'voice',
    businessName: '',
    industry: '',
    style: 'modern',
    pages: ['home'],
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { trackEvent } = useAnalytics();

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) {
            updateData({ transcript: '[Voice recording processed]' });
            trackEvent('voice_record_complete');
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      trackEvent('voice_record_start');
    } catch (err) {
      console.error('Recording error:', err);
      alert('Could not access microphone. Please use text input instead.');
      updateData({ inputType: 'text' });
    }
  }, [updateData, trackEvent]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleNext = useCallback(() => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      setIsProcessing(true);
      trackEvent('site_generate_start', { input_type: data.inputType });
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        onComplete(data);
      }, 2000);
    }
  }, [step, data, onComplete, trackEvent]);

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return data.businessName.length >= 3;
      case 3: return data.industry !== '';
      case 4: return true;
      case 5: return data.pages.length >= 1;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0a1628] border border-white/10 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-white">Create Your Site</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-cyan-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-12"
              >
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                <p className="text-white font-medium">Generating your website...</p>
                <p className="text-white/60 text-sm mt-2">
                  Our AI is crafting the perfect site based on your input
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Step 1: Input Method */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        How would you like to create your site?
                      </h2>
                      <p className="text-white/60">
                        Choose your preferred input method
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => updateData({ inputType: 'voice' })}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          data.inputType === 'voice'
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Mic className={`w-8 h-8 mx-auto mb-3 ${
                          data.inputType === 'voice' ? 'text-cyan-400' : 'text-white/60'
                        }`} />
                        <p className="font-medium text-white">Voice</p>
                        <p className="text-sm text-white/60 mt-1">
                          Speak naturally about your business
                        </p>
                      </button>
                      
                      <button
                        onClick={() => updateData({ inputType: 'text' })}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          data.inputType === 'text'
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Type className={`w-8 h-8 mx-auto mb-3 ${
                          data.inputType === 'text' ? 'text-cyan-400' : 'text-white/60'
                        }`} />
                        <p className="font-medium text-white">Text</p>
                        <p className="text-sm text-white/60 mt-1">
                          Type a description
                        </p>
                      </button>
                    </div>

                    {data.inputType === 'voice' && (
                      <div className="mt-6 p-4 bg-white/5 rounded-xl">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                            isRecording
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                              : 'bg-cyan-500 text-white hover:bg-cyan-600'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="w-5 h-5" />
                              Start Recording
                            </>
                          )}
                        </button>
                        {data.transcript && (
                          <p className="mt-3 text-sm text-white/60 text-center">
                            ✓ Recording captured
                          </p>
                        )}
                      </div>
                    )}

                    {data.inputType === 'text' && (
                      <div className="mt-6">
                        <textarea
                          value={data.description || ''}
                          onChange={(e) => updateData({ description: e.target.value })}
                          placeholder="Describe your business, what you offer, and what makes you unique..."
                          className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Business Name */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <Building2 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        What's your business name?
                      </h2>
                      <p className="text-white/60">
                        This will be the title of your website
                      </p>
                    </div>
                    
                    <input
                      type="text"
                      value={data.businessName}
                      onChange={(e) => updateData({ businessName: e.target.value })}
                      placeholder="e.g., Smith & Associates"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg text-center placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                )}

                {/* Step 3: Industry */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        What industry are you in?
                      </h2>
                      <p className="text-white/60">
                        We'll customize your site for your industry
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {INDUSTRIES.map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() => updateData({ industry: ind.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                            data.industry === ind.id
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <span className="text-2xl">{ind.icon}</span>
                          <span className="font-medium text-white text-sm">{ind.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Style */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Palette className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Choose your style
                      </h2>
                      <p className="text-white/60">
                        Select a design aesthetic
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => updateData({ style: style.id as any })}
                          className={`p-5 rounded-xl border-2 text-left transition-all ${
                            data.style === style.id
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${style.color} mb-3`} />
                          <p className="font-medium text-white">{style.label}</p>
                          <p className="text-sm text-white/60 mt-1">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Pages */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Layout className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        What pages do you need?
                      </h2>
                      <p className="text-white/60">
                        Select the pages for your website
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {PAGE_OPTIONS.map((page) => {
                        const isSelected = data.pages.includes(page.id);
                        const isDefault = page.default;
                        
                        return (
                          <button
                            key={page.id}
                            onClick={() => {
                              if (isDefault) return; // Can't unselect home
                              const newPages = isSelected
                                ? data.pages.filter(p => p !== page.id)
                                : [...data.pages, page.id];
                              updateData({ pages: newPages });
                            }}
                            disabled={isDefault}
                            className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                              isSelected || isDefault
                                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                                : 'border-white/10 text-white/60 hover:border-white/30'
                            } ${isDefault ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {(isSelected || isDefault) && <Check className="w-4 h-4" />}
                            {page.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    <p className="text-center text-sm text-white/40">
                      {data.pages.length} page{data.pages.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isProcessing && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={step === 1 ? onClose : () => setStep(step - 1)}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {step === 5 ? 'Generate Site' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
