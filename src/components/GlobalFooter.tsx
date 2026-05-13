import { Instagram, Twitter, Youtube } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { SITE_FOOTER_GROUPS } from "../shared/siteManifest";

const SOCIAL_LINKS = [
  {
    href: "https://x.com/voicetowebsite",
    label: "VoiceToWebsite on X",
    icon: Twitter,
  },
  {
    href: "https://instagram.com/3000studios",
    label: "3000 Studios on Instagram",
    icon: Instagram,
  },
  {
    href: "https://youtube.com",
    label: "VoiceToWebsite on YouTube",
    icon: Youtube,
  },
];

const GlobalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const trustLinks =
    SITE_FOOTER_GROUPS.find((group) => group.id === "trust")?.links.length || 0;
  const archiveLinks =
    SITE_FOOTER_GROUPS.find((group) => group.id === "archive")?.links.length ||
    0;

  return (
    <footer className="vtw-footer">
      <div className="vtw-footer__shell">
        <section className="vtw-footer__hero">
          <div className="vtw-glass-card" style={{ padding: "1.4rem" }}>
            <div className="vtw-chip">Footer archive and discovery</div>
            <h2
              style={{
                margin: "1rem 0 0.65rem",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3.4rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.05em",
              }}
            >
              Premium shell up front. Structured page recovery underneath.
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: "42rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              Every extra page now has one organized place to live.
            </p>
            <p
              style={{
                margin: "0.7rem 0 0",
                maxWidth: "42rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              Core conversion pages stay in the floating navigation, while
              lower-priority, archival, or trust-related routes remain
              discoverable here for users, crawlers, and your own content
              cleanup workflow.
            </p>
            <div className="vtw-metric-grid" style={{ marginTop: "1.4rem" }}>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Trust pages</span>
                <span className="vtw-metric__value">{trustLinks}</span>
              </div>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Archive pages</span>
                <span className="vtw-metric__value">{archiveLinks}</span>
              </div>
              <div className="vtw-metric">
                <span className="vtw-metric__label">Blog refresh</span>
                <span className="vtw-metric__value">3 hrs</span>
              </div>
            </div>
          </div>

          <div className="vtw-glass-card" style={{ padding: "1.4rem" }}>
            <div className="vtw-chip">VoiceToWebsite</div>
            <h3
              style={{
                margin: "1rem 0 0.55rem",
                fontFamily: "var(--font-display)",
                fontSize: "1.45rem",
              }}
            >
              Sleek public UX, stable page map, and live content surfaces.
            </h3>
            <p
              style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}
            >
              Use the footer as the directory for support, archive, and content
              depth while the homepage and primary routes stay focused on the
              main product narrative.
            </p>
            <div style={{ marginTop: "1.25rem" }} className="vtw-socials">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  className="vtw-social"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="vtw-footer__columns">
          {SITE_FOOTER_GROUPS.map((group) => (
            <div key={group.id} className="vtw-footer__column">
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <div className="vtw-footer__links">
                {group.links.map((link) =>
                  link.fullReload ? (
                    <a
                      key={link.href}
                      href={link.href}
                      className="vtw-footer__link"
                    >
                      <span className="vtw-footer__link-label">
                        {link.label}
                      </span>
                      <span className="vtw-footer__link-copy">
                        {link.description}
                      </span>
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="vtw-footer__link"
                    >
                      <span className="vtw-footer__link-label">
                        {link.label}
                      </span>
                      <span className="vtw-footer__link-copy">
                        {link.description}
                      </span>
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </section>

        <div className="vtw-footer__bottom">
          <p style={{ margin: 0 }}>
            © {currentYear} VoiceToWebsite. Clear navigation, organized archive
            routes, and live content updates.
          </p>
          <div className="vtw-footer__bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
