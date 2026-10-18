/* Validation helpers; no network, DB or secrets. */
export const SITE_ORIGIN='https://lovesky514514-cmd.github.io';
export const MAX_TESTERS=999;
export function testerLabel(seq,suffix){
 if(!Number.isSafeInteger(seq)||seq<1||seq>MAX_TESTERS||!/^[A-Z]{2}$/.test(suffix))throw Error('Invalid tester identifier');
 return String(seq).padStart(3,'0')+suffix;
}
export function suffixLetters(randomBytes){
 if(!(randomBytes instanceof Uint8Array))throw Error('Expected random bytes');
 let letters='';for(const value of randomBytes){if(value<234)letters+=String.fromCharCode(65+(value%26));if(letters.length===2)return letters;}
 throw Error('Insufficient entropy');
}
export function normalizeTesterNumber(value){
 const m=/^([0-9]{3})([a-zA-Z]{2})$/.exec(String(value||'').trim());if(!m)return null;
 const n=Number(m[1]);return n>=1&&n<=999?testerLabel(n,m[2].toUpperCase()):null;
}
export function validateRelease(data){
 if(!data||typeof data!=='object')throw Error('Invalid release');
 const version=String(data.version||'').trim(),url=String(data.url||'').trim();
 const sha256=String(data.sha256||'').trim().toLowerCase();
 const notes=String(data.notes||'').trim(),extractionCode=String(data.extractionCode||'').trim();
 if(version.length>80||notes.length>1000||extractionCode.length>128)throw Error('Release field too long');
 if(url){if(url.length>2048)throw Error('URL too long');let p;try{p=new URL(url)}catch{throw Error('Invalid URL')}
 if(p.protocol!=='https:'||p.username||p.password||p.hash)throw Error('Download URL must be HTTPS without credentials or fragment');}
 if(sha256&&!/^[a-f0-9]{64}$/.test(sha256))throw Error('Invalid SHA-256');
 const published=data.published===true;if(published&&(!version||!url||!sha256))throw Error('Cannot publish without version, URL and SHA-256');
 return{version,url,sha256,notes,extractionCode,published,applicationsOpen:data.applicationsOpen===true,claimsOpen:data.claimsOpen===true};
}
export function validEmail(email){return typeof email==='string'&&email.length<=254&&/^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email.trim());}
export function cleanFeedback(data){
 const kind=String(data.kind||''),severity=String(data.severity||''),title=String(data.title||'').trim();
 const details=String(data.details||'').trim(),errorCode=String(data.errorCode||'').trim(),version=String(data.version||'').trim();
 if(!['execution','science','ui','suggestion'].includes(kind)||!['blocked','partial','minor'].includes(severity)||!title||title.length>120||!details||details.length>4000||errorCode.length>80||version.length>80)throw Error('Invalid feedback');
 return{kind,severity,title,details,errorCode,version};
}