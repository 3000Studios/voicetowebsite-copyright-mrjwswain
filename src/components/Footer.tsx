import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

const footerLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Examples', href: '/examples' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
];

export const Footer = () => {
  return (
    <footer className="relative z-10 mt-20 overflow-hidden border-t border-white/10 bg-slate-950/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.12),transparent_30%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(90deg,rgba(99,102,241,0.12),rgba(34,211,238,0.06),rgba(217,70,239,0.1))] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-10">
        <div className="space-y-6">
          <Logo />
          <div className="max-w-xl space-y-3 text-sm text-slate-300/80">
            <p>
              VoiceToWebsite turns a short business brief into a hosted starter site with clear sections, strong calls to action,
              and a live delivery link.
            </p>
            <p>
              All sales are final. You are responsible for your business content, claims, and compliance once your site is live.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300/70">
            <span className="footer-badge"><Sparkles className="h-3.5 w-3.5" /> Premium UI</span>
            <span className="footer-badge"><ShieldCheck className="h-3.5 w-3.5" /> Stripe checkout</span>
            <span className="footer-badge"><FileText className="h-3.5 w-3.5" /> Legal-ready links</span>
          </div>
        </div>

        <div>
          <h3 className="footer-heading">Explore</h3>
          <ul className="space-y-3 text-sm text-slate-300/78">
            {footerLinks.map((item) => (
              <li key={item.label}>
                {item.href.startsWith('/#') ? (
                  <a href={item.href} className="footer-link">{item.label}</a>
                ) : (
                  <Link to={item.href} className="footer-link">{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <h3 className="footer-heading">Need help?</h3>
          <a href="mailto:support@voicetowebsite.com" className="footer-link flex items-center gap-2">
            <Mail className="h-4 w-4" /> support@voicetowebsite.com
          </a>
          <Link to="/legal" className="footer-link block">Terms, privacy, refunds</Link>
          <Link to="/pricing" className="nav-primary-button inline-flex">
            View plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/8 px-6 py-5 text-center text-xs text-slate-400 lg:px-10">
        © 2026 3000 Studios LLC • VoiceToWebsite.com • Hosted delivery and setup flow on Cloudflare.
      </div>
    </footer>
  );
};
