// Footer Component for VoiceToWebsite
document.addEventListener("DOMContentLoaded", function () {
  const footerHTML = `
        <footer class="global-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>VoiceToWebsite</h3>
                    <p>AI-powered web development platform</p>
                    <div class="social-links">
                        <a href="#" aria-label="Twitter">𝕏</a>
                        <a href="#" aria-label="GitHub">🐙</a>
                        <a href="#" aria-label="LinkedIn">💼</a>
                        <a href="#" aria-label="YouTube">📺</a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h3>Products</h3>
                    <ul>
                        <li><a href="/appstore">App Store</a></li>
                        <li><a href="/store">Store</a></li>
                        <li><a href="/pricing">Pricing</a></li>
                        <li><a href="/demo">Demo</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Resources</h3>
                    <ul>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/support">Support</a></li>
                        <li><a href="/api-documentation">API Docs</a></li>
                        <li><a href="/status">Status</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Company</h3>
                    <ul>
                        <li><a href="/about">About</a></li>
                        <li><a href="/contact-enhanced">Contact</a></li>
                        <li><a href="/privacy">Privacy</a></li>
                        <li><a href="/terms">Terms</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2026 VoiceToWebsite. All rights reserved.</p>
                <p>Powered by AI ⚡</p>
            </div>
        </footer>
        
        <style>
            .global-footer {
                background: linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%);
                color: white;
                padding: 3rem 0 1rem;
                margin-top: 4rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .footer-content {
                max-width: 1200px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 2rem;
            }
            
            .footer-section h3 {
                color: #64ffda;
                margin-bottom: 1rem;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .footer-section ul {
                list-style: none;
                padding: 0;
            }
            
            .footer-section ul li {
                margin-bottom: 0.5rem;
            }
            
            .footer-section a {
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .footer-section a:hover {
                color: #64ffda;
            }
            
            .social-links {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .social-links a {
                font-size: 1.5rem;
                transition: transform 0.3s ease;
            }
            
            .social-links a:hover {
                transform: scale(1.2);
            }
            
            .footer-bottom {
                text-align: center;
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.6);
            }
            
            @media (max-width: 768px) {
                .footer-content {
                    grid-template-columns: 1fr;
                    text-align: center;
                }
                
                .social-links {
                    justify-content: center;
                }
            }
        </style>
    `;

  // Insert footer before closing body tag
  document.body.insertAdjacentHTML("beforeend", footerHTML);
});
