// Programmatic Content Engine - Auto-SEO System
// Generates long-tail content pages for voice-to-website niche

export interface ContentTopic {
  keyword: string;
  title: string;
  slug: string;
  category: 'comparison' | 'use-case' | 'how-to' | 'industry';
  searchVolume: number;
  difficulty: 'low' | 'medium' | 'high';
}

// High-value long-tail keywords for AI website builders
export const contentTopics: ContentTopic[] = [
  // Comparisons
  { keyword: "voicetowebsite vs durable", title: "VoiceToWebsite vs Durable: Which AI Builder Wins in 2026?", slug: "voicetowebsite-vs-durable", category: "comparison", searchVolume: 1200, difficulty: "medium" },
  { keyword: "voicetowebsite vs framer", title: "VoiceToWebsite vs Framer: Speed vs Design Freedom", slug: "voicetowebsite-vs-framer", category: "comparison", searchVolume: 800, difficulty: "medium" },
  { keyword: "voicetowebsite vs 10web", title: "VoiceToWebsite vs 10Web: WordPress-Free AI Building", slug: "voicetowebsite-vs-10web", category: "comparison", searchVolume: 600, difficulty: "low" },
  { keyword: "voicetowebsite vs wix adi", title: "VoiceToWebsite vs Wix ADI: Code Ownership Comparison", slug: "voicetowebsite-vs-wix-adi", category: "comparison", searchVolume: 1500, difficulty: "high" },
  
  // Use cases
  { keyword: "ai website builder for restaurants", title: "AI Website Builder for Restaurants: Voice-Powered Menus", slug: "ai-website-builder-restaurants", category: "use-case", searchVolume: 2400, difficulty: "medium" },
  { keyword: "ai website builder for dentists", title: "AI Website Builder for Dentists: Patient Booking Sites", slug: "ai-website-builder-dentists", category: "use-case", searchVolume: 1800, difficulty: "low" },
  { keyword: "ai website builder for coaches", title: "AI Website Builder for Coaches: High-Ticket Funnel Sites", slug: "ai-website-builder-coaches", category: "use-case", searchVolume: 3200, difficulty: "medium" },
  { keyword: "ai website builder for saas", title: "AI Website Builder for SaaS: Product Landing Pages", slug: "ai-website-builder-saas", category: "use-case", searchVolume: 4500, difficulty: "high" },
  { keyword: "ai website builder for agencies", title: "AI Website Builder for Agencies: White-Label Solutions", slug: "ai-website-builder-agencies", category: "use-case", searchVolume: 2800, difficulty: "medium" },
  { keyword: "ai website builder for real estate", title: "AI Website Builder for Real Estate: Property Listings", slug: "ai-website-builder-real-estate", category: "use-case", searchVolume: 3600, difficulty: "medium" },
  
  // How-to guides
  { keyword: "how to build website with voice", title: "How to Build a Website With Your Voice (Complete Guide)", slug: "how-to-build-website-with-voice", category: "how-to", searchVolume: 5200, difficulty: "low" },
  { keyword: "voice to website tutorial", title: "Voice to Website Tutorial: From Speech to Live Site", slug: "voice-to-website-tutorial", category: "how-to", searchVolume: 1800, difficulty: "low" },
  { keyword: "ai website builder tutorial", title: "AI Website Builder Tutorial: 2-Minute Site Generation", slug: "ai-website-builder-tutorial", category: "how-to", searchVolume: 4100, difficulty: "medium" },
  
  // Industries
  { keyword: "voice powered landing pages", title: "Voice-Powered Landing Pages: The 2026 Conversion Hack", slug: "voice-powered-landing-pages", category: "industry", searchVolume: 900, difficulty: "low" },
  { keyword: "ai generated business websites", title: "AI Generated Business Websites: Complete Owner's Guide", slug: "ai-generated-business-websites", category: "industry", searchVolume: 6700, difficulty: "medium" },
];

// Content template generators
export function generateComparisonContent(competitor: string, ourStrengths: string[], theirWeaknesses: string[]) {
  return {
    metaDescription: `Compare VoiceToWebsite vs ${competitor}. See why ${ourStrengths.length} unique features make us the better choice for AI-powered site building.`,
    headings: [
      `VoiceToWebsite vs ${competitor}: At a Glance`,
      `Where VoiceToWebsite Wins`,
      `${competitor}'s Limitations`,
      `Feature Comparison Table`,
      `Pricing Breakdown`,
      `Which Should You Choose?`,
      `Try VoiceToWebsite Free`
    ],
    faq: [
      { question: `Is VoiceToWebsite faster than ${competitor}?`, answer: `Yes. VoiceToWebsite generates sites in under 2 minutes using voice input, while ${competitor} requires manual configuration.` },
      { question: `Can I export my code with ${competitor}?`, answer: `VoiceToWebsite provides full code ownership. Check ${competitor}'s terms for export limitations.` },
    ],
    cta: "Start Building Free",
    schema: {
      "@context": "https://schema.org",
      "@type": "ComparisonTable",
      name: `VoiceToWebsite vs ${competitor}`,
      description: `Detailed comparison of features, pricing, and capabilities`
    }
  };
}

export function generateUseCaseContent(industry: string, useCases: string[]) {
  return {
    metaDescription: `AI website builder for ${industry}. Generate professional sites with voice in 2 minutes. See ${useCases.length} industry-specific examples.`,
    headings: [
      `AI Websites for ${industry}: The Complete Guide`,
      `Why ${industry} Professionals Choose VoiceToWebsite`,
      `${useCases.length} Ready-Made Templates`,
      `Voice Features for ${industry}`,
      `SEO Built for ${industry} Search Terms`,
      `Getting Started Guide`,
      `Success Stories`
    ],
    faq: [
      { question: `Can I integrate ${industry}-specific tools?`, answer: `Yes. VoiceToWebsite supports custom code injection and API integrations for any industry.` },
      { question: `How long does a ${industry} website take?`, answer: `Most ${industry.toLowerCase()} sites are generated in under 2 minutes via voice description.` },
    ],
    cta: `Build Your ${industry} Site Now`,
    schema: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `Build a ${industry} Website With AI`,
      step: useCases.map((useCase, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: useCase,
        text: `Generate ${useCase.toLowerCase()} with voice input`
      }))
    }
  };
}

// Content freshness tracker
export function calculateContentFreshness(lastUpdated: Date): { status: 'fresh' | 'stale' | 'expired'; days: number } {
  const days = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return { status: 'fresh', days };
  if (days < 90) return { status: 'stale', days };
  return { status: 'expired', days };
}

// Auto-refresh scheduling
export function shouldRefreshContent(topic: ContentTopic, lastUpdated: Date): boolean {
  const { status } = calculateContentFreshness(lastUpdated);
  return status === 'expired' || (status === 'stale' && topic.difficulty === 'high');
}

// Internal linking suggestions
export function getRelatedContent(currentSlug: string): ContentTopic[] {
  const current = contentTopics.find(t => t.slug === currentSlug);
  if (!current) return [];
  
  return contentTopics
    .filter(t => t.slug !== currentSlug && t.category === current.category)
    .slice(0, 3);
}

// Performance tracking
export interface ContentPerformance {
  slug: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  searchRankings: { keyword: string; position: number }[];
}

export function pruneUnderperforming(pages: ContentPerformance[]): string[] {
  return pages
    .filter(p => p.pageviews < 100 && p.conversions === 0 && p.avgTimeOnPage < 30)
    .map(p => p.slug);
}

// Export for programmatic generation
export const contentEngine = {
  topics: contentTopics,
  generateComparison: generateComparisonContent,
  generateUseCase: generateUseCaseContent,
  getRelated: getRelatedContent,
  shouldRefresh: shouldRefreshContent,
  prune: pruneUnderperforming,
  freshness: calculateContentFreshness
};
