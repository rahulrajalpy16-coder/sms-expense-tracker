const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('parser.js','utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(code,ctx);
const parse=ctx.window.SMSParser.parseInvoiceText;

function close(a,b){return Math.abs(Number(a)-Number(b))<0.01}
function check(text,expected){
  const r=parse(text);
  if(expected.date)assert.strictEqual(r.date,expected.date);
  if(expected.vendor)assert.strictEqual(r.vendor,expected.vendor);
  if(expected.bill_no)assert.strictEqual(r.bill_no,expected.bill_no);
  if(expected.description)assert.strictEqual(r.description,expected.description);
  if(expected.total!=null)assert.ok(close(r.total,expected.total),`total ${r.total} != ${expected.total}`);
  if(expected.vat!=null)assert.ok(close(r.vat,expected.vat),`vat ${r.vat} != ${expected.vat}`);
}

check(`Emarat
Abu Kadara
Tax Invoice
Date 19-09-2026 17:56:44
Receipt No: 746397
Pump No: 3
Product: Special
Total Amount AED 100.00
VAT SUMMARY
C 5% 4.76
Invoice No: 202609193780021746397
Bank AED 100.00`,{
  date:'2026-09-19',vendor:'Emarat',bill_no:'746397',description:'Car Fuel',total:100,vat:4.76
});

check(`activ8
Activ8 Reem Mall
Denaster General Trading LLC
TAX INVOICE
Inv Date : 2026-09-15
Inv No : 206180
Item QTY U.Price VAT Amount
Garmin - Fenix 8 - Solar Sapphire
1 4,648.57 232.43 4,881.00
Sub Total 4,881.00
Discount 478.34
Gross Total 4,403.00
Taxable Amount 4,193.01
VAT Amount 209.65
Net Amount 4,402.66
Payment Method Payment Amount
Card MASTER-6260 4,402.66`,{
  date:'2026-09-15',vendor:'Activ8 Reem Mall',bill_no:'206180',description:'Sales Expense',total:4402.66,vat:209.65
});

check(`ENOC SITE 1022
ENOC RETAIL LLC
DUBAI UAE
Date 06/08/2026 Time 17:00
PURCHASE
Receipt No 937
Amount : AED 112.21
VAT Amount 5.34`,{
  date:'2026-08-06',vendor:'ENOC',bill_no:'937',description:'Car Fuel',total:112.21,vat:5.34
});

check(`ADNOC
TAX INVOICE
ADNOC Distribution
Item Qty Price Subtotal-AED
ULG-95 (C) 42.21 3.65 156.97
Total Amount 156.97
VAT code C Amount 149.50 VAT Rate 5% VAT (AED) 7.47
Date 04-06-2026 18:38:08
Receipt No: 27146
Invoice No: 26050418280953627146`,{
  date:'2026-06-04',vendor:'ADNOC Distribution',bill_no:'27146',description:'Car Fuel',total:156.97,vat:7.47
});

console.log('Receipt parser sample tests passed.');
