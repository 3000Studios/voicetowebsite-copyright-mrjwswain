import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Business Coach',
    company: 'Elevate Coaching',
    content: 'I described my coaching business and within minutes had a professional website that actually converts. The voice feature is incredible - I literally spoke my site into existence.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    role: 'Startup Founder',
    company: 'TechFlow Solutions',
    content: 'We needed a landing page for our product launch ASAP. VoiceToWebsite delivered in under 5 minutes. The quality exceeded our expectations and the monetization features are built right in.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Jennifer Rodriguez',
    role: 'Real Estate Agent',
    company: 'Premier Properties',
    content: 'As someone who is not tech-savvy, this platform is a game-changer. I just said what I needed and got a stunning site with lead capture forms. My first client came through the site within a week.',
    rating: 5,
  },
  {
    id: '4',
    name: 'David Park',
    role: 'Consultant',
    company: 'Strategic Growth Advisors',
    content: 'The premium design quality is what sold me. Every site looks like it cost thousands to build. I have generated 3 different sites for various aspects of my business.',
    rating: 5,
  },
];

export const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Quote Icon */}
      <div className="absolute -top-8 left-0 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center">
        <Quote className="w-8 h-8 text-indigo-400" />
      </div>

      {/* Testimonial Card */}
      <div className="relative min-h-[300px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-2xl p-10 md:p-12">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
                "{current.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl">
                  {current.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-bold">{current.name}</h4>
                  <p className="text-slate-400 text-sm">
                    {current.role} at {current.company}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prev}
          className="p-3 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-8 bg-indigo-500'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="p-3 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
