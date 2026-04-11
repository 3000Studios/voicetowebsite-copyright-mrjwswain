import { SITE_DOMAIN } from './siteMeta.js'

export const publicNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Products', to: '/products' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
  { label: 'Admin', to: '/admin' }
]

export const publicStatusLines = [
  'VOICE → WEBSITE',
  'SPEAK. SHIP. SCALE.',
  SITE_DOMAIN
]

export const publicTickerItems = [
  '// TURN SPOKEN BRIEFS INTO PUBLISHED PAGES',
  '// STRUCTURED CONTENT, SEO, AND DEPLOYS FROM ONE PIPELINE',
  '// IDEAL FOR AGENCIES, FOUNDERS, AND PRODUCT TEAMS',
  '// FAST ITERATION FROM DRAFT TO LIVE SITE',
  '// BUILT FOR CLARITY, SPEED, AND MEASURABLE CONVERSION'
]

export const adminNavItems = [
  { label: 'Overview', to: '/admin/overview' },
  { label: 'Sign in', to: '/admin/login' },
  { label: 'Public site', to: '/' },
  { label: 'Blog', to: '/blog' },
  { label: 'Products', to: '/products' }
]

export const adminStatusLines = [
  'OPERATIONS: ONLINE',
  'PIPELINE: READY',
  `${SITE_DOMAIN} // admin`
]

export const adminTickerItems = [
  '// ANALYTICS + DEPLOY + CONTENT + AI CONSOLE',
  '// SYNC DATA FROM THE TOP BAR ANYTIME',
  '// USE SECTIONS IN THE SIDEBAR TO STAY FOCUSED',
  '// COMMAND ROUTER FOR ADVANCED AUTOMATION'
]
