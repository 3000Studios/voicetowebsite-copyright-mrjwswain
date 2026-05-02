import React from "react";
import { cn } from "../lib/utils";

const LegalLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="pt-40 pb-24 px-6 lg:px-12 bg-black min-h-screen">
     <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl lg:text-7xl font-black italic mb-12 tracking-tighter">{title}</h1>
        <div className="glass p-8 lg:p-12 rounded-[3rem] prose prose-invert max-w-none text-white/60 leading-relaxed space-y-8">
           {children}
        </div>
     </div>
  </div>
);

export const TermsOfService = () => (
  <LegalLayout title="Terms of Service">
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">1. Agreement to Terms</h2>
        <p>By accessing VoiceToWebsite.com, you agree to be bound by these Terms of Service. All sales are final. No refunds under any circumstances.</p>
     </section>
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">2. User Responsibility</h2>
        <p>The user is solely responsible for all generated content, claims, legal compliance, and media rights. VoiceToWebsite.com provides the tools, but the user is the publisher.</p>
     </section>
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">3. No Guarantees</h2>
        <p>VoiceToWebsite.com does not guarantee revenue, rankings, traffic, ad approval, legal compliance, or specific business results. AI results vary based on input prompts.</p>
     </section>
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">4. Intellectual Property</h2>
        <p>VoiceToWebsite.com owns the generator and engine. Users on Pro/Ultimate plans are granted a license to use and export the generated code for their own business purposes.</p>
     </section>
  </LegalLayout>
);

export const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy">
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Data Collection</h2>
        <p>We collect minimal data required to process your AI requests and maintain your account. Your voice and text prompts are processed by our AI engines to generate your website previews.</p>
     </section>
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Third Parties</h2>
        <p>We use trusted third-party providers for payment processing (Stripe, PayPal) and AI generation (Google Gemini). We do not sell your personal data to advertisers.</p>
     </section>
  </LegalLayout>
);

export const DMCA = () => (
  <LegalLayout title="DMCA Notice">
     <section>
        <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Copyright Integrity</h2>
        <p>VoiceToWebsite.com respects the intellectual property rights of others. If you believe your work has been used in a way that constitutes copyright infringement, please contact our legal department at legal@voicetowebsite.com.</p>
     </section>
  </LegalLayout>
);
