# SMS Expense Tracker

Offline-first expense tracker for Sinor Marine Services.

## Live app
GitHub Pages URL:
https://rahulrajalpy16-coder.github.io/sms-expense-tracker/

## Privacy model
The public repository contains the application code, branding assets, and reimbursement workbook template.

Your actual expense entries, uploaded bills/invoices, OCR results, and local settings remain in the browser/device database (IndexedDB). They are not written to this GitHub repository.

## iPhone
Open the live URL in Safari and choose **Share → Add to Home Screen**.
While online the first time, use **Prepare offline OCR & exports** so the required runtime components are cached.

## Windows
The same web app can be used from the Pages URL. The project also has a separate standalone local Windows executable build.

## Transfer between devices
Use encrypted `.smsexp` export/merge files to move or merge expense data between iPhone and Windows.

## No recurring server requirement
This edition does not require Supabase, Lovable AI, Gemini, hosted SQL, Docker, or a VPS.
