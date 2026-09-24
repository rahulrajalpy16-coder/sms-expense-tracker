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
function findCurrency(text,vendor){
  const upper=text.toUpperCase();
  const codes=[['AED',/\bAED\b|\bDHS?\b|د\.?إ|درهم/i],['USD',/\bUSD\b|US\s*\$/i],['EUR',/\bEUR\b/i],['GBP',/\bGBP\b/i],['SAR',/\bSAR\b|\bSR\b/i],['QAR',/\bQAR\b/i],['OMR',/\bOMR\b/i],['INR',/\bINR\b/i]];
  for(const [code,re] of codes)if(re.test(upper))return{value:code,confidence:.98};
  const uae=/\b(ENOC|EPPCO|ADNOC|EMARAT|ACTIV8|ACTIV\s*8)\b/i.test(`${vendor||''} ${text}`)||/\bUAE\b|DUBAI|ABU\s*DHABI|\bTRN\b/i.test(upper);
  if(uae)return{value:'AED',confidence:.93};
  if(/\$/.test(text))return{value:'USD',confidence:.72};
  if(/€/.test(text))return{value:'EUR',confidence:.85};
  if(/£/.test(text))return{value:'GBP',confidence:.85};
  if(/₹/.test(text))return{value:'INR',confidence:.85};
  return{value:'AED',confidence:.55};
}
function parseDate(text){
  const nowYear=new Date().getFullYear(),maxYear=nowYear+1,currentDecade=Math.floor(nowYear/10)*10;
  const accept=(y,mo,d,confidence)=>{
    y=Number(y);mo=Number(mo);d=Number(d);
    if(y<2000||y>maxYear||mo<1||mo>12||d<1||d>31)return null;
    return{value:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,confidence};
  };
  const repairYear=raw=>{
    const digits=String(raw||'').replace(/\D/g,'');
    if(/^20\d{2}$/.test(digits))return Number(digits);
    if(/^\d{2}$/.test(digits))return 2000+Number(digits);
    if(/^20\d$/.test(digits))return currentDecade+Number(digits.slice(-1));
    if(/^20$/.test(digits))return null;
    return null;
  };
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  const labeled=lines.filter(x=>/(?:inv(?:oice)?\s*date|receipt\s*date|\bdate\b)/i.test(x));
  const ordered=[...labeled,...lines.filter(x=>!labeled.includes(x))];
  for(const line of ordered){
    const labeledLine=/(?:inv(?:oice)?\s*date|receipt\s*date|\bdate\b)/i.test(line);
    let m=line.match(/(?:inv(?:oice)?\s*date|receipt\s*date|\bdate\b)?\s*[:#;=.-]*\s*(20\d{2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{1,2})/i);
    if(m){const a=accept(m[1],m[2],m[3],labeledLine?.99:.86);if(a)return a}
    m=line.match(/(?:inv(?:oice)?\s*date|receipt\s*date|\bdate\b)?\s*[:#;=.-]*\s*(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*([^\s]{2,7})/i);
    if(m){
      const y=repairYear(m[3]);
      if(y){const a=accept(y,m[2],m[1],labeledLine?.98:.84);if(a)return a}
    }
    // OCR often drops the middle '2' in 2026, e.g. 20'6 or 20/6.
    m=line.match(/(?:inv(?:oice)?\s*date|receipt\s*date|\bdate\b)?\s*[:#;=.-]*\s*(\d{1,2})\D{1,3}(\d{1,2})\D{1,3}20\D{0,3}(\d)(?!\d)/i);
    if(m){
      const y=currentDecade+Number(m[3]);
      const a=accept(y,m[2],m[1],labeledLine?.97:.82);if(a)return a;
    }
  }
  const named=text.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})\b/i);
  if(named){let y=Number(named[3]);if(y<100)y+=2000;const mo=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(named[2].toLowerCase().slice(0,3))+1;const a=accept(y,mo,named[1],.82);if(a)return a}
  return{value:null,confidence:0};
}
function findBillNo(text,vendor){
  const invoice=[/(?:invoice\s*(?:no\.?|number|#)|inv\.?\s*no\.?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/\-\)\]\|Il]{2,})/i,.97];
  const receipt=[/(?:receipt\s*(?:no\.?|number|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/\-\)\]\|Il]{2,})/i,.94];
  const bill=[/(?:bill\s*(?:no\.?|number|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/\-\)\]\|Il]{2,})/i,.92];
  const fuel=/ENOC|EPPCO|ADNOC|Emarat/i.test(vendor||'');
  const clean=raw=>{
    let v=String(raw||'').trim();
    if(fuel){
      v=v.replace(/[\)\]\|Il]/g,'1').replace(/[Oo]/g,'0');
      if(/^[0-9\/\-]+$/.test(v))v=v.replace(/[\/\-]/g,'');
    }
    return v.replace(/[^A-Z0-9\/-]/gi,'').trim();
  };
  const patterns=fuel?[receipt,invoice,bill]:[invoice,receipt,bill];
  for(const [re,confidence] of patterns){const m=text.match(re);if(m){const v=clean(m[1]);if(v&&!/^\d{1,2}$/.test(v))return{value:v,confidence}}}
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
    let vals=lineAmounts(line).filter(v=>v>=0&&v<1e8);
    const split=line.match(/(?:AED|DHS?|USD|EUR|GBP|SAR|QAR|OMR|INR)?\s*[:=]?\s*(\d{1,7})\s+(\d{2})\s*$/i);
    if(split&&score>=110){
      const repaired=Number(`${split[1]}.${split[2]}`);
      if(Number.isFinite(repaired))vals=[repaired];
    }
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
    if(!vals.length && /vat\s*summary|vat\s*code|vat\s*rate|vat\s*\(aed\)/i.test(line)){
      for(let j=1;j<=2&&!vals.length;j++){
        source=lines[i+j]||'';
        vals=lineAmounts(source).filter(v=>v>0&&v<1e7);
      }
    }
    if(!vals.length)continue;
    const nonPercent=vals.filter(v=>!(v<=20&&new RegExp(`${String(v).replace('.','\\.')}\\s*%`).test(source)));
    const candidate=(nonPercent.length?nonPercent:vals)[(nonPercent.length?nonPercent:vals).length-1];
    if(candidate!=null){vat=candidate;vatConfidence=/vat\s*(?:amount|amt|\(aed\))/i.test(line)?.96:/vat\s*summary/i.test(line)?.94:.88;break}
  }
  return{total,totalConfidence,vat,vatConfidence};
}
function findVendor(text){
  const folded=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
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
  for(const [re,name] of known)if(re.test(folded))return{value:name,confidence:.99};
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
  const s=`${vendor||''}\n${text}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
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
  const text=normalizeText(raw),date=parseDate(text),vendor=findVendor(text),billNo=findBillNo(text,vendor.value),jobNo=findJobNo(text),currency=findCurrency(text,vendor.value),amounts=extractAmounts(text),description=classifyDescription(text,vendor.value);
  let vat=amounts.vat,vatConfidence=amounts.vatConfidence;
  if(vat==null&&Number.isFinite(Number(amounts.total))&&/ENOC|EPPCO|ADNOC|Emarat/i.test(vendor.value||'')){
    vat=Math.round((Number(amounts.total)*5/105)*100)/100;
    vatConfidence=.82;
  }
  return{date:date.value,vendor:vendor.value,bill_no:billNo.value,enq_job_no:jobNo.value,currency:currency.value,total:amounts.total,vat,description:description.value,confidence:{date:date.confidence,vendor:vendor.confidence,bill_no:billNo.confidence,enq_job_no:jobNo.confidence,currency:currency.confidence,amount:amounts.totalConfidence,vat:vatConfidence,description:description.confidence}};
}
window.SMSParser={parseInvoiceText};
})();