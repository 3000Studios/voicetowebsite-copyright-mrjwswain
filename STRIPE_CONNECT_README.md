# VoiceToWebsite Stripe Connect Integration

A comprehensive Stripe Connect integration for the VoiceToWebsite platform that enables multi-vendor
marketplaces, connected account management, and seamless payment processing.

## 🚀 Features

### ✅ Connected Account Management

- **V2 API Integration**: Uses the latest Stripe Connect V2 API
- **Automated Onboarding**: Stripe-hosted onboarding flows
- **Real-time Status Tracking**: Monitor account capabilities and requirements
- **Webhook Integration**: Handle requirement changes and capability updates

### 🛍️ Product Management

- **Multi-vendor Support**: Each seller can manage their own products
- **Dynamic Pricing**: Support for one-time and subscription products
- **Product Catalog**: Centralized product discovery across all sellers
- **Secure Checkout**: Stripe Checkout with application fees

### 💳 Payment Processing

- **Direct Charges**: Process payments directly to connected accounts
- **Application Fees**: Platform monetization through configurable fees
- **Subscription Management**: Handle recurring billing and cancellations
- **Billing Portal**: Customer self-service subscription management

### 🔧 Technical Features

- **Node.js Backend**: Express.js server with comprehensive API
- **React Frontend**: Modern UI components with your application's styling
- **Error Handling**: Robust error handling and user feedback
- **Health Monitoring**: API health checks and status monitoring

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Stripe account with Connect platform enabled
- Environment variables configured (see below)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/3000-studios/voicetowebsite-stripe-connect.git
   cd voicetowebsite-stripe-connect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook secret

# Application Configuration
BASE_URL=http://localhost:3000   # Your application base URL
PORT=3000                        # Server port

# Optional: For production
STRIPE_PUBLISHABLE_KEY=pk_live_... # Your Stripe publishable key
```

### Getting Your Stripe Keys

1. **Stripe Secret Key**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Create a new secret key
   - Copy the key starting with `sk_test_` (test) or `sk_live_` (production)

2. **Webhook Secret**:
   - Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Add a new endpoint pointing to `https://yourdomain.com/api/stripe/webhooks`
   - Select the events listed in the Webhook Setup section below
   - Copy the signing secret

## 🌐 API Endpoints

### Account Management

- `POST /api/stripe/create-account` - Create a new connected account
- `GET /api/stripe/account-status` - Get account status and capabilities
- `POST /api/stripe/create-onboarding-link` - Generate onboarding URL

### Product Management

- `POST /api/stripe/create-product` - Create a new product
- `GET /api/stripe/products` - List all products for an account

### Payment Processing

- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/create-subscription-checkout` - Create subscription checkout
- `POST /api/stripe/create-billing-portal` - Create billing portal session

### Subscriptions

- `GET /api/stripe/subscription-status` - Get subscription status

### System

- `GET /api/stripe/health` - Health check endpoint
- `POST /api/stripe/webhooks` - Webhook handler

## 🎯 Webhook Setup

### Required Events

Configure your Stripe webhook to listen for these events:

**V2 Account Events** (Thin Events):

- `v2.core.account.requirements.updated`
- `v2.core.account.configuration.merchant.capability_status_updated`
- `v2.core.account.configuration.customer.capability_status_updated`

**Subscription Events**:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Payment Events**:

- `payment_method.attached`
- `payment_method.detached`

**Customer Events**:

- `customer.updated`
- `customer.tax_id.created`
- `customer.tax_id.deleted`
- `customer.tax_id.updated`

**Billing Portal Events**:

- `billing_portal.configuration.created`
- `billing_portal.configuration.updated`
- `billing_portal.session.created`

### Testing Webhooks Locally

Use the Stripe CLI to test webhooks locally:

```bash
stripe listen --thin-events 'v2.core.account.requirements.updated,v2.core.account.configuration.merchant.capability_status_updated,v2.core.account.configuration.customer.capability_status_updated' --forward-thin-to http://localhost:3000/api/stripe/webhooks
```

## 🏗️ Architecture

### Backend Structure

```
stripe-connect-integration.js
├── Stripe Client Initialization
├── Express App Setup
├── Authentication Middleware
├── Account Management APIs
├── Product Management APIs
├── Payment Processing APIs
├── Subscription Management APIs
├── Webhook Handlers
└── Error Handling
```

### Frontend Components

```
stripe-connect-dashboard.html    # Seller dashboard
stripe-connect-storefront.html   # Customer marketplace
├── Account Status Display
├── Onboarding Flow
├── Product Management
├── Subscription Management
└── Real-time Updates
```

## 💡 Usage Examples

### Creating a Connected Account

```javascript
const response = await fetch("/api/stripe/create-account", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": "user-123",
  },
  body: JSON.stringify({
    displayName: "My Business",
    contactEmail: "business@example.com",
  }),
});

const { accountId } = await response.json();
```

### Creating a Product

```javascript
const response = await fetch("/api/stripe/create-product", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": "user-123",
  },
  body: JSON.stringify({
    name: "Premium Service",
    description: "Our premium service offering",
    priceInCents: 4999, // $49.99
  }),
});
```

### Creating a Checkout Session

```javascript
const response = await fetch("/api/stripe/create-checkout-session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": "user-123",
  },
  body: JSON.stringify({
    priceId: "price_1234567890",
    quantity: 1,
    applicationFeeAmount: 100, // $1.00 platform fee
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

## 🔧 Configuration

### Stripe Connect Platform Settings

1. **Enable Connect**: In your Stripe Dashboard, enable Connect platform
2. **Configure Capabilities**: Enable card payments for your platform
3. **Set Up Redirect URLs**: Configure your return and refresh URLs
4. **Configure Branding**: Customize the onboarding experience

### Platform Fees

Configure application fees in the checkout session creation:

```javascript
const session = await stripeClient.checkout.sessions.create(
  {
    // ... other parameters
    payment_intent_data: {
      application_fee_amount: 100, // $1.00 in cents
    },
  },
  {
    stripeAccount: connectedAccountId,
  }
);
```

## 🚀 Deployment

### Production Deployment

1. **Set Production Variables**:

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   BASE_URL=https://yourdomain.com
   ```

2. **Deploy to Cloudflare Workers**:

   ```bash
   npm run build
   npm run deploy
   ```

3. **Configure Production Webhooks**:
   - Update webhook endpoint to production URL
   - Test webhook delivery
   - Monitor webhook logs

### Environment-Specific Configuration

```javascript
const isProduction = process.env.NODE_ENV === "production";
const stripeKey = isProduction ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_KEY;
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Data

The integration includes mock data for development:

- Demo seller accounts
- Sample products
- Test checkout flows

### Stripe Test Mode

Use Stripe test mode for development:

- Test cards: https://stripe.com/docs/testing
- Test bank accounts: https://stripe.com/docs/testing#bank-accounts
- Test webhooks: Use Stripe CLI

## 🔍 Monitoring

### Health Checks

Monitor the integration health:

```bash
curl https://yourdomain.com/api/stripe/health
```

Response:

```json
{
  "status": "healthy",
  "stripeConnected": true,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Error Tracking

The integration includes comprehensive error logging:

- API request failures
- Stripe API errors
- Webhook processing errors
- Authentication failures

## 🛡️ Security

### Authentication

- User authentication via `X-User-ID` header
- Replace with your actual auth system in production
- Implement proper session management

### Data Protection

- No sensitive data stored in frontend
- Secure webhook signature verification
- Environment variable protection
- HTTPS enforcement in production

### Stripe Security

- Use Stripe's recommended security practices
- Implement proper webhook verification
- Regular security updates
- PCI compliance through Stripe

## 📚 Documentation

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect V2 API](https://stripe.com/docs/api/connect/accounts)
- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## 🤝 Support

For support with this integration:

1. **Check the logs**: Review server and Stripe logs
2. **Test in development**: Use Stripe test mode
3. **Consult Stripe docs**: Refer to official Stripe documentation
4. **Create an issue**: Report bugs on GitHub

## 📄 License

MIT License - see LICENSE file for details.

## 🔄 Version History

- **v1.0.0** - Initial release with full Stripe Connect V2 integration
- **v1.1.0** - Added subscription management and billing portal
- **v1.2.0** - Enhanced webhook handling and error reporting

---

Built with ❤️ by 3000 Studios for VoiceToWebsite Platform
