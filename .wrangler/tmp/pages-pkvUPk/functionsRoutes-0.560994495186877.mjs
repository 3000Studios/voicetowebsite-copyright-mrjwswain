import { onRequestGet as __api_blog_posts__slug__ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\blog\\posts\\[slug].ts"
import { onRequestGet as __api_admin_orders_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\admin\\orders.ts"
import { onRequestGet as __api_blog_posts_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\blog\\posts.ts"
import { onRequestPost as __api_blog_publish_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\blog\\publish.ts"
import { onRequestGet as __api_blog_rss_xml_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\blog\\rss.xml.ts"
import { onRequestGet as __api_blog_sitemap_xml_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\blog\\sitemap.xml.ts"
import { onRequestGet as __api_site__id__ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\site\\[id].ts"
import { onRequestGet as __api_checkout_session_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\checkout-session.ts"
import { onRequestPost as __api_create_checkout_session_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\create-checkout-session.ts"
import { onRequestPost as __api_create_paypal_order_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\create-paypal-order.ts"
import { onRequestPost as __api_generate_js_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\generate.js"
import { onRequestPost as __api_generate_site_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\generate-site.ts"
import { onRequestGet as __api_health_js_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\health.js"
import { onRequestGet as __api_media_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\media.ts"
import { onRequestGet as __api_order_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\order.ts"
import { onRequestPost as __api_order_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\order.ts"
import { onRequestPost as __api_paypal_webhook_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\paypal-webhook.ts"
import { onRequestPost as __api_preview_copy_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\preview-copy.ts"
import { onRequestGet as __api_preview_style_ts_onRequestGet } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\preview-style.ts"
import { onRequestPost as __api_stripe_verify_session_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\stripe-verify-session.ts"
import { onRequestPost as __api_stripe_webhook_ts_onRequestPost } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\stripe-webhook.ts"
import { onRequest as __api__middleware_ts_onRequest } from "C:\\Workspaces\\voicetowebsite-copyright-mrjwswain\\functions\\api\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/blog/posts/:slug",
      mountPath: "/api/blog/posts",
      method: "GET",
      middlewares: [],
      modules: [__api_blog_posts__slug__ts_onRequestGet],
    },
  {
      routePath: "/api/admin/orders",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_orders_ts_onRequestGet],
    },
  {
      routePath: "/api/blog/posts",
      mountPath: "/api/blog",
      method: "GET",
      middlewares: [],
      modules: [__api_blog_posts_ts_onRequestGet],
    },
  {
      routePath: "/api/blog/publish",
      mountPath: "/api/blog",
      method: "POST",
      middlewares: [],
      modules: [__api_blog_publish_ts_onRequestPost],
    },
  {
      routePath: "/api/blog/rss.xml",
      mountPath: "/api/blog",
      method: "GET",
      middlewares: [],
      modules: [__api_blog_rss_xml_ts_onRequestGet],
    },
  {
      routePath: "/api/blog/sitemap.xml",
      mountPath: "/api/blog",
      method: "GET",
      middlewares: [],
      modules: [__api_blog_sitemap_xml_ts_onRequestGet],
    },
  {
      routePath: "/api/site/:id",
      mountPath: "/api/site",
      method: "GET",
      middlewares: [],
      modules: [__api_site__id__ts_onRequestGet],
    },
  {
      routePath: "/api/checkout-session",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_checkout_session_ts_onRequestGet],
    },
  {
      routePath: "/api/create-checkout-session",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_checkout_session_ts_onRequestPost],
    },
  {
      routePath: "/api/create-paypal-order",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_paypal_order_ts_onRequestPost],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_js_onRequestPost],
    },
  {
      routePath: "/api/generate-site",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_site_ts_onRequestPost],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_js_onRequestGet],
    },
  {
      routePath: "/api/media",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_media_ts_onRequestGet],
    },
  {
      routePath: "/api/order",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_order_ts_onRequestGet],
    },
  {
      routePath: "/api/order",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_order_ts_onRequestPost],
    },
  {
      routePath: "/api/paypal-webhook",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_paypal_webhook_ts_onRequestPost],
    },
  {
      routePath: "/api/preview-copy",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_preview_copy_ts_onRequestPost],
    },
  {
      routePath: "/api/preview-style",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_preview_style_ts_onRequestGet],
    },
  {
      routePath: "/api/stripe-verify-session",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_stripe_verify_session_ts_onRequestPost],
    },
  {
      routePath: "/api/stripe-webhook",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_stripe_webhook_ts_onRequestPost],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_ts_onRequest],
      modules: [],
    },
  ]