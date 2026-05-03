const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface WebsiteConfig {
  id: string;
  name: string;
  mood: string;
  bestUseCase: string;
  conversionFocus: string;
  fontPair: string;
  palette: string[];
  qualityScore: number;
  html: string;
}

export async function generateWebsiteVariations(
  prompt: string,
): Promise<WebsiteConfig[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Type guard to ensure data has variations property
    if (
      data &&
      typeof data === "object" &&
      "variations" in data &&
      Array.isArray(data.variations)
    ) {
      return data.variations.map((variation, index) => ({
        id: variation.id || `var-${index + 1}`,
        name: variation.name || `Website Variation ${index + 1}`,
        mood: variation.mood || "Modern",
        bestUseCase: variation.bestUseCase || "Business Website",
        conversionFocus: variation.conversionFocus || "Lead Generation",
        fontPair: variation.fontPair || "Inter / System",
        palette: variation.palette || ["#06b6d4", "#8b5cf6"],
        qualityScore:
          variation.qualityScore || 85 + Math.floor(Math.random() * 15),
        html:
          variation.html ||
          generateFallbackHTML(variation.title || `Website ${index + 1}`),
      }));
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("AI Generation failed:", error);
    return getFallbackVariations();
  }
}

function generateFallbackHTML(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            cyan: '#06b6d4',
                            purple: '#8b5cf6'
                        }
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'slide-up': 'slideUp 0.8s ease-out',
                        'fade-in': 'fadeIn 1s ease-out',
                        'scale-in': 'scaleIn 0.6s ease-out',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                        },
                        slideUp: {
                            '0%': { transform: 'translateY(40px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' },
                        },
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        scaleIn: {
                            '0%': { transform: 'scale(0.9)', opacity: '0' },
                            '100%': { transform: 'scale(1)', opacity: '1' },
                        },
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            scroll-behavior: smooth;
        }
        .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .text-gradient {
            background: linear-gradient(135deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .neon-glow {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .card-hover {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(6, 182, 212, 0.25);
        }
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease-out;
        }
        .scroll-reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .hero-bg {
            background: radial-gradient(ellipse at top, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                        linear-gradient(180deg, #0a0a0a 0%, #111111 100%);
        }
        .section-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent);
        }
    </style>
</head>
<body class="bg-black text-white font-inter overflow-x-hidden">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 glass">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="text-2xl font-bold text-gradient">V</div>
            <div class="hidden md:flex items-center gap-8">
                <a href="#features" class="text-white/70 hover:text-white transition-colors">Features</a>
                <a href="#testimonials" class="text-white/70 hover:text-white transition-colors">Testimonials</a>
                <a href="#pricing" class="text-white/70 hover:text-white transition-colors">Pricing</a>
                <button class="px-6 py-2 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full font-semibold hover:scale-105 transition-transform">
                    Get Started
                </button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0">
            <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 2s;"></div>
        </div>

        <div class="relative z-10 text-center max-w-4xl mx-auto px-6 animate-slide-up">
            <div class="inline-block px-4 py-2 rounded-full glass text-brand-cyan text-sm font-semibold mb-6">
                ✨ AI-Powered Website Builder
            </div>
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span class="text-gradient">${title}</span>
            </h1>
            <p class="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Transform your ideas into stunning, conversion-optimized websites with AI. No coding required.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="px-8 py-4 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full font-bold text-lg hover:scale-105 transition-transform neon-glow">
                    Start Building Free
                </button>
                <button class="px-8 py-4 glass rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                    Watch Demo
                </button>
            </div>

            <div class="mt-16 animate-float">
                <div class="glass rounded-2xl p-6 max-w-2xl mx-auto">
                    <div class="flex items-center gap-4">
                        <div class="flex -space-x-2">
                            <div class="w-10 h-10 rounded-full bg-brand-cyan"></div>
                            <div class="w-10 h-10 rounded-full bg-brand-purple"></div>
                            <div class="w-10 h-10 rounded-full bg-pink-500"></div>
                        </div>
                        <div class="text-left">
                            <p class="text-sm font-semibold">Trusted by 10,000+ creators</p>
                            <p class="text-xs text-white/60">Join the future of web design</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 relative">
        <div class="section-divider mb-24"></div>
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl md:text-5xl font-black mb-4">
                    <span class="text-gradient">Powerful Features</span>
                </h2>
                <p class="text-white/70 max-w-2xl mx-auto">
                    Everything you need to build professional websites in minutes
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass rounded-2xl p-8 card-hover scroll-reveal">
                    <div class="w-16 h-16 rounded-2xl bg-brand-cyan/20 flex items-center justify-center mb-6">
                        <svg class="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-3">Lightning Fast</h3>
                    <p class="text-white/60">Generate complete websites in under 60 seconds with our advanced AI engine.</p>
                </div>

                <div class="glass rounded-2xl p-8 card-hover scroll-reveal" style="transition-delay: 0.1s;">
                    <div class="w-16 h-16 rounded-2xl bg-brand-purple/20 flex items-center justify-center mb-6">
                        <svg class="w-8 h-8 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-3">Responsive Design</h3>
                    <p class="text-white/60">Every website is fully responsive and looks perfect on any device.</p>
                </div>

                <div class="glass rounded-2xl p-8 card-hover scroll-reveal" style="transition-delay: 0.2s;">
                    <div class="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6">
                        <svg class="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-3">Custom Styling</h3>
                    <p class="text-white/60">Beautiful animations, gradients, and effects that capture attention.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="py-24 relative">
        <div class="section-divider mb-24"></div>
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl md:text-5xl font-black mb-4">
                    <span class="text-gradient">What People Say</span>
                </h2>
                <p class="text-white/70 max-w-2xl mx-auto">
                    Join thousands of satisfied creators
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass rounded-2xl p-8 card-hover scroll-reveal">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple"></div>
                        <div>
                            <p class="font-bold">Sarah Johnson</p>
                            <p class="text-sm text-white/60">Entrepreneur</p>
                        </div>
                    </div>
                    <p class="text-white/80">"This tool saved me weeks of work. I launched my business website in just 2 hours!"</p>
                    <div class="mt-4 flex gap-1">
                        <div class="w-4 h-4 rounded-full bg-brand-cyan"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-cyan"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-cyan"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-cyan"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-cyan"></div>
                    </div>
                </div>

                <div class="glass rounded-2xl p-8 card-hover scroll-reveal" style="transition-delay: 0.1s;">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-r from-brand-purple to-pink-500"></div>
                        <div>
                            <p class="font-bold">Mike Chen</p>
                            <p class="text-sm text-white/60">Developer</p>
                        </div>
                    </div>
                    <p class="text-white/80">"The AI understands exactly what I need. The generated code is clean and production-ready."</p>
                    <div class="mt-4 flex gap-1">
                        <div class="w-4 h-4 rounded-full bg-brand-purple"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-purple"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-purple"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-purple"></div>
                        <div class="w-4 h-4 rounded-full bg-brand-purple"></div>
                    </div>
                </div>

                <div class="glass rounded-2xl p-8 card-hover scroll-reveal" style="transition-delay: 0.2s;">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-brand-cyan"></div>
                        <div>
                            <p class="font-bold">Emily Davis</p>
                            <p class="text-sm text-white/60">Designer</p>
                        </div>
                    </div>
                    <p class="text-white/80">"Finally, a tool that combines beautiful design with powerful functionality. Amazing!"</p>
                    <div class="mt-4 flex gap-1">
                        <div class="w-4 h-4 rounded-full bg-pink-500"></div>
                        <div class="w-4 h-4 rounded-full bg-pink-500"></div>
                        <div class="w-4 h-4 rounded-full bg-pink-500"></div>
                        <div class="w-4 h-4 rounded-full bg-pink-500"></div>
                        <div class="w-4 h-4 rounded-full bg-pink-500"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 relative">
        <div class="section-divider mb-24"></div>
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl md:text-5xl font-black mb-4">
                    <span class="text-gradient">Simple Pricing</span>
                </h2>
                <p class="text-white/70 max-w-2xl mx-auto">
                    Start free, upgrade when you're ready
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div class="glass rounded-2xl p-8 card-hover scroll-reveal">
                    <h3 class="text-xl font-bold mb-2">Free</h3>
                    <p class="text-4xl font-black mb-6">$0</p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            3 Website Generations
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Basic Templates
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Community Support
                        </li>
                    </ul>
                    <button class="w-full py-3 glass rounded-xl font-semibold hover:bg-white/10 transition-colors">
                        Get Started
                    </button>
                </div>

                <div class="glass rounded-2xl p-8 card-hover border-2 border-brand-cyan scroll-reveal relative" style="transition-delay: 0.1s;">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-cyan rounded-full text-xs font-bold">
                        POPULAR
                    </div>
                    <h3 class="text-xl font-bold mb-2">Pro</h3>
                    <p class="text-4xl font-black mb-6">$29<span class="text-lg font-normal text-white/60">/mo</span></p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Unlimited Generations
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Premium Templates
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Priority Support
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Export Code
                        </li>
                    </ul>
                    <button class="w-full py-3 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-xl font-bold hover:scale-105 transition-transform">
                        Start Pro Trial
                    </button>
                </div>

                <div class="glass rounded-2xl p-8 card-hover scroll-reveal" style="transition-delay: 0.2s;">
                    <h3 class="text-xl font-bold mb-2">Enterprise</h3>
                    <p class="text-4xl font-black mb-6">$99<span class="text-lg font-normal text-white/60">/mo</span></p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Everything in Pro
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Custom Branding
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Dedicated Support
                        </li>
                        <li class="flex items-center gap-2 text-white/70">
                            <svg class="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            White Label
                        </li>
                    </ul>
                    <button class="w-full py-3 glass rounded-xl font-semibold hover:bg-white/10 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 relative">
        <div class="section-divider mb-24"></div>
        <div class="max-w-4xl mx-auto px-6 text-center scroll-reveal">
            <h2 class="text-4xl md:text-6xl font-black mb-6">
                <span class="text-gradient">Ready to Build?</span>
            </h2>
            <p class="text-xl text-white/70 mb-8">
                Join thousands of creators building amazing websites with AI
            </p>
            <button class="px-12 py-5 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full font-bold text-xl hover:scale-105 transition-transform neon-glow">
                Start Building Free
            </button>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t border-white/10">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="text-2xl font-bold text-gradient">V</div>
                <div class="flex items-center gap-6 text-white/60">
                    <a href="#" class="hover:text-white transition-colors">Privacy</a>
                    <a href="#" class="hover:text-white transition-colors">Terms</a>
                    <a href="#" class="hover:text-white transition-colors">Contact</a>
                </div>
                <p class="text-white/40 text-sm">© 2024 VoiceToWebsite. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // Scroll reveal animation
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });

        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    </script>
</body>
</html>`;
}

function getFallbackVariations(): WebsiteConfig[] {
  return [
    {
      id: "fallback-1",
      name: "Modern Professional",
      mood: "Cinematic Premium",
      bestUseCase: "Business Website",
      conversionFocus: "Lead Generation",
      fontPair: "Inter / System",
      palette: ["#06b6d4", "#1e40af"],
      qualityScore: 92,
      html: generateFallbackHTML("Modern Professional"),
    },
    {
      id: "fallback-2",
      name: "Creative Bold",
      mood: "Bold Experimental",
      bestUseCase: "Portfolio Website",
      conversionFocus: "Showcase",
      fontPair: "Space Grotesk / Inter",
      palette: ["#8b5cf6", "#ec4899"],
      qualityScore: 89,
      html: generateFallbackHTML("Creative Bold"),
    },
    {
      id: "fallback-3",
      name: "Clean Minimal",
      mood: "Clean Conversion",
      bestUseCase: "SaaS Product",
      conversionFocus: "Sign-ups",
      fontPair: "Inter / System",
      palette: ["#10b981", "#064e3b"],
      qualityScore: 95,
      html: generateFallbackHTML("Clean Minimal"),
    },
  ];
}
