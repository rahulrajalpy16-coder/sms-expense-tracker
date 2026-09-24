# Local architecture

## Device data layer

IndexedDB `sms-expense-local-v1`:
- `meta`: profile, device ID, offline-prepared timestamp, last backup timestamp;
- `vouchers`: monthly reimbursement headers;
- `expenses`: expense lines plus update/delete timestamps for merge transfer;
- `files`: original bill/invoice Blob objects.

## OCR

- Images: Tesseract.js/WebAssembly in the browser.
- PDFs: PDF.js extracts embedded text first; scanned/image-only pages fall back to OCR.
- Parser suggests date, vendor, bill number, enquiry/job number, currency, amount, VAT and description.
- User reviews before save.

## Export

- ExcelJS loads the preserved source XLSX template and writes rows into `Reimbursement` and `foreign currency`.
- PDF-lib creates the combined reimbursement summary + supporting-bills PDF.
- JSZip creates monthly ZIP exports and encrypted transfer payloads.

## Transfer/security

`.smsexp` transfer files are AES-256-GCM encrypted in the browser. Keys are derived from the user-entered password using PBKDF2-SHA256 with 150,000 iterations. The password is not stored.

There is no central database. Device changes are synchronized manually by exporting and **merging** encrypted transfer files. Updated timestamps resolve normal record conflicts and expense tombstones propagate deletions.
