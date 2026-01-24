import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  onClose: () => void;
}

export default function Checkout({ items, onClose }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setProcessing(false);
    setSuccess(true);

    // Reset after 3 seconds
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 3000);
  };

  const handlePayPal = () => {
    setProcessing(true);
    // Simulate PayPal redirect
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    }, 2000);
  };

  return (
    <div className="checkout-modal">
      <style>{`
        .checkout-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 2rem;
        }

        .checkout-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 3rem;
          position: relative;
        }

        .checkout-close {
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

        .checkout-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        .checkout-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .order-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.5rem;
          font-weight: 900;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #667eea;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .payment-method-btn {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .payment-method-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .payment-method-btn.active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.2);
        }

        .payment-icon {
          font-size: 2rem;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: #b0b0b0;
        }

        .form-input {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .submit-btn {
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .success-animation {
          text-align: center;
          padding: 3rem;
        }

        .success-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: successPop 0.5s ease;
        }

        @keyframes successPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .success-title {
          font-size: 2rem;
          font-weight: 900;
          color: #28a745;
          margin-bottom: 1rem;
        }

        .success-message {
          font-size: 1.2rem;
          color: #b0b0b0;
        }

        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .payment-methods {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <motion.div
        className="checkout-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button className="checkout-close" onClick={onClose}>
          ×
        </button>

        {success ? (
          <div className="success-animation">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Payment Successful!</h2>
            <p className="success-message">
              Thank you for your purchase. Check your email for download links.
            </p>
          </div>
        ) : (
          <>
            <h2 className="checkout-title">Checkout</h2>

            <div className="order-summary">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Order Summary</h3>
              {items.map((item) => (
                <div key={item.id} className="order-item">
                  <span>{item.name}</span>
                  <span style={{ fontWeight: '700' }}>${item.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="order-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Payment Method</h3>
            <div className="payment-methods">
              <button
                className={`payment-method-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div className="payment-icon">💳</div>
                <div>Credit Card</div>
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <div className="payment-icon">🅿️</div>
                <div>PayPal</div>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {paymentMethod === 'stripe' && (
                <motion.form
                  className="checkout-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="123"
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={processing}>
                    {processing ? (
                      <div className="spinner" />
                    ) : (
                      `Pay $${total.toFixed(2)}`
                    )}
                  </button>
                </motion.form>
              )}

              {paymentMethod === 'paypal' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button
                    className="submit-btn"
                    onClick={handlePayPal}
                    disabled={processing}
                    style={{ background: '#0070ba' }}
                  >
                    {processing ? (
                      <div className="spinner" />
                    ) : (
                      `Continue with PayPal - $${total.toFixed(2)}`
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
