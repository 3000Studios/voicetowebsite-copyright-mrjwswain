# AdSense readiness checklist

Use this list to confirm the site is ready for Google AdSense review and approval.

## Links and navigation

- **Link checker:** All 117 HTML files checked; no broken internal links.
- **Homepage:** Compliance links visible (About, Contact, Support, Privacy, Terms, Trust Center,
  Status).
- **Shared nav (nav.js):** Privacy, Terms, Contact, About, Legal, and other policy links in the
  menu.
- **Policy pages:** Privacy and Terms include a site header with direct links to each other and
  Contact/Legal.

## Required pages for AdSense

| Page    | URL           | Status                                                      |
| ------- | ------------- | ----------------------------------------------------------- |
| Privacy | /privacy.html | ✅ Live; includes AdSense disclosure, cookies, contact link |
| Terms   | /terms.html   | ✅ Live; links to Legal and Privacy                         |
| Contact | /contact.html | ✅ Live; form + owner/support/legal emails                  |
| About   | /about        | ✅ Live; substantive content                                |
| Legal   | /legal.html   | ✅ Live; ownership, acceptable use, liability               |

## Privacy policy (AdSense requirements)

- ✅ Clear statement that the site uses Google AdSense.
- ✅ Disclosure that Google may use cookies and similar technologies.
- ✅ Link to [Google Ads Settings](https://www.google.com/settings/ads) for opt-out.
- ✅ Contact method for privacy questions (contact page).
- ✅ Last updated date (February 12, 2026).

## Site and content

- **HTTPS:** Production routes served over HTTPS (voicetowebsite.com).
- **Content:** Homepage and key pages have substantive, original content.
- **Navigation:** Policy and contact pages are one click from the homepage (compliance links + nav).
- **Mobile:** Responsive layout; policy pages readable on small screens.

## Admin dashboard

- **URL:** https://voicetowebsite.com/admin/
- **Status:** Loads and shows Command Center OS (Worker Health, Governance, Deploy State).
- **Note:** AdSense reviews the **public** site only. Admin is for you; “Governance: FAIL” / “Env
  Audit: FAIL” in the dashboard are internal checks and do not affect AdSense approval.

## Before submitting to AdSense

1. Deploy the latest changes (including Privacy/Terms header and cross-links): `npm run build` then
   `npm run deploy`.
2. Open the site in an incognito window and click through: Home → Privacy, Terms, Contact, About.
   Confirm all load and navigation is clear.
3. In AdSense, use the exact URLs for Privacy and Contact when asked (e.g.
   `https://voicetowebsite.com/privacy.html`, `https://voicetowebsite.com/contact.html`).

---

_Generated for AdSense review preparation. Update “Last updated” in privacy.html when you change the
policy._
