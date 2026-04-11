/**
 * Voicetowebsite.com — project identity
 * Canonical source: https://github.com/3000Studios/voicetowebsite-copyright-mrjwswain
 * (VoiceToWebsite assets are proprietary and owned by Mr. jwswain.)
 */

export const REPOSITORY_URL = 'https://github.com/3000Studios/voicetowebsite-copyright-mrjwswain'

export const SITE_DOMAIN = 'voicetowebsite.com'
export const SITE_URL = `https://${SITE_DOMAIN}`
export const SITE_DISPLAY_NAME = 'Voicetowebsite'
export const COPYRIGHT_HOLDER = 'Mr. jwswain'

export function getCopyrightLine() {
  return `© ${new Date().getFullYear()} ${COPYRIGHT_HOLDER} · ${SITE_DOMAIN} · All rights reserved`
}
