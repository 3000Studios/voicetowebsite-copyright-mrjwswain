import React from "react";
import { Helmet } from "react-helmet-async";

import { FaqTeaser } from "./FaqTeaser";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LivePreviewTeaser } from "./LivePreviewTeaser";
import { Personas } from "./Personas";
import { PricingTrio } from "./PricingTrio";
import { Showcase } from "./Showcase";

export const HomeV2: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>VoiceToWebsite — Speak. Build. Ship.</title>
        <meta name="description" content="A premium voice-to-website builder. Speak a 60-second brief, get a hosted homepage with real Gemini copy. Plans from $9.99/mo." />
        <link rel="canonical" href="https://voicetowebsite.com/" />
      </Helmet>

      <Hero />
      <Personas />
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <Showcase />
      <LivePreviewTeaser />
      <PricingTrio />
      <FaqTeaser />
    </>
  );
};
