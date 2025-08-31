import crypto from 'crypto';

export function verifyInitData(initData: string, botToken: string){
  if(!initData || !botToken) return { ok:false, reason:'missing' };
  const params = new URLSearchParams(initData);
  const data: Record<string, any> = {};
  let user: any, auth_date: any, hash: string | null = null;
  params.forEach((v,k)=>{
    if(k==='user'){ try{ user=JSON.parse(v);}catch{} }
    else if(k==='auth_date'){ auth_date=Number(v); }
    else if(k==='hash'){ hash=v; }
    else { data[k]=v; }
  });
  if(!hash) return { ok:false, reason:'nohash' };
  const secret = crypto.createHmac('sha256','WebAppData').update(botToken).digest();
  const pieces:string[]=[];
  if(user) pieces.push(`user=${JSON.stringify(user)}`);
  if(auth_date) pieces.push(`auth_date=${auth_date}`);
  Object.keys(data).sort().forEach(k=>pieces.push(`${k}=${data[k]}`));
  const check = pieces.sort().join('\n');
  const h = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if(h!==hash) return { ok:false, reason:'bad-sign' };
  return { ok:true, payload:{ user, auth_date } };
}
