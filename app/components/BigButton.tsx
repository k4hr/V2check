export default function BigButton({href,emoji,label}:{href:string,emoji:string,label:string}){
  return (
    <a href={href} style={{display:'block', textDecoration:'none', color:'#e7e7e7'}}>
      <div style={{border:'1px solid #2b2f39', borderRadius:12, padding:18, background:'#111319', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontSize:18}}>{emoji} <b>{label}</b></div>
        <div style={{opacity:.6}}>›</div>
      </div>
    </a>
  );
}