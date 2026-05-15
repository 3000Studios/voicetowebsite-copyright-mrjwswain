# Remote Access Setup (Free)

## Goal

Access your desktop agent from your phone with a free, secure setup:

1. **Tailscale** for private networking
2. **Chrome Remote Desktop** for screen control (works on Windows Home)

---

## Step 1: Install Tailscale (VPN)

1. Install Tailscale on your Windows desktop.
2. Install Tailscale on your phone.
3. Sign in with the same account and verify both devices are online.

This gives you a private, encrypted network between your phone and desktop.

---

## Step 2: Install Chrome Remote Desktop (Screen Control)

1. Install Chrome Remote Desktop on the desktop and enable remote access.
2. Install the Chrome Remote Desktop app on your phone.
3. Pair the devices and verify you can control the desktop.

This works on Windows Home, which cannot host built-in Windows RDP.

---

## Step 3: Use the Admin Control Page

1. Open the admin site on your phone after you connect to your desktop.
2. Use **Lab 1** and **Voice Commands** for live control.

---

## Optional (More Secure)

- Enable device approval in Tailscale.
- Require Windows login before remote access.
- Keep admin access behind your existing access guard.
