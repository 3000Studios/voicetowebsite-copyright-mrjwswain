import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Legal = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-8xl font-black text-white mb-12 tracking-tighter uppercase italic"
      >
        LEGAL & <span className="text-indigo-400">PRIVACY</span>
      </motion.h1>

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-black text-white mb-8 uppercase italic tracking-tight">Terms of Service</h2>
          <div className="lifted-section bg-slate-900 p-10 border-l-8 border-indigo-600">
            <ScrollArea className="h-[400px] pr-6">
              <div className="text-slate-400 space-y-6 text-lg font-medium leading-relaxed">
                <p className="font-black text-indigo-400 uppercase tracking-widest italic text-sm">Last Updated: May 1, 2026</p>
                <p>Welcome to VoiceToWebsite.com. By using our services, you agree to be bound by the following terms and conditions.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">1. Acceptance of Terms</h3>
                <p>By accessing or using the VoiceToWebsite platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">2. Description of Service</h3>
                <p>VoiceToWebsite provides an AI-powered website generation tool. We do not guarantee that the generated websites will meet all legal requirements in your specific jurisdiction. It is your responsibility to review and ensure compliance.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">3. User Content</h3>
                <p>You retain all rights to the voice and text input you provide. However, you grant VoiceToWebsite a non-exclusive, worldwide, royalty-free license to use this content to improve our AI models.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">4. Intellectual Property</h3>
                <p>The VoiceToWebsite platform, including its neural architecture, design system, and underlying code, is the property of VoiceToWebsite.com and is protected by international copyright laws.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">5. Limitation of Liability</h3>
                <p>VoiceToWebsite shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">6. Refund Policy</h3>
                <p><strong>All sales are final and non-refundable.</strong> Once checkout is complete, generation and hosting resources are reserved immediately and cannot be reversed.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">7. User Responsibility</h3>
                <p>You are solely responsible for the legality, accuracy, and rights clearance of all content, media, claims, and offers on your generated website.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">8. Indemnity</h3>
                <p>You agree to defend and indemnify VoiceToWebsite and 3000 Studios LLC from third-party claims, damages, and costs arising from your content, commercial use, or legal non-compliance.</p>
              </div>
            </ScrollArea>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-black text-white mb-8 uppercase italic tracking-tight">Privacy Policy</h2>
          <div className="lifted-section bg-slate-900 p-10 border-l-8 border-indigo-600">
            <ScrollArea className="h-[400px] pr-6">
              <div className="text-slate-400 space-y-6 text-lg font-medium leading-relaxed">
                <p className="font-black text-indigo-400 uppercase tracking-widest italic text-sm">Last Updated: April 11, 2026</p>
                <p>Your privacy is paramount to us. This policy explains how we collect, use, and protect your data.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">1. Data Collection</h3>
                <p>We collect voice data, text inputs, and usage metrics to provide and improve our services. Voice data is processed in real-time and is not stored permanently unless explicitly requested.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">2. Use of Data</h3>
                <p>We use your data to generate websites, personalize your experience, and communicate with you about our services.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">3. Data Sharing</h3>
                <p>We do not sell your personal data to third parties. We may share data with service providers (like Stripe for payments) as necessary to provide our services.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">4. Security</h3>
                <p>We implement industry-standard security measures to protect your data from unauthorized access or disclosure.</p>
                <h3 className="text-white font-black uppercase italic tracking-tight text-xl mt-8">5. Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal data. Contact us at support@voicetowebsite.com for assistance.</p>
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>
    </div>
  );
};
