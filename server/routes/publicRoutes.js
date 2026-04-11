import { Router } from "express";
import {
  getPayPalCheckoutSuccess,
  getPublicSiteSnapshot,
  getStripeCheckoutSuccess,
  postLeadCapture,
  postPayPalCheckout,
  postSiteEvent,
  postStripeCheckout,
} from "../controllers/publicController.js";
import { validate, validateQuery } from "../middleware/validate.js";
import {
  SiteEventSchema,
  LeadCaptureSchema,
  CheckoutSchema,
  StripeSuccessSchema,
  PayPalSuccessSchema,
} from "../validation/schemas.js";

const router = Router();

router.get("/site", getPublicSiteSnapshot);
router.post("/events", validate(SiteEventSchema), postSiteEvent);
router.post("/leads", validate(LeadCaptureSchema), postLeadCapture);
router.post("/checkout/stripe", validate(CheckoutSchema), postStripeCheckout);
router.post("/checkout/paypal", validate(CheckoutSchema), postPayPalCheckout);
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
