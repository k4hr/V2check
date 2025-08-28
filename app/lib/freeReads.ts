import { get, set, todayKey } from './storage';
type State = { date:string; count:number; opened:string[] };
const KEY = 'free-reads';
const LIMIT = 2;
const init=():State=>({date:todayKey(), count:0, opened:[]});
export const getFreeReads=():State=>{ const s = get<State>(KEY, init())!; if (s.date !== todayKey()) { const n=init(); set(KEY,n); return n; } return s; }
export const canOpen = (id:string, pro:boolean)=>{ if (pro) return true; const s = getFreeReads(); if (s.opened.includes(id)) return true; return s.count < LIMIT; }
export const registerOpen = (id:string, pro:boolean)=>{ if (pro) return; const s = getFreeReads(); if (!s.opened.includes(id)){ s.opened.push(id); s.count = Math.min(s.count+1, 2); set(KEY,s); } }
export const remaining = (pro:boolean)=>{ if (pro) return Infinity; const s=getFreeReads(); return Math.max(0, 2 - s.count); }