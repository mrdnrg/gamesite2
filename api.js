const _B="https://x8ki-letl-twmt.n7.xano.io/api:7fuLzq6k";
// Shared secret — add SCORE_SECRET env var in Xano with this same value
const _K=[75,112,55,120,78,109,81,118,90,50,114,76,57,119,66,106,52,84].map(c=>String.fromCharCode(c)).join('');

async function _hmac(key,msg){
  const e=new TextEncoder();
  const k=await crypto.subtle.importKey('raw',e.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const b=await crypto.subtle.sign('HMAC',k,e.encode(msg));
  return Array.from(new Uint8Array(b)).map(v=>v.toString(16).padStart(2,'0')).join('');
}

export async function fetchAllParticipantsFromXano(){
  try{
    const r=await fetch(`${_B}/gamerecords_get`);
    return await r.json();
  }catch(e){
    console.error("Error fetching data from Xano:",e);
    return[];
  }
}

export async function startSession(wallet){
  try{
    const r=await fetch(`${_B}/start`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({wallet:wallet||null})
    });
    if(!r.ok)throw new Error("start failed");
    const d=await r.json();
    return{sessionId:d.id,token:d.token,createdAt:d.created_at,issuedAt:d.issued_at,used:d.used,wallet:d.wallet,ip:d.ip};
  }catch(e){
    console.error("startSession error:",e);
    return null;
  }
}

export async function submitScore(session,score,wallet,events=[]){
  try{
    const token=session?.token;
    const eventsStr=events.join(',');
    const sig=await _hmac(_K,`${token}|${score}|${eventsStr}`);
    const r=await fetch(`${_B}/gamerecords_post`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({token,wallet:wallet||null,score,events,sig})
    });
    let data;
    try{data=await r.json();}catch{data=await r.text();}
    return r.ok?data:(console.error("submitScore failed:",data),null);
  }catch(e){
    console.error("submitScore error:",e);
    return null;
  }
}
