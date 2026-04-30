import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Event types
export type AnalyticsEvent =
  | 'page_view'
  | 'user_signup'
  | 'user_login'
  | 'site_generate_start'
  | 'site_generate_complete'
  | 'site_deploy'
  | 'subscription_start'
  | 'subscription_complete'
  | 'subscription_cancel'
  | 'cta_click'
  | 'voice_record_start'
  | 'voice_record_complete'
  | 'error';

interface EventProperties {
  [key: string]: any;
}

// Analytics hook
export function useAnalytics() {
  const location = useLocation();

  // Initialize PostHog
  useEffect(() => {
    if (!POSTHOG_API_KEY) return;

    // Load PostHog script
    const script = document.createElement('script');
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeature getActiveMatchingSurveys getSurveys getSessionReplayUrl".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${POSTHOG_API_KEY}', {api_host: '${POSTHOG_HOST}'})
    `;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Track page views
  useEffect(() => {
    if (window.posthog) {
      window.posthog.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: location.pathname,
      });
    }
  }, [location]);

  // Track event function
  const trackEvent = useCallback((event: AnalyticsEvent, properties?: EventProperties) => {
    // PostHog
    if (window.posthog) {
      window.posthog.capture(event, properties);
    }

    // Also send to our API for backup
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties: {
          ...properties,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {
      // Silent fail - don't break user experience
    });

    // Console log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, properties);
    }
  }, []);

  // Identify user
  const identifyUser = useCallback((userId: string, traits?: Record<string, any>) => {
    if (window.posthog) {
      window.posthog.identify(userId, traits);
    }
  }, []);

  // Track CTA clicks
  const trackCTA = useCallback((ctaName: string, ctaLocation: string, properties?: EventProperties) => {
    trackEvent('cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
      ...properties,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackCTA,
    identifyUser,
  };
}

// Hook for tracking specific user actions
export function useSiteGenerationAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackStart = useCallback((inputType: 'voice' | 'text') => {
    trackEvent('site_generate_start', { input_type: inputType });
  }, [trackEvent]);

  const trackComplete = useCallback((siteId: string, duration: number) => {
    trackEvent('site_generate_complete', { site_id: siteId, duration_ms: duration });
  }, [trackEvent]);

  const trackDeploy = useCallback((siteId: string, url: string) => {
    trackEvent('site_deploy', { site_id: siteId, url });
  }, [trackEvent]);

  return { trackStart, trackComplete, trackDeploy };
}

// Hook for subscription tracking
export function useSubscriptionAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackStart = useCallback((plan: string) => {
    trackEvent('subscription_start', { plan });
  }, [trackEvent]);

  const trackComplete = useCallback((plan: string, amount: number) => {
    trackEvent('subscription_complete', { plan, amount });
  }, [trackEvent]);

  const trackCancel = useCallback((plan: string, reason?: string) => {
    trackEvent('subscription_cancel', { plan, reason });
  }, [trackEvent]);

  return { trackStart, trackComplete, trackCancel };
}

// Declare global posthog
declare global {
  interface Window {
    posthog?: any;
  }
}
