'use client';
import { useEffect, useState } from 'react';
import { isPro } from '../lib/subscription';
export default function TopBar(){
  const [pro,setPro]=useState(false);
  useEffect(()=>{ setPro(isPro()); },[]);
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #2b2f39',position:'sticky',top:0,background:'#0b0c0f',zIndex:10}}>
      <a href="/" style={{textDecoration:'none',color:'#e7e7e7',fontWeight:700}}>PravoGo</a>
      <a href="/pro" style={{textDecoration:'none',color:'#e7e7e7',fontWeight:600}}>{pro ? '⭐ Pro до конца срока' : '⭐ Оформить Pro'}</a>
    </div>
  );
}