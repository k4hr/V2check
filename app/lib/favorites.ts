import { get, set } from './storage';
const KEY='favorites';
export const getFavs=():string[]=> get<string[]>(KEY,[])!;
export const toggleFav=(id:string)=>{ const a=getFavs(); const i=a.indexOf(id); if(i>=0){a.splice(i,1)}else{a.push(id)}; set(KEY,a); return a; }
export const isFav=(id:string)=> getFavs().includes(id);