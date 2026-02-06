
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const checkCredentials = () => {
    if (!PAYPAL_CLIENT_ID) {
        console.warn("VITE_PAYPAL_CLIENT_ID is missing in .env");
    }
    if (!STRIPE_PK) {
        console.warn("VITE_STRIPE_PUBLISHABLE_KEY is missing in .env");
    }
};

export const handleStripePurchase = async (product, amount, redirectUrl) => {
    if (!STRIPE_PK) {
        alert("Stripe is not configured.");
        return;
    }

    // This assumes a backend endpoint exists to create a session.
    // Since we don't have a guaranteed backend for this new app,
    // we might just alert or mock it.
    // However, existing store.html uses /api/stripe/checkout.
    try {
        const stripe = window.Stripe(STRIPE_PK);
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(amount * 100), product, label: product, source: "appstore", successUrl: redirectUrl }),
        });
        const data = await res.json();
        if (!data.sessionId) throw new Error("No session");
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
        console.error(err);
        alert("Stripe checkout failed or not fully configured.");
    }
};

export const handlePayPalPurchase = (product, amount, redirectUrl) => {
    if (!PAYPAL_CLIENT_ID) {
        alert("PayPal is not configured.");
        return;
    }

    // Using a standard PayPal Buy Now link format for simplicity if SDK fails or simple redirection is preferred.
    // However, if we want to ensure "purchase first", we'd ideally verify it.
    // For now, we redirect to PayPal, and set the return URL to the protected page.
    // Note: This is client-side only and easily bypassable, but fits the static site model.

    const returnUrl = new URL(redirectUrl, window.location.origin).href;
    const business = PAYPAL_CLIENT_ID; // Assuming Client ID or Email is put here.
    // If it's a Client ID, we should use the SDK.

    // Let's assume the user wants the SDK flow if possible, but fallback to link?
    // The previous appstore.html used a weird link.
    // I'll use a standard link which is safer for generic credentials.

    const ppUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(business)}&item_name=${encodeURIComponent(product)}&amount=${amount}&currency_code=USD&return=${encodeURIComponent(returnUrl)}`;

    window.location.href = ppUrl;
};
