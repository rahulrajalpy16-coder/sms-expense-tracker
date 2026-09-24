# Install on iPhone — private/no VPS

For private-only access, do not use ordinary public GitHub Pages.

Recommended private workflow:
1. Keep this GitHub repository private.
2. Run the Windows local launcher.
3. Use Tailscale Serve to expose the local launcher only inside your tailnet over HTTPS.
4. On iPhone, connect Tailscale and open the HTTPS Serve URL in Safari.
5. Tap **Share → Add to Home Screen → Add**.
6. Open **SMS Expense** from the Home Screen.
7. Open **Profile & Settings → Prepare offline OCR & exports** once while online.
8. Keep encrypted `.smsexp` backups.

After the PWA resources are cached, the app can continue to work offline. The Windows computer must be online only when the iPhone needs to fetch an update or access the live private URL.
