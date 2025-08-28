export const get = <T=any>(k:string, def?:T):T|undefined => {
  if (typeof window==='undefined') return def;
  try { const v=localStorage.getItem(k); return v? JSON.parse(v) : def; } catch { return def; }
}
export const set = (k:string, v:any)=>{ if (typeof window==='undefined') return; localStorage.setItem(k, JSON.stringify(v)); }
export const todayKey = ()=>{
  const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}