# Validation results

Validated on 2026-09-24 in the build environment.

Passed:
- `app.js`, `db.js`, `parser.js`, `sw.js` JavaScript syntax checks.
- Manifest JSON validation.
- HTML local-file reference validation.
- Invoice parser test for vendor, invoice date, invoice number, job number, AED currency, VAT and grand total.
- Windows launcher cross-compiled successfully as PE32+ x86-64 executable.
- Reimbursement template SHA-256 exactly matches the supplied source workbook:
  `00e111bb02fc7f7cdbad22f7cd71f0746f41de3c1c0f121b8288d37563dd11ac`
- Workbook contains the original `Reimbursement` and `foreign currency` worksheets.

Target-device acceptance still required:
- iOS Safari Add-to-Home-Screen behavior.
- Tesseract WebAssembly/model download and cache on the target network.
- Browser ExcelJS/PDF-lib final export on the target Windows/iPhone browser.

The source workbook contains an existing `#VALUE!` value in its signature area; the export routine clears the signature cells when creating a populated workbook rather than carrying that stale value into the output.
