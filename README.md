# SMS Expense Tracker — Private Local PWA

Offline-first expense tracker for Sinor Marine Services.

## Privacy model
- This GitHub repository is private.
- Expense records, uploaded invoices, OCR results, and local settings are stored on the user's device (IndexedDB), not committed to this repository.
- The repository contains only the application code, branding assets, and the reimbursement workbook template.
- Do not enable a public GitHub Pages deployment if private access is required.

## Windows
Use the standalone Windows build for a fully local installation.

## iPhone
The PWA can be installed from an HTTPS static host. For private-only access, use an access-controlled static host connected to this private repository (for example, Cloudflare Pages + Access) rather than ordinary public GitHub Pages.

## Data transfer
Use the encrypted `.smsexp` backup/merge file to move or merge records between iPhone and Windows.

## Security
No Supabase, Lovable AI, Gemini, hosted SQL database, or VPS is required by this edition.
