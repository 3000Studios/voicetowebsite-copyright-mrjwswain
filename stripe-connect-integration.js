/**
 * Stripe Connect Integration for VoiceToWebsite Platform
 *
 * This file handles the complete Stripe Connect integration including:
 * - Connected account creation and onboarding
 * - Product management for connected accounts
 * - Customer storefronts
 * - Subscription management
 * - Webhook processing
 *
 * Uses Stripe API version 2026-01-28.clover (automatically handled by SDK)
 */

const Stripe = require("stripe");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

/**
 * Initialize Stripe Client
 * IMPORTANT: Replace with your actual Stripe secret key
 * Get this from: https://dashboard.stripe.com/apikeys
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required. Set it in your environment variables.");
}

// Create Stripe client - this will be used for all Stripe requests
const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover", // Latest API version
});

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

// In-memory database for demo (replace with actual database in production)
const userAccounts = new Map(); // Maps userId -> stripeAccountId
const userSubscriptions = new Map(); // Maps accountId -> subscription info

/**
 * Middleware to verify user is authenticated
 * In production, replace with your actual authentication system
 */
const requireAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }
  req.userId = userId;
  next();
};

/**
 * CREATE CONNECTED ACCOUNT
 *
 * This endpoint creates a new Stripe Connect account for a user
 * Uses V2 API with the specified configuration
 */
app.post("/api/stripe/create-account", requireAuth, async (req, res) => {
  try {
    const { displayName, contactEmail } = req.body;

    // Validate required fields
    if (!displayName || !contactEmail) {
      return res.status(400).json({
        error: "displayName and contactEmail are required",
      });
    }

    // Create connected account using V2 API
    const account = await stripeClient.v2.core.accounts.create({
      display_name: displayName,
      contact_email: contactEmail,
      identity: {
        country: "us",
      },
      dashboard: "full",
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        customer: {},
        merchant: {
          capabilities: {
            card_payments: {
              requested: true,
            },
          },
        },
      },
    });

    // Store mapping in our database (replace with actual DB in production)
    userAccounts.set(req.userId, account.id);

    console.log(`Created connected account ${account.id} for user ${req.userId}`);

    res.json({
      accountId: account.id,
      status: "created",
      onboardingRequired: true,
    });
  } catch (error) {
    console.error("Error creating connected account:", error);
    res.status(500).json({
      error: "Failed to create connected account",
      details: error.message,
    });
  }
});

/**
 * GET ACCOUNT STATUS
 *
 * Retrieves the current status of a connected account
 * Used to check onboarding progress and capability status
 */
app.get("/api/stripe/account-status", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    // Retrieve account with configuration and requirements
    const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.merchant", "requirements"],
    });

    // Check if ready to process payments
    const readyToProcessPayments = account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";

    // Check onboarding completion status
    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

    res.json({
      accountId: account.id,
      displayName: account.display_name,
      readyToProcessPayments,
      onboardingComplete,
      requirementsStatus,
      capabilities: account.configuration?.merchant?.capabilities,
      currentRequirements: account.requirements?.currently_due || [],
    });
  } catch (error) {
    console.error("Error retrieving account status:", error);
    res.status(500).json({
      error: "Failed to retrieve account status",
      details: error.message,
    });
  }
});

/**
 * CREATE ONBOARDING LINK
 *
 * Generates an account link for the user to complete their onboarding
 * The user will be redirected to Stripe's hosted onboarding flow
 */
app.post("/api/stripe/create-onboarding-link", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    // Create account link for onboarding
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "customer"],
          refresh_url: `${process.env.BASE_URL || "http://localhost:3000"}/api/stripe/onboarding-refresh`,
          return_url: `${process.env.BASE_URL || "http://localhost:3000"}/dashboard?onboarding_complete=true&accountId=${accountId}`,
        },
      },
    });

    res.json({
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    });
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    res.status(500).json({
      error: "Failed to create onboarding link",
      details: error.message,
    });
  }
});

/**
 * CREATE PRODUCT
 *
 * Creates a new product on the connected account
 * Uses Stripe-Account header to make the request on behalf of the connected account
 */
app.post("/api/stripe/create-product", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    const { name, description, priceInCents, currency = "usd" } = req.body;

    // Validate required fields
    if (!name || !priceInCents) {
      return res.status(400).json({
        error: "name and priceInCents are required",
      });
    }

    // Create product on connected account
    const product = await stripeClient.products.create(
      {
        name: name,
        description: description || "",
        default_price_data: {
          unit_amount: priceInCents,
          currency: currency,
        },
      },
      {
        stripeAccount: accountId, // This sets the Stripe-Account header
      }
    );

    console.log(`Created product ${product.id} on account ${accountId}`);

    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        default_price: product.default_price,
        created: product.created,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      error: "Failed to create product",
      details: error.message,
    });
  }
});

/**
 * LIST PRODUCTS
 *
 * Retrieves all products for a connected account
 * Uses Stripe-Account header to fetch from the connected account
 */
app.get("/api/stripe/products", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    // List products from connected account
    const products = await stripeClient.products.list(
      {
        limit: 20,
        active: true,
        expand: ["data.default_price"],
      },
      {
        stripeAccount: accountId, // This sets the Stripe-Account header
      }
    );

    res.json({
      products: products.data.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        default_price: product.default_price,
        images: product.images,
        created: product.created,
        updated: product.updated,
      })),
    });
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({
      error: "Failed to list products",
      details: error.message,
    });
  }
});

/**
 * CREATE CHECKOUT SESSION
 *
 * Creates a Stripe Checkout session for a customer to purchase a product
 * Uses Direct Charge with application fee to monetize the transaction
 */
app.post("/api/stripe/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    const { priceId, quantity = 1, applicationFeeAmount = 0 } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "priceId is required",
      });
    }

    // Create checkout session with application fee
    const session = await stripeClient.checkout.sessions.create(
      {
        line_items: [
          {
            price: priceId,
            quantity: quantity,
          },
        ],
        payment_intent_data: {
          // Application fee for monetization (in cents)
          application_fee_amount: applicationFeeAmount,
        },
        mode: "payment",
        success_url: `${process.env.BASE_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL || "http://localhost:3000"}/cancel`,
      },
      {
        stripeAccount: accountId, // This sets the Stripe-Account header
      }
    );

    console.log(`Created checkout session ${session.id} for account ${accountId}`);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: error.message,
    });
  }
});

/**
 * CREATE SUBSCRIPTION CHECKOUT
 *
 * Creates a subscription checkout for the connected account
 * Uses customer_account to identify both customer and connected account
 */
app.post("/api/stripe/create-subscription-checkout", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "priceId is required",
      });
    }

    // Create subscription checkout session
    const session = await stripeClient.checkout.sessions.create({
      customer_account: accountId, // V2 accounts use same ID for customer and account
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL || "http://localhost:3000"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || "http://localhost:3000"}/subscription-cancel`,
    });

    console.log(`Created subscription checkout ${session.id} for account ${accountId}`);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating subscription checkout:", error);
    res.status(500).json({
      error: "Failed to create subscription checkout",
      details: error.message,
    });
  }
});

/**
 * CREATE BILLING PORTAL SESSION
 *
 * Creates a billing portal session for managing subscriptions
 */
app.post("/api/stripe/create-billing-portal", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    // Create billing portal session
    const session = await stripeClient.billingPortal.sessions.create({
      customer_account: accountId, // V2 accounts use same ID
      return_url: `${process.env.BASE_URL || "http://localhost:3000"}/dashboard`,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    res.status(500).json({
      error: "Failed to create billing portal session",
      details: error.message,
    });
  }
});

/**
 * WEBHOOK ENDPOINT
 *
 * Handles Stripe webhooks for:
 * - Account requirement changes (thin events)
 * - Subscription updates
 * - Payment events
 */
app.post("/api/stripe/webhooks", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set, webhook verification disabled");
  }

  try {
    let event;

    // Verify webhook signature if secret is provided
    if (webhookSecret) {
      event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle V2 account requirement changes (thin events)
    if (event.type.startsWith("v2.core.account")) {
      await handleV2AccountEvent(event);
    }
    // Handle subscription events
    else if (event.type.startsWith("customer.subscription")) {
      await handleSubscriptionEvent(event);
    }
    // Handle payment method events
    else if (event.type.startsWith("payment_method")) {
      await handlePaymentMethodEvent(event);
    }
    // Handle billing portal events
    else if (event.type.startsWith("billing_portal")) {
      await handleBillingPortalEvent(event);
    }
    // Handle customer events
    else if (event.type.startsWith("customer")) {
      await handleCustomerEvent(event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

/**
 * Handle V2 Account Events (Thin Events)
 *
 * For V2 accounts, we receive thin events that need to be fetched
 * to get the full event data
 */
async function handleV2AccountEvent(event) {
  try {
    // For thin events, we need to fetch the full event data
    const fullEvent = await stripeClient.v2.core.events.retrieve(event.id);

    console.log(`Processing V2 account event: ${fullEvent.type}`);

    switch (fullEvent.type) {
      case "v2.core.account.requirements.updated":
        // Account requirements have changed
        const accountId = fullEvent.account;
        console.log(`Requirements updated for account: ${accountId}`);

        // TODO: Update database with new requirements
        // In production, you would:
        // 1. Fetch the account details
        // 2. Update your database with new requirements
        // 3. Notify the user if action is needed
        break;

      case "v2.core.account.configuration.merchant.capability_status_updated":
        // Merchant capability status changed
        console.log(`Merchant capability status updated: ${fullEvent.data.object.id}`);

        // TODO: Update capability status in database
        break;

      case "v2.core.account.configuration.customer.capability_status_updated":
        // Customer capability status changed
        console.log(`Customer capability status updated: ${fullEvent.data.object.id}`);

        // TODO: Update capability status in database
        break;

      default:
        console.log(`Unhandled V2 account event: ${fullEvent.type}`);
    }
  } catch (error) {
    console.error("Error handling V2 account event:", error);
  }
}

/**
 * Handle Subscription Events
 */
async function handleSubscriptionEvent(event) {
  try {
    const subscription = event.data.object;
    const accountId = subscription.customer_account; // V2 accounts use customer_account

    console.log(`Processing subscription event: ${event.type} for account: ${accountId}`);

    switch (event.type) {
      case "customer.subscription.updated":
        // Handle subscription updates (upgrades, downgrades, pauses)
        console.log(`Subscription updated: ${subscription.id}`);

        // TODO: Update subscription status in database
        // Check for quantity changes, plan changes, pause/resume
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        console.log(`Subscription deleted: ${subscription.id}`);

        // TODO: Remove user access, update database
        // Revoke access to products/services
        break;

      case "customer.subscription.created":
        // Handle new subscription
        console.log(`Subscription created: ${subscription.id}`);

        // TODO: Grant access to products, update database
        break;

      default:
        console.log(`Unhandled subscription event: ${event.type}`);
    }

    // Store subscription info in our database (replace with actual DB)
    userSubscriptions.set(accountId, {
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Error handling subscription event:", error);
  }
}

/**
 * Handle Payment Method Events
 */
async function handlePaymentMethodEvent(event) {
  try {
    console.log(`Processing payment method event: ${event.type}`);

    // TODO: Update payment methods in database
    // Handle customer adding/removing payment methods
  } catch (error) {
    console.error("Error handling payment method event:", error);
  }
}

/**
 * Handle Billing Portal Events
 */
async function handleBillingPortalEvent(event) {
  try {
    console.log(`Processing billing portal event: ${event.type}`);

    // TODO: Track billing portal usage
    // Monitor configuration changes
  } catch (error) {
    console.error("Error handling billing portal event:", error);
  }
}

/**
 * Handle Customer Events
 */
async function handleCustomerEvent(event) {
  try {
    console.log(`Processing customer event: ${event.type}`);

    // TODO: Update customer information in database
    // Handle billing information changes
  } catch (error) {
    console.error("Error handling customer event:", error);
  }
}

/**
 * GET SUBSCRIPTION STATUS
 *
 * Retrieves the current subscription status for a connected account
 */
app.get("/api/stripe/subscription-status", requireAuth, async (req, res) => {
  try {
    const accountId = userAccounts.get(req.userId);

    if (!accountId) {
      return res.status(404).json({
        error: "No connected account found for this user",
      });
    }

    // Get subscription info from our database
    const subscriptionInfo = userSubscriptions.get(accountId);

    if (!subscriptionInfo) {
      return res.json({
        hasSubscription: false,
      });
    }

    // Fetch current subscription status from Stripe
    const subscription = await stripeClient.subscriptions.retrieve(
      subscriptionInfo.subscriptionId,
      {
        expand: ["default_payment_method"],
      },
      {
        stripeAccount: accountId,
      }
    );

    res.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        default_payment_method: subscription.default_payment_method,
      },
    });
  } catch (error) {
    console.error("Error retrieving subscription status:", error);
    res.status(500).json({
      error: "Failed to retrieve subscription status",
      details: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stripe Connect integration server running on port ${PORT}`);
  console.log("Make sure to set these environment variables:");
  console.log("- STRIPE_SECRET_KEY (your Stripe secret key)");
  console.log("- STRIPE_WEBHOOK_SECRET (your webhook secret)");
  console.log("- BASE_URL (your application base URL)");
});

module.exports = app;
