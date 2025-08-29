'use client';
export default function TopBar({showBack=false}:{showBack?:boolean}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #1b1f27',position:'sticky',top:0,background:'#0f1114',zIndex:10}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {showBack && <button onClick={()=>history.back()} aria-label="Назад" style={{background:'#0b6b3a',border:'none',color:'#fff',borderRadius:10,padding:'6px 10px'}}>← Назад</button>}
        <a href="/" style={{textDecoration:'none',color:'#e7e7e7',fontWeight:800}}>Juristum ⚖️</a>
      </div>
    </div>
  );
}
