import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function VoiceCommanderPro() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="voice-commander-pro">
      <style>{`
        .voice-commander-pro {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: white;
          padding: 4rem 2rem;
        }

        .hero-section {
          text-align: center;
          max-width: 1200px;
          margin: 0 auto 4rem;
        }

        .app-icon-large {
          font-size: 8rem;
          margin-bottom: 2rem;
          filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.5));
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          color: #b0b0b0;
          margin-bottom: 2rem;
        }

        .price-tag {
          font-size: 3rem;
          font-weight: 900;
          color: #667eea;
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          padding: 1.5rem 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary {
          padding: 1.5rem 3rem;
          background: transparent;
          border: 2px solid #667eea;
          border-radius: 50px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .tabs {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .tab {
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
        }

        .content-section {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 3rem;
          backdrop-filter: blur(10px);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: #667eea;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .feature-description {
          color: #b0b0b0;
          line-height: 1.6;
        }

        .specs-list {
          list-style: none;
          padding: 0;
        }

        .specs-list li {
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .spec-label {
          font-weight: 600;
          color: #888;
        }

        .spec-value {
          font-weight: 700;
        }

        .testimonial {
          background: rgba(255, 255, 255, 0.05);
          border-left: 4px solid #667eea;
          padding: 2rem;
          margin: 2rem 0;
          border-radius: 10px;
        }

        .testimonial-text {
          font-size: 1.2rem;
          font-style: italic;
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .testimonial-author {
          font-weight: 700;
          color: #667eea;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .price-tag {
            font-size: 2rem;
          }

          .cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="hero-section">
        <motion.div
          className="app-icon-large"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          🎤
        </motion.div>
        <h1 className="hero-title">Voice Commander Pro</h1>
        <p className="hero-subtitle">
          The world's most advanced voice-to-code system. Write, edit, and deploy code using only
          your voice.
        </p>
        <div className="price-tag">$299.99</div>
        <div className="cta-buttons">
          <button className="btn-primary">Buy Now</button>
          <button className="btn-secondary">Try Free Demo</button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={`tab ${activeTab === 'specs' ? 'active' : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          Specifications
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
      </div>

      <motion.div
        className="content-section"
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
              Transform Your Development Workflow
            </h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              Voice Commander Pro is the revolutionary tool that allows developers to write code at
              the speed of thought. Using advanced AI and natural language processing, it
              understands your intent and generates clean, production-ready code.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🧠</div>
                <h3 className="feature-title">AI-Powered Intelligence</h3>
                <p className="feature-description">
                  Advanced machine learning models understand context and generate optimal code
                  solutions.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h3 className="feature-title">20+ Languages</h3>
                <p className="feature-description">
                  Support for all major programming languages including Python, JavaScript,
                  TypeScript, Go, Rust, and more.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3 className="feature-title">Real-Time Correction</h3>
                <p className="feature-description">
                  Automatic syntax checking and error correction as you speak, ensuring clean code
                  every time.
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'features' && (
          <>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Complete Feature Set</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3 className="feature-title">Natural Language Processing</h3>
                <p className="feature-description">
                  Speak naturally and watch your words transform into code. No need to memorize
                  special commands.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔧</div>
                <h3 className="feature-title">IDE Integration</h3>
                <p className="feature-description">
                  Works seamlessly with VS Code, IntelliJ, Sublime Text, and all major IDEs.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🐛</div>
                <h3 className="feature-title">Voice Debugging</h3>
                <p className="feature-description">
                  Set breakpoints, inspect variables, and step through code using voice commands.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📚</div>
                <h3 className="feature-title">Code Completion</h3>
                <p className="feature-description">
                  AI suggests completions as you speak, learning your coding style over time.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">Secure & Private</h3>
                <p className="feature-description">
                  All processing happens locally. Your code never leaves your machine.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3 className="feature-title">Custom Commands</h3>
                <p className="feature-description">
                  Create custom voice macros for repetitive tasks and workflows.
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'specs' && (
          <>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Technical Specifications</h2>
            <ul className="specs-list">
              <li>
                <span className="spec-label">Version</span>
                <span className="spec-value">2.1.0</span>
              </li>
              <li>
                <span className="spec-label">Supported Languages</span>
                <span className="spec-value">20+</span>
              </li>
              <li>
                <span className="spec-label">Platform</span>
                <span className="spec-value">Windows, macOS, Linux</span>
              </li>
              <li>
                <span className="spec-label">RAM Required</span>
                <span className="spec-value">4GB minimum, 8GB recommended</span>
              </li>
              <li>
                <span className="spec-label">Storage</span>
                <span className="spec-value">2GB</span>
              </li>
              <li>
                <span className="spec-label">License</span>
                <span className="spec-value">Lifetime (single user)</span>
              </li>
              <li>
                <span className="spec-label">Updates</span>
                <span className="spec-value">Free forever</span>
              </li>
              <li>
                <span className="spec-label">Support</span>
                <span className="spec-value">24/7 Priority Support</span>
              </li>
            </ul>
          </>
        )}

        {activeTab === 'reviews' && (
          <>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
              What Developers Are Saying
            </h2>
            <div className="testimonial">
              <p className="testimonial-text">
                "Voice Commander Pro has completely changed how I code. I can now write complex
                algorithms while pacing around my office. My productivity has increased by 300%."
              </p>
              <p className="testimonial-author">— Sarah Chen, Senior Software Engineer @ Google</p>
            </div>
            <div className="testimonial">
              <p className="testimonial-text">
                "As someone with RSI, this tool has been a lifesaver. I can continue doing what I
                love without pain. The AI is incredibly accurate."
              </p>
              <p className="testimonial-author">— Marcus Rodriguez, Full Stack Developer</p>
            </div>
            <div className="testimonial">
              <p className="testimonial-text">
                "I was skeptical at first, but after trying the demo, I was blown away. The natural
                language understanding is phenomenal. Worth every penny."
              </p>
              <p className="testimonial-author">— Emily Watson, CTO @ TechStartup Inc</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>4.9 out of 5</div>
              <div style={{ color: '#888' }}>Based on 15,420 reviews</div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
