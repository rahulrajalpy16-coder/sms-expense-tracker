(function(){
function moneyNumber(v){
  if(v==null)return null;
  let s=String(v).replace(/\s/g,'').replace(/[^0-9,.-]/g,'');
  if(!s)return null;
  if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');
  else if((s.match(/,/g)||[]).length===1&&!s.includes('.')){
    const [a,b]=s.split(',');
    s=b&&b.length<=2?`${a}.${b}`:a+b;
  } else s=s.replace(/,/g,'');
  const n=Number(s);return Number.isFinite(n)?n:null;
}
function normalizeText(text){return String(text||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()}
function findCurrency(text){
  const upper=text.toUpperCase();
  const patterns=[['AED',/\bAED\b|\bDHS?\b|د\.?إ|درهم/i],['USD',/\bUSD\b|US\s*\$|\$/i],['EUR',/\bEUR\b|€/i],['GBP',/\bGBP\b|£/i],['SAR',/\bSAR\b|\bSR\b/i],['QAR',/\bQAR\b/i],['OMR',/\bOMR\b/i],['INR',/\bINR\b|₹/i]];
  for(const [code,re] of patterns)if(re.test(upper))return{value:code,confidence:.96};
  return{value:'AED',confidence:.45};
}
function parseDate(text){
  const candidates=[
    /(?:invoice\s*date|inv\.?\s*date|receipt\s*date|date)\s*[:#-]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    /(?:invoice\s*date|inv\.?\s*date|receipt\s*date|date)\s*[:#-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /\b(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/,
    /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i
  ];
  for(let i=0;i<candidates.length;i++){
    const m=text.match(candidates[i]);if(!m)continue;const raw=m[1];let y,mo,d;
    if(/^\d{4}/.test(raw)){[y,mo,d]=raw.split(/[\/-]/).map(Number)}
    else if(/^[0-9]{1,2}\s+[A-Za-z]/.test(raw)){const dt=new Date(raw);if(!Number.isNaN(dt.valueOf()))return{value:dt.toISOString().slice(0,10),confidence:i<2?.97:.82};continue}
    else{const parts=raw.split(/[\/-]/).map(Number);d=parts[0];mo=parts[1];y=parts[2]<100?2000+parts[2]:parts[2]}
    if(y>=2000&&y<=2100&&mo>=1&&mo<=12&&d>=1&&d<=31)return{value:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,confidence:i<2?.97:.80};
  }
  return{value:null,confidence:0};
}
function findBillNo(text,vendor){
  const invoice=[/(?:invoice\s*(?:no\.?|number|#)|inv\.?\s*no\.?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,.97];
  const receipt=[/(?:receipt\s*(?:no\.?|number|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,.94];
  const bill=[/(?:bill\s*(?:no\.?|number|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,.92];
  const fuel=/ENOC|EPPCO|ADNOC|Emarat/i.test(vendor||'');
  const patterns=fuel?[receipt,invoice,bill]:[invoice,receipt,bill];
  for(const [re,confidence] of patterns){const m=text.match(re);if(m){const v=m[1].replace(/[^A-Z0-9\/-]/gi,'').trim();if(v&&!/^\d{1,2}$/.test(v))return{value:v,confidence}}}
  return{value:null,confidence:0};
}
function findJobNo(text){const m=text.match(/(?:enq(?:uiry)?|job|project|work\s*order|wo)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i);return m?{value:m[1].trim(),confidence:.84}:{value:null,confidence:0}}
function lineAmounts(line){
  const matches=[...line.matchAll(/(?:AED|DHS?|USD|EUR|GBP|SAR|QAR|OMR|INR|[$€£₹])?\s*([0-9][0-9,]*(?:\.\d{1,3})?)/ig)];
  return matches.map(m=>moneyNumber(m[1])).filter(Number.isFinite);
}
function extractAmounts(text){
  const lines=text.split('\n').map(s=>s.trim()).filter(Boolean),scored=[];
  for(const line of lines){
    const lower=line.toLowerCase();
    let score=0;
    if(/net\s*amount/.test(lower))score=150;
    else if(/payment\s*amount/.test(lower))score=145;
    else if(/(?:^|\s)amount\s*[:=-]?\s*(?:aed|dhs?)/.test(lower))score=142;
    else if(/total\s*amount/.test(lower))score=140;
    else if(/grand\s*total|total\s*due|amount\s*due|amount\s*paid/.test(lower))score=135;
    else if(/gross\s*total/.test(lower))score=125;
    else if(/\bbank\b/.test(lower)&&/(?:aed|dhs?|[$€£₹])/.test(lower))score=118;
    else if(/\btotal\b/.test(lower))score=110;
    if(!score)continue;
    if(/sub\s*total|subtotal|taxable|vat|tax\s*amount|discount|balance\s*amount|tender\s*amount|total\s*qty|approval|batch|terminal|pump|trn|merchant\s*id|price\b|u\.?price|quantity|\bqty\b/i.test(lower))score-=90;
    if(score<=20)continue;
    const vals=lineAmounts(line).filter(v=>v>=0&&v<1e8);
    if(vals.length){
      const value=vals[vals.length-1];
      if(value===0&&score<140)continue;
      scored.push({value,score,line});
    }
  }
  scored.sort((a,b)=>b.score-a.score || b.value-a.value);
  let total=scored[0]?.value??null,totalConfidence=scored[0]?(scored[0].score>=140?.98:scored[0].score>=125?.94:.88):0;
  if(total==null){
    const vals=[...text.matchAll(/(?:AED|DHS?|USD|EUR|GBP|SAR|QAR|OMR|INR|[$€£₹])\s*[:=]?\s*([0-9][0-9,]*(?:\.\d{1,3})?)/ig)].map(m=>moneyNumber(m[1])).filter(v=>Number.isFinite(v)&&v>0&&v<1e8);
    if(vals.length){total=Math.max(...vals);totalConfidence=.58}
  }
  let vat=null,vatConfidence=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(!/\b(vat|tax)\b/i.test(line)||/trn|tax\s*invoice/i.test(line))continue;
    let vals=lineAmounts(line).filter(v=>v>0&&v<1e7);
    let source=line;
    if(!vals.length && /vat\s*summary/i.test(line)){
      source=lines[i+1]||'';
      vals=lineAmounts(source).filter(v=>v>0&&v<1e7);
    }
    if(!vals.length)continue;
    const nonPercent=vals.filter(v=>!(v<=20&&new RegExp(`${String(v).replace('.','\\.')}\\s*%`).test(source)));
    const candidate=(nonPercent.length?nonPercent:vals)[(nonPercent.length?nonPercent:vals).length-1];
    if(candidate!=null){vat=candidate;vatConfidence=/vat\s*(?:amount|amt|\(aed\))/i.test(line)?.96:/vat\s*summary/i.test(line)?.94:.88;break}
  }
  return{total,totalConfidence,vat,vatConfidence};
}
function findVendor(text){
  const known=[
    [/\bADNOC\b/i,'ADNOC Distribution'],
    [/\bENOC\b|\bEPPCO\b/i,'ENOC'],
    [/\bEMARAT\b/i,'Emarat'],
    [/\bACTIV\s*8\b|\bACTIV8\b/i,'Activ8 Reem Mall'],
    [/\bETISALAT\b/i,'Etisalat'],
    [/\bHOSTINGER\b/i,'Hostinger'],
    [/\bCANVA\b/i,'Canva'],
    [/\bLOVABLE\b/i,'Lovable']
  ];
  for(const [re,name] of known)if(re.test(text))return{value:name,confidence:.99};
  const lines=text.split('\n').map(s=>s.trim()).filter(Boolean),skip=/invoice|receipt|tax invoice|date|phone|tel|email|www\.|trn|vat|customer|bill to|address|cashier|page \d|terminal|merchant|payment/i;
  for(const line of lines.slice(0,16)){
    const cleaned=line.replace(/[^\p{L}\p{N}&.' -]/gu,'').replace(/\s{2,}/g,' ').trim();
    if(cleaned.length<3||cleaned.length>80||skip.test(cleaned))continue;
    const letters=(cleaned.match(/\p{L}/gu)||[]).length;
    if(letters>=3)return{value:cleaned,confidence:.72};
  }
  return{value:null,confidence:0};
}
function classifyDescription(text,vendor){
  const s=`${vendor||''}\n${text}`.toLowerCase();
  if(/\b(enoc|eppco|adnoc|emarat)\b|pump\s*(?:no|number)|\bpetrol\b|\bdiesel\b|\bgasoline\b|\bfuel\b|\bulg[-\s]?9[15]\b|e[-\s]?plus|super\s*98/.test(s))return{value:'Car Fuel',confidence:.99};
  if(/\bparking\b|parking\s*fee|parking\s*ticket/.test(s))return{value:'Parking',confidence:.97};
  if(/\bsalik\b|toll/.test(s))return{value:'Salik',confidence:.97};
  if(/car\s*wash|vehicle\s*wash/.test(s))return{value:'Car Wash',confidence:.97};
  if(/car\s*service|vehicle\s*service|garage|repair|maintenance|tyre|tire/.test(s))return{value:'Car Service',confidence:.93};
  if(/\buber\b|\bcareem\b|taxi|metro|airline|flight|hotel|travel|transport|bus\b|train\b/.test(s))return{value:'Travel Expense',confidence:.94};
  if(/restaurant|cafe|coffee|lunch|dinner|meal|meeting\s*expense/.test(s))return{value:'Meeting Expense',confidence:.91};
  if(/etisalat|du\s|mobile|recharge|telephone|telecom|internet/.test(s))return{value:'Communication Expense',confidence:.90};
  if(/domain|hosting|subscription|software|saas|canva|lovable|advertis|google\s*ads|seo|digital\s*marketing|service|consult|trading|retail|purchase|product|item\b|u\.?price|\bqty\b|quantity/.test(s))return{value:'Sales Expense',confidence:.90};
  return{value:'Sales Expense',confidence:.65};
}
function parseInvoiceText(raw){
  const text=normalizeText(raw),date=parseDate(text),vendor=findVendor(text),billNo=findBillNo(text,vendor.value),jobNo=findJobNo(text),currency=findCurrency(text),amounts=extractAmounts(text),description=classifyDescription(text,vendor.value);
  return{date:date.value,vendor:vendor.value,bill_no:billNo.value,enq_job_no:jobNo.value,currency:currency.value,total:amounts.total,vat:amounts.vat,description:description.value,confidence:{date:date.confidence,vendor:vendor.confidence,bill_no:billNo.confidence,enq_job_no:jobNo.confidence,currency:currency.confidence,amount:amounts.totalConfidence,vat:amounts.vatConfidence,description:description.confidence}};
}
window.SMSParser={parseInvoiceText};
})();