import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";

const GlobalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: "About", href: "/about" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Support", href: "/support" },
    { name: "Careers", href: "/careers" },
    { name: "Press", href: "/press" },
  ];

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/voicetowebsite", icon: "𝕏" },
    { name: "GitHub", href: "https://github.com/3000Studios", icon: "⚡" },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/voicetowebsite",
      icon: "💼",
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@voicetowebsite",
      icon: "📺",
    },
    {
      name: "Instagram",
      href: "https://instagram.com/voicetowebsite",
      icon: "📷",
    },
  ];

  const appCategories = [
    { name: "Productivity", count: 12 },
    { name: "Development", count: 8 },
    { name: "Design", count: 6 },
    { name: "Marketing", count: 5 },
    { name: "Analytics", count: 4 },
    { name: "Utilities", count: 15 },
  ];

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border-t border-slate-800">
      {/* AdSense Footer Banner */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <div
            className="bg-slate-800 rounded-lg p-2 text-center text-xs text-slate-400"
            style={{ width: "728px", height: "90px" }}
          >
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-5800977493749262"
              data-ad-slot="footer-banner"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
              VoiceToWebsite
            </h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Transform your voice into powerful websites with AI. Build,
              deploy, and manage web applications using natural language
              commands.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.name}
                >
                  <span className="text-lg">{social.icon}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.slice(0, 5).map((link) => (
                <li key={link.name}>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link
                      to={link.href}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* App Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-4">App Categories</h4>
            <ul className="space-y-2">
              {appCategories.map((category) => (
                <li key={category.name}>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link
                      to={`/apps/category/${category.name.toLowerCase()}`}
                      className="text-slate-300 hover:text-white transition-colors flex justify-between"
                    >
                      <span>{category.name}</span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal & Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold mb-4">Legal & Support</h4>
            <ul className="space-y-2">
              {footerLinks.slice(5).map((link) => (
                <li key={link.name}>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link
                      to={link.href}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 p-6 bg-slate-800 rounded-lg"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="text-xl font-semibold mb-2">Stay Updated</h4>
            <p className="text-slate-300 mb-4">
              Get the latest updates on new apps, features, and AI technology
              trends.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                required
              />
              <motion.button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 pt-8 border-t border-slate-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © {currentYear} VoiceToWebsite. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-slate-400 text-sm">Powered by</span>
              <span className="text-blue-400 font-semibold">3000 Studios</span>
              <span className="text-slate-400 text-sm">|</span>
              <span className="text-green-400 text-sm">
                Made with ❤️ using AI
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional AdSense Slot */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <div
            className="bg-slate-800 rounded-lg p-2 text-center text-xs text-slate-400"
            style={{ width: "300px", height: "250px" }}
          >
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-5800977493749262"
              data-ad-slot="footer-rectangle"
              data-ad-format="rectangle"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
