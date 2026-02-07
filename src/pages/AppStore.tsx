import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Checkout from "../components/Checkout";

interface App {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: string;
  rating: number;
  downloads: number;
  version: string;
  developer: string;
  screenshots: string[];
  features: string[];
  icon: string;
  tags: string[];
}

const CATEGORIES = ["All", "Productivity", "Voice AI", "Design Tools", "Analytics", "Marketing", "Developer Tools"];

const APPS: App[] = [
  {
    id: "voice-commander-pro",
    name: "Voice Commander Pro",
    description: "Advanced voice-to-code system with AI-powered suggestions",
    longDescription:
      "Transform your development workflow with Voice Commander Pro. This revolutionary tool allows you to write, edit, and deploy code using only your voice. Powered by advanced AI, it understands context and provides intelligent suggestions.",
    price: 299.99,
    category: "Developer Tools",
    rating: 4.9,
    downloads: 15420,
    version: "2.1.0",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Natural language code generation",
      "Multi-language support (20+ languages)",
      "Real-time syntax correction",
      "AI-powered code completion",
      "Voice-activated debugging",
      "Integration with popular IDEs",
    ],
    icon: "🎤",
    tags: ["voice", "ai", "coding", "productivity"],
  },
  {
    id: "site-builder-ai",
    name: "AI Site Builder",
    description: "Build stunning websites with voice commands in minutes",
    longDescription:
      "Create professional websites without touching your keyboard. AI Site Builder uses advanced machine learning to understand your vision and build pixel-perfect sites through natural conversation.",
    price: 199.99,
    category: "Design Tools",
    rating: 4.8,
    downloads: 28350,
    version: "3.0.2",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Voice-driven design system",
      "Responsive layouts automatically",
      "SEO optimization built-in",
      "One-click deployment",
      "Custom domain integration",
      "Analytics dashboard",
    ],
    icon: "🏗️",
    tags: ["website", "ai", "design", "voice"],
  },
  {
    id: "analytics-voice-pro",
    name: "Analytics Voice Pro",
    description: "Query your analytics data using natural language",
    longDescription:
      "Stop clicking through dashboards. Ask questions about your data in plain English and get instant, actionable insights. Supports Google Analytics, Mixpanel, Amplitude, and more.",
    price: 149.99,
    category: "Analytics",
    rating: 4.7,
    downloads: 12890,
    version: "1.5.1",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Natural language queries",
      "Multi-platform integration",
      "Custom report generation",
      "Voice-activated dashboards",
      "Automated insights",
      "Export to PDF/Excel",
    ],
    icon: "📊",
    tags: ["analytics", "data", "voice", "business"],
  },
  {
    id: "content-creator-ai",
    name: "Content Creator AI",
    description: "Generate blog posts, social media, and marketing copy with voice",
    longDescription:
      "Create compelling content at the speed of thought. Simply speak your ideas and watch as AI Content Creator transforms them into polished, SEO-optimized content ready for publication.",
    price: 179.99,
    category: "Marketing",
    rating: 4.9,
    downloads: 34210,
    version: "2.3.0",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Multi-format content generation",
      "SEO optimization",
      "Plagiarism checking",
      "Brand voice customization",
      "Social media scheduling",
      "A/B testing tools",
    ],
    icon: "✍️",
    tags: ["content", "marketing", "ai", "seo"],
  },
  {
    id: "voice-automation-suite",
    name: "Voice Automation Suite",
    description: "Automate any workflow with custom voice commands",
    longDescription:
      "Build powerful automation workflows using only your voice. Connect apps, trigger actions, and streamline your entire business process without writing a single line of code.",
    price: 249.99,
    category: "Productivity",
    rating: 4.8,
    downloads: 19560,
    version: "1.8.3",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Visual workflow builder",
      "500+ app integrations",
      "Custom voice triggers",
      "Conditional logic",
      "Scheduled automation",
      "Team collaboration",
    ],
    icon: "⚡",
    tags: ["automation", "productivity", "voice", "workflow"],
  },
  {
    id: "voice-crm",
    name: "Voice CRM Pro",
    description: "Manage customer relationships hands-free",
    longDescription:
      "The first truly voice-native CRM. Update deals, log calls, send emails, and manage your pipeline while driving, walking, or multitasking. Never miss a follow-up again.",
    price: 329.99,
    category: "Productivity",
    rating: 4.9,
    downloads: 8920,
    version: "1.2.0",
    developer: "3000 Studios",
    screenshots: [],
    features: [
      "Voice contact management",
      "Automated follow-ups",
      "Deal pipeline tracking",
      "Email integration",
      "Call recording & transcription",
      "Mobile-first design",
    ],
    icon: "👥",
    tags: ["crm", "sales", "voice", "business"],
  },
];

export default function AppStore() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const filteredApps = APPS.filter((app) => {
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addToCart = (appId: string) => {
    if (!cart.includes(appId)) {
      setCart([...cart, appId]);
    }
  };

  const removeFromCart = (appId: string) => {
    setCart(cart.filter((id) => id !== appId));
  };

  const totalPrice = cart.reduce((sum, appId) => {
    const app = APPS.find((a) => a.id === appId);
    return sum + (app?.price || 0);
  }, 0);

  return (
    <div className="app-store">
      <style>{`
        .app-store {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%);
          color: white;
          padding: 2rem;
        }

        .store-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .store-title {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }

        .store-subtitle {
          font-size: 1.5rem;
          color: #a0a0a0;
        }

        .search-bar {
          max-width: 600px;
          margin: 0 auto 2rem;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          color: white;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }

        .categories {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .category-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-weight: 600;
        }

        .category-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .category-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
        }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .app-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .app-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
          border-color: #667eea;
        }

        .app-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .app-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .app-description {
          color: #b0b0b0;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .app-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .app-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .app-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .app-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #888;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-to-cart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
        }

        .add-to-cart-btn.in-cart {
          background: #28a745;
        }

        .cart-widget {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          min-width: 200px;
        }

        .cart-count {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .cart-total {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
        }

        .checkout-btn {
          width: 100%;
          padding: 1rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .checkout-btn:hover {
          transform: scale(1.05);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 3rem;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 2rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .modal-icon {
          font-size: 5rem;
        }

        .modal-title {
          font-size: 2.5rem;
          font-weight: 900;
        }

        .modal-developer {
          color: #888;
          font-size: 1.1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 2rem 0;
        }

        .features-list li {
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .features-list li:before {
          content: '✓';
          color: #28a745;
          font-weight: 900;
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .store-title {
            font-size: 2.5rem;
          }

          .apps-grid {
            grid-template-columns: 1fr;
          }

          .cart-widget {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
          }
        }
      `}</style>

      <div className="store-header">
        <h1 className="store-title">App Store</h1>
        <p className="store-subtitle">Discover powerful voice-enabled apps to supercharge your workflow</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="apps-grid">
        {filteredApps.map((app) => (
          <motion.div
            key={app.id}
            className="app-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedApp(app)}
          >
            <div className="app-icon">{app.icon}</div>
            <h3 className="app-name">{app.name}</h3>
            <p className="app-description">{app.description}</p>
            <div className="app-meta">
              <div className="app-price">${app.price}</div>
              <div className="app-rating">
                ⭐ {app.rating} ({app.downloads.toLocaleString()})
              </div>
            </div>
            <button
              className={`add-to-cart-btn ${cart.includes(app.id) ? "in-cart" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (cart.includes(app.id)) {
                  removeFromCart(app.id);
                } else {
                  addToCart(app.id);
                }
              }}
            >
              {cart.includes(app.id) ? "✓ In Cart" : "Add to Cart"}
            </button>
          </motion.div>
        ))}
      </div>

      {cart.length > 0 && (
        <motion.div
          className="cart-widget"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="cart-count">🛒 {cart.length} items</div>
          <div className="cart-total">${totalPrice.toFixed(2)}</div>
          <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
            Checkout
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedApp && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={() => setSelectedApp(null)}>
                ×
              </button>
              <div className="modal-header">
                <div className="modal-icon">{selectedApp.icon}</div>
                <div>
                  <h2 className="modal-title">{selectedApp.name}</h2>
                  <p className="modal-developer">by {selectedApp.developer}</p>
                </div>
              </div>
              <p style={{ fontSize: "1.2rem", lineHeight: "1.8", marginBottom: "2rem" }}>
                {selectedApp.longDescription}
              </p>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Features</h3>
              <ul className="features-list">
                {selectedApp.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <div className="app-meta" style={{ marginTop: "2rem" }}>
                <div className="app-price">${selectedApp.price}</div>
                <div>Version {selectedApp.version}</div>
              </div>
              <button
                className={`add-to-cart-btn ${cart.includes(selectedApp.id) ? "in-cart" : ""}`}
                onClick={() => {
                  if (cart.includes(selectedApp.id)) {
                    removeFromCart(selectedApp.id);
                  } else {
                    addToCart(selectedApp.id);
                  }
                }}
              >
                {cart.includes(selectedApp.id) ? "✓ In Cart" : "Add to Cart"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCheckout && (
        <Checkout
          items={cart.map((id) => {
            const app = APPS.find((a) => a.id === id)!;
            return { id: app.id, name: app.name, price: app.price };
          })}
          onClose={() => {
            setShowCheckout(false);
            setCart([]);
          }}
        />
      )}
    </div>
  );
}
