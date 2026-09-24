# Install on iPhone — no VPS

1. Upload this folder's contents to an HTTPS subdomain on your existing normal web hosting.
2. Open the subdomain in Safari.
3. Tap **Share** → **Add to Home Screen** → **Add**.
4. Open **SMS Expense** from the Home Screen.
5. Enter your name/designation.
6. Open **Profile & Settings** → **Prepare offline OCR & exports** once while internet is available.
7. Test **Add / Scan bill** → **Take photo**.
8. Create an encrypted `.smsexp` backup after your first real entries.

The subdomain serves app code only. Expense rows, OCR text, invoice photos/PDFs and backups are not stored in a hosted database.

### Transfer to Windows

Backup & Device Transfer → Create `.smsexp` transfer → move the file to Windows → **Merge into this device**. Merge keeps newer records rather than wiping the complete Windows database.

### Storage warning

Do not clear Safari website data for this subdomain unless a current encrypted backup exists.
