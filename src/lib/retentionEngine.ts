// User Retention & Lifecycle Automation Engine
// Handles re-engagement, churn prevention, and lifecycle messaging

export interface UserLifecycle {
  userId: string;
  email: string;
  stage: 'trial' | 'active' | 'at-risk' | 'churned' | 'power';
  createdAt: Date;
  lastActive: Date;
  sitesCreated: number;
  sitesDeployed: number;
  subscriptionTier: 'free' | 'pro' | 'agency' | 'enterprise' | null;
  onboardingCompleted: boolean;
  emailsSent: string[];
  lastEmailSent: Date | null;
}

export interface RetentionTrigger {
  id: string;
  name: string;
  condition: (user: UserLifecycle) => boolean;
  action: (user: UserLifecycle) => Promise<void>;
  delay: number; // hours after condition met
  cooldown: number; // hours before same trigger can fire again
}

// Lifecycle stage detection
export function detectLifecycleStage(user: UserLifecycle): UserLifecycle['stage'] {
  const daysSinceActive = (Date.now() - user.lastActive.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceSignup = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Churned: No activity for 30 days
  if (daysSinceActive > 30) return 'churned';
  
  // At-risk: No activity for 7 days and hasn't deployed
  if (daysSinceActive > 7 && user.sitesDeployed === 0) return 'at-risk';
  
  // Power user: Multiple sites deployed and active
  if (user.sitesDeployed >= 3 && daysSinceActive < 3) return 'power';
  
  // Active: Deployed at least one site
  if (user.sitesDeployed > 0) return 'active';
  
  // Trial: New user, hasn't deployed yet
  return 'trial';
}

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to VoiceToWebsite - Your first site awaits',
    body: (user: UserLifecycle) => `
      Hi there,
      
      Welcome to VoiceToWebsite! You're about to experience the fastest way to build a website.
      
      🎤 Try it now: Record a 30-second voice description of your business
      ⚡ See your site generated in under 2 minutes
      🚀 Deploy for free or connect your domain
      
      Ready to speak your site into existence?
      
      [Launch your site]
      
      Need help? Reply to this email - we're here for you.
      
      - The VoiceToWebsite Team
    `,
  },
  
  onboardingReminder: {
    subject: "Don't let your website idea fade away",
    body: (user: UserLifecycle) => `
      Hi there,
      
      You started creating a website on VoiceToWebsite but haven't finished yet.
      
      Your voice description is still saved - just one click away from your live site.
      
      ✅ Complete your site now (takes 2 minutes)
      
      Stuck? Here are some ideas:
      - "I need a portfolio for my photography business"
      - "Create a landing page for my coaching program"
      - "Build a website for my restaurant with menu and booking"
      
      [Complete My Site]
      
      - The VoiceToWebsite Team
    `,
  },
  
  deploymentCelebration: {
    subject: '🎉 Your site is live! Next steps inside',
    body: (user: UserLifecycle) => `
      Hi there,
      
      Congratulations! Your website is now live at [site-url].
      
      What's next?
      
      🌐 Connect your custom domain (Pro feature)
      📊 View analytics to see your visitors
      🔍 Submit to Google for indexing
      📱 Share on social media
      
      Upgrade to Pro to unlock:
      - Custom domain
      - Remove VoiceToWebsite branding
      - Analytics dashboard
      - Priority support
      
      [Upgrade to Pro - 50% off first month]
      
      - The VoiceToWebsite Team
    `,
  },
  
  reEngagement: {
    subject: 'We miss you! 40% off to come back',
    body: (user: UserLifecycle) => `
      Hi there,
      
      We noticed you haven't built anything in a while. Did you know you can create unlimited preview sites for free?
      
      Since you've been away, we've added:
      - 🎙️ Enhanced voice recognition
      - 🎨 10 new premium templates
      - 📈 Built-in analytics
      - 🔗 Custom domain support
      
      Come back and get 40% off your first month of Pro:
      
      [Claim 40% Off]
      
      What will you build today?
      
      - The VoiceToWebsite Team
    `,
  },
  
  featureAnnouncement: {
    subject: 'New: White-label agency solution is here',
    body: (user: UserLifecycle) => `
      Hi there,
      
      Big news! You can now white-label VoiceToWebsite for your clients.
      
      Agency Plan features:
      - Unlimited client sites
      - Your branding only
      - API access
      - Team collaboration
      - Dedicated support
      
      Perfect for web designers, marketers, and agencies.
      
      [Learn More About Agency Plan]
      
      - The VoiceToWebsite Team
    `,
  },
  
  referralRequest: {
    subject: 'Earn $50 for each friend you refer',
    body: (user: UserLifecycle) => `
      Hi there,
      
      Love VoiceToWebsite? Share it and earn!
      
      Give your friends 30% off their first month, and you'll get $50 for each Pro signup.
      
      Your referral link: [referral-link]
      
      Share on:
      [Twitter] [LinkedIn] [Email]
      
      Track your referrals and earnings in your dashboard.
      
      - The VoiceToWebsite Team
    `,
  },
};

// Retention triggers
export const retentionTriggers: RetentionTrigger[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    condition: (user) => 
      !user.onboardingCompleted && 
      hoursSince(user.createdAt) >= 1 &&
      !user.emailsSent.includes('welcome'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.welcome);
      await recordEmailSent(user.userId, 'welcome');
    },
    delay: 1,
    cooldown: 24 * 30, // Once per month max
  },
  
  {
    id: 'onboarding-reminder',
    name: 'Onboarding Reminder',
    condition: (user) => 
      user.sitesCreated === 0 && 
      hoursSince(user.createdAt) >= 24 &&
      !user.emailsSent.includes('onboarding-reminder'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.onboardingReminder);
      await recordEmailSent(user.userId, 'onboarding-reminder');
    },
    delay: 24,
    cooldown: 24 * 7,
  },
  
  {
    id: 'deployment-celebration',
    name: 'Deployment Celebration',
    condition: (user) => 
      user.sitesDeployed > 0 &&
      hoursSince(user.lastActive) < 1 &&
      !user.emailsSent.includes('deployment-celebration'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.deploymentCelebration);
      await recordEmailSent(user.userId, 'deployment-celebration');
    },
    delay: 1,
    cooldown: 24 * 30,
  },
  
  {
    id: 're-engagement',
    name: 'Re-engagement Campaign',
    condition: (user) => 
      hoursSince(user.lastActive) >= 24 * 7 &&
      !user.emailsSent.includes('re-engagement'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.reEngagement);
      await recordEmailSent(user.userId, 're-engagement');
    },
    delay: 24 * 7,
    cooldown: 24 * 30,
  },
  
  {
    id: 'power-user-upsell',
    name: 'Power User Agency Upsell',
    condition: (user) => 
      user.sitesDeployed >= 3 &&
      user.subscriptionTier === 'pro' &&
      !user.emailsSent.includes('power-user-upsell'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.featureAnnouncement);
      await recordEmailSent(user.userId, 'power-user-upsell');
    },
    delay: 24 * 2,
    cooldown: 24 * 14,
  },
  
  {
    id: 'referral-request',
    name: 'Referral Request',
    condition: (user) => 
      user.sitesDeployed >= 1 &&
      hoursSince(user.createdAt) >= 24 * 14 &&
      !user.emailsSent.includes('referral-request'),
    action: async (user) => {
      await sendEmail(user.email, emailTemplates.referralRequest);
      await recordEmailSent(user.userId, 'referral-request');
    },
    delay: 24 * 14,
    cooldown: 24 * 60,
  },
];

// Helper functions
function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

async function sendEmail(to: string, template: { subject: string; body: (user: UserLifecycle) => string }): Promise<void> {
  // Placeholder for email service integration (SendGrid, Resend, etc.)
  console.log(`[Email] To: ${to}, Subject: ${template.subject}`);
  // In production: await emailService.send({ to, subject: template.subject, body: template.body(user) });
}

async function recordEmailSent(userId: string, emailType: string): Promise<void> {
  // Placeholder for database update
  console.log(`[Retention] Email sent: ${emailType} to user ${userId}`);
  // In production: await db.users.update(userId, { $push: { emailsSent: emailType }, lastEmailSent: new Date() });
}

// Process all users for retention triggers
export async function processRetention(users: UserLifecycle[]): Promise<void> {
  for (const user of users) {
    // Update lifecycle stage
    const newStage = detectLifecycleStage(user);
    if (newStage !== user.stage) {
      console.log(`[Lifecycle] User ${user.userId} moved to ${newStage}`);
      // await db.users.update(user.userId, { stage: newStage });
    }
    
    // Check all triggers
    for (const trigger of retentionTriggers) {
      if (trigger.condition(user)) {
        const lastSent = user.emailsSent
          .filter(e => e === trigger.id)
          .length;
        
        if (lastSent === 0 || hoursSince(user.lastEmailSent!) >= trigger.cooldown) {
          console.log(`[Retention] Triggering: ${trigger.name} for ${user.userId}`);
          await trigger.action(user);
        }
      }
    }
  }
}

// Export engine
export const retentionEngine = {
  detectStage: detectLifecycleStage,
  process: processRetention,
  triggers: retentionTriggers,
};
