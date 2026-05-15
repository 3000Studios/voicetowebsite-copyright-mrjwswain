import React from "react";

const CONTACT_EMAIL = "mr.jwswain@gmail.com";
const LAST_UPDATED = "May 15, 2026";
const OPERATOR = "3000 Studios (Mr. J. Swain)";

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="pt-40 pb-24 px-6 lg:px-12 bg-black min-h-screen">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl lg:text-7xl font-black italic mb-4 tracking-tighter">{title}</h1>
      <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-12">Last updated {LAST_UPDATED}</p>
      <div className="glass p-8 lg:p-12 rounded-[3rem] prose prose-invert max-w-none text-white/60 leading-relaxed space-y-8">
        {children}
      </div>
    </div>
  </div>
);

const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">{heading}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

export const TermsOfService = () => (
  <LegalLayout title="Terms of Service">
    <Section heading="1. Agreement to Terms">
      <p>By accessing VoiceToWebsite.com you agree to these Terms. The service is operated by {OPERATOR}. If you do not agree, do not use the service.</p>
    </Section>
    <Section heading="2. Subscriptions and Billing">
      <p>Paid plans are billed monthly or annually in advance through Stripe. Monthly plans renew automatically until canceled. You can cancel from your dashboard at any time; cancellation takes effect at the end of the current billing period.</p>
      <p>Listed prices are in USD and exclude any applicable taxes that your jurisdiction may add at checkout.</p>
    </Section>
    <Section heading="3. Refunds">
      <p>Subscription fees and one-time command bundles are non-refundable once the billing period or bundle has begun. See the <a className="text-white underline" href="/refunds">Refund Policy</a> for limited exceptions.</p>
    </Section>
    <Section heading="4. User Responsibility">
      <p>You are solely responsible for the content you generate, the claims you publish, the media rights to images and audio you upload, and the legal compliance of the resulting website (including disclosures, accessibility, and applicable regulations in your jurisdiction).</p>
    </Section>
    <Section heading="5. No Guarantees">
      <p>VoiceToWebsite.com provides software tools. We do not guarantee revenue, search rankings, traffic, ad-network approval, regulatory compliance, or any specific business outcome. AI output varies based on inputs.</p>
    </Section>
    <Section heading="6. Intellectual Property">
      <p>VoiceToWebsite.com owns the platform, engine, and underlying templates. Subscribers on Pro and Ultimate plans are granted a non-exclusive, worldwide license to use and export the generated site code for their own business. Starter plan output is licensed for hosted use on our subdomains only.</p>
    </Section>
    <Section heading="7. Prohibited Use">
      <p>You may not use the service to generate sites for illegal activity, deceptive impersonation, malware distribution, harassment, or content that violates third-party rights. We may suspend accounts that do so without refund.</p>
    </Section>
    <Section heading="8. Limitation of Liability">
      <p>To the maximum extent permitted by law, the operator's aggregate liability is limited to the amount you paid in the 12 months preceding the claim. The service is provided "as is" without warranties of merchantability or fitness for a particular purpose.</p>
    </Section>
    <Section heading="9. Changes">
      <p>We may update these Terms; material changes will be announced in-app or by email. Continued use after changes constitutes acceptance.</p>
    </Section>
    <Section heading="10. Governing Law">
      <p>These Terms are governed by the laws of the United States and the state in which the operator resides, without regard to conflict-of-laws principles.</p>
    </Section>
    <Section heading="Contact">
      <p>Questions about these Terms: <a className="text-white underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </Section>
  </LegalLayout>
);

export const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy">
    <Section heading="What we collect">
      <p>Account data you provide (email, username, phone if entered), the prompts and briefs you submit to the generator, payment metadata returned by Stripe (we never see your card number), and basic usage telemetry (page views, errors).</p>
    </Section>
    <Section heading="How we use it">
      <p>To operate the service, generate and deliver your sites, prevent abuse, process payments, and contact you about your account. We do not sell personal data to advertisers.</p>
    </Section>
    <Section heading="Third parties">
      <p>Stripe (payment processing), Google (sign-in and AI generation via Gemini), Cloudflare (hosting, edge, analytics), and Google Analytics (anonymized usage). Each provider has its own privacy policy.</p>
    </Section>
    <Section heading="Cookies and analytics">
      <p>We use first-party cookies to keep you signed in and Cloudflare/Google Analytics to understand traffic. You can opt out of Google Analytics through your browser settings or DNT signal.</p>
    </Section>
    <Section heading="Retention">
      <p>Account data is retained while your account is active. After cancellation, we keep order and billing records for up to 7 years to satisfy accounting and tax obligations, then delete or anonymize. You can request earlier deletion by email.</p>
    </Section>
    <Section heading="Your rights">
      <p>You may request a copy of your data, correction, or deletion by emailing us. We respond within 30 days. If you are in the EEA or California, you have additional rights under GDPR/CCPA which we honor on request.</p>
    </Section>
    <Section heading="Children">
      <p>The service is not directed to children under 13 and we do not knowingly collect their data.</p>
    </Section>
    <Section heading="Contact">
      <p>Privacy questions: <a className="text-white underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </Section>
  </LegalLayout>
);

export const RefundPolicy = () => (
  <LegalLayout title="Refund Policy">
    <Section heading="Default">
      <p>Subscription fees and one-time command bundles are non-refundable once the billing period or bundle has begun. You can cancel at any time to prevent the next renewal.</p>
    </Section>
    <Section heading="Exceptions we will honor">
      <ul className="list-disc pl-6 space-y-2">
        <li>Duplicate charges processed within 30 days, fully refunded.</li>
        <li>Charges on a subscription that was canceled before the renewal date but billed in error, refunded for the most recent renewal.</li>
        <li>Service unavailability of more than 72 consecutive hours on a paid plan, prorated refund for the affected period.</li>
      </ul>
    </Section>
    <Section heading="Chargebacks">
      <p>Please email us first. Filing a chargeback without contacting us may result in account suspension and the disputed amount being added to your account balance.</p>
    </Section>
    <Section heading="How to request a refund">
      <p>Email <a className="text-white underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address on your account with your order ID and a short description. We respond within 3 business days.</p>
    </Section>
  </LegalLayout>
);

export const DMCA = () => (
  <LegalLayout title="DMCA Notice">
    <Section heading="Copyright integrity">
      <p>VoiceToWebsite.com respects the intellectual-property rights of others. If you believe content on a site we host infringes your copyright, send a written notice including: identification of the work, the URL of the infringing material, your contact information, a statement of good-faith belief, a statement under penalty of perjury that you are authorized to act, and your physical or electronic signature.</p>
    </Section>
    <Section heading="Send notices to">
      <p><a className="text-white underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </Section>
    <Section heading="Counter-notices">
      <p>If you believe content was removed by mistake, send a counter-notice to the same address with the equivalent information required by 17 U.S.C. § 512(g).</p>
    </Section>
  </LegalLayout>
);
