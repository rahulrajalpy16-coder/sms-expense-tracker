const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('parser.js','utf8');
const ctx={window:{},Date};vm.createContext(ctx);vm.runInContext(code,ctx);
const parse=ctx.window.SMSParser.parseInvoiceText;
const eq=(a,b)=>typeof b==='number'?Math.abs(Number(a)-b)<0.011:String(a)===String(b);
const cases=[
  {
    name:'IMG_0200 ENOC thermal',
    text:`an enoc
ENOC SITE 1022
ENOC RETAIN Lic
DUBAI, UAE
Date 06/08/2026 Time -17.09
Merchant ID 901130109639
Terminal ID 44230006
Batch No: 937
Receipt No: 07118)
Batch/Host NI
Amount : AED 112.21
VAT Amount`,
    expected:{date:'2026-08-06',vendor:'ENOC',bill_no:'071181',currency:'AED',total:112.21,vat:5.34,description:'Car Fuel'}
  },
  {
    name:'IMG_1169 ENOC thermal',
    text:`ENOC SITE 1022
ENOC RETAL
DUBAI UAE
Yate 03/09/2026 Time 2145
Batch No 501
Receipt No 105747
Amount : AED 100.00
ENOC`,
    expected:{date:'2026-09-03',vendor:'ENOC',bill_no:'105747',currency:'AED',total:100,vat:4.76,description:'Car Fuel'}
  },
  {
    name:'IMG_1651 Activ8 retail',
    text:`Activ8 Reem Mall
Denaster General Trading LLC.
TRN# 100499229100003
TAX INVOICE
Inv Date : 2026-09-15 Staff: 21
Inv No : 206180
Garmin - Fenix 8 - Solar Sapphire
Taxable Amount: 4,193.01
VAT Amount: 209.651
Net Amount: 4,402.66
Payment Method Payment Amount
Card MASTER-6260 4,402.66`,
    expected:{date:'2026-09-15',vendor:'Activ8 Reem Mall',bill_no:'206180',currency:'AED',total:4402.66,vat:209.65,description:'Sales Expense'}
  },
  {
    name:'IMG_1802 Emarat thermal',
    text:`émarat
Abu Kadara
TRN:100293326300003
Tax Invoice
Date 19-09-2026 1 56:44
Receipt No 746397
Product Special
27.10 3.69 100.00
Total Amount #8 100.00
VAT SUMMARY
invoice No
202609193780021746397`,
    expected:{date:'2026-09-19',vendor:'Emarat',bill_no:'746397',currency:'AED',total:100,vat:4.76,description:'Car Fuel'}
  },
  {
    name:'IMG_7493 ADNOC noisy thermal',
    text:`ADNOC
ADNOC Distribution
P.O Box 4188 Abu Dhabi UAE
ULG-95 (C) 44.21 3.55 156.97
Total Amount 156.97
VAT Summary
VAT code Amount VAT Rate VAT (AED)
C 14.9. 86 ) 7.47
Date: @4-05-20''6 18:38:08
Recelpt No: 27146
Involce No: 26050418280953627146`,
    expected:{date:'2026-05-04',vendor:'ADNOC Distribution',bill_no:'27146',currency:'AED',total:156.97,vat:7.47,description:'Car Fuel'}
  }
];
for(const c of cases){
  const got=parse(c.text);
  for(const [k,v] of Object.entries(c.expected))assert.ok(eq(got[k],v),`${c.name} ${k}: got ${got[k]} expected ${v}`);
}
console.log(`Receipt parser actual-photo OCR tests passed: ${cases.length}/${cases.length}`);
