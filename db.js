(function(){
const DB_NAME='sms-expense-local-v1',VERSION=1;let dbp;
function open(){if(dbp)return dbp;dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});if(!db.objectStoreNames.contains('vouchers')){const s=db.createObjectStore('vouchers',{keyPath:'id'});s.createIndex('year','year');s.createIndex('ym',['year','month'],{unique:true})}if(!db.objectStoreNames.contains('expenses')){const s=db.createObjectStore('expenses',{keyPath:'id'});s.createIndex('voucherId','voucherId')}if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbp}
async function tx(store,mode='readonly'){const db=await open();return db.transaction(store,mode).objectStore(store)}
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function get(store,key){return req((await tx(store)).get(key))}
async function put(store,val){return req((await tx(store,'readwrite')).put(val))}
async function del(store,key){return req((await tx(store,'readwrite')).delete(key))}
async function all(store){return req((await tx(store)).getAll())}
async function byIndex(store,index,key){return req((await tx(store)).index(index).getAll(key))}
async function clearAll(){const db=await open();await Promise.all(['meta','vouchers','expenses','files'].map(s=>new Promise((res,rej)=>{const r=db.transaction(s,'readwrite').objectStore(s).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})))}
window.SMSDB={open,get,put,del,all,byIndex,clearAll,DB_NAME};
})();
