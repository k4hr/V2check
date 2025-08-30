import { get, set } from './storage';
export type Plan = 'WEEK'|'MONTH'|'HALF'|'YEAR';
type Sub = { pro:boolean; expiresAt:number };
const KEY='pro-subscription';
export const getSub=():Sub=> get<Sub>(KEY,{pro:false,expiresAt:0})!;
export const isPro=()=> Date.now() < getSub().expiresAt;
export const setProUntil=(until:number)=>{ set(KEY,{pro:true,expiresAt:until}); }
export const setProForDays=(days:number)=>{ const until = Date.now() + days*24*60*60*1000; setProUntil(until); }
export const applyPlan=(p:Plan)=>{ if(p==='WEEK') setProForDays(7); if(p==='MONTH') setProForDays(30); if(p==='HALF') setProForDays(182); if(p==='YEAR') setProForDays(365); }