import { Router } from "express";
import {
  getSourceBundleDownload,
  getPayPalCheckoutSuccess,
  getPublicSiteSnapshot,
  getStripeCheckoutSuccess,
  postLeadCapture,
  postPayPalCheckout,
  postSiteEvent,
  postStripeCheckout,
  postWebsitePreview,
} from "../controllers/publicController.js";
import { validate, validateQuery } from "../middleware/validate.js";
import {
  SiteEventSchema,
  LeadCaptureSchema,
  CheckoutSchema,
  PreviewStudioSchema,
  StripeSuccessSchema,
  PayPalSuccessSchema,
} from "../validation/schemas.js";

const router = Router();

router.get("/site", getPublicSiteSnapshot);
router.post("/events", validate(SiteEventSchema), postSiteEvent);
router.post("/leads", validate(LeadCaptureSchema), postLeadCapture);
router.post("/previews", validate(PreviewStudioSchema), postWebsitePreview);
router.post("/checkout/stripe", validate(CheckoutSchema), postStripeCheckout);
router.post("/checkout/paypal", validate(CheckoutSchema), postPayPalCheckout);
router.get("/source/:token", getSourceBundleDownload);
router.get(
  "/checkout/stripe/success",
  validateQuery(StripeSuccessSchema),
  getStripeCheckoutSuccess,
);
router.get(
  "/checkout/paypal/capture",
  validateQuery(PayPalSuccessSchema),
  getPayPalCheckoutSuccess,
);

export default router;
