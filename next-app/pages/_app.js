import '../styles/globals.css'

function Nav(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [count, setCount] = require('react').useState(0);

  require('react').useEffect(()=>{
    if (!token) return;
    async function load(){
      try{
        const r = await fetch('/api/notifications', { headers: { 'Authorization': 'Bearer '+token } });
        if (!r.ok) return;
        const d = await r.json();
        const total = (d.comments?d.comments.length:0) + (d.reactions?d.reactions.length:0);
        setCount(total);
      }catch(e){ }
    }
    load();
  }, [token]);
  return (
    <div style={{background:'#fff',padding:10,display:'flex',alignItems:'center',gap:12,justifyContent:'space-between',borderBottom:'1px solid #eee'}}>
      <div style={{fontWeight:700}}>bloggwatch.</div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <a href="/" style={{textDecoration:'none'}}>Home</a>
        <a href="/notifications" style={{textDecoration:'none'}}>Notifications{count>0?` (${count})`:''}</a>
        <a href="/you" style={{textDecoration:'none'}}>You</a>
      </div>
      <div>
        { token ? <button onClick={()=>{ localStorage.removeItem('token'); location.href='/login'; }} style={{padding:'6px 10px',borderRadius:6}}>Logout</button> : <>
          <a href="/login" style={{marginRight:8}}>Login</a>
          <a href="/register">Register</a>
        </> }
      </div>
    </div>
  );
}

export default function MyApp({ Component, pageProps }){
  return (
    <>
      <Nav />
      <Component {...pageProps} />
    </>
  );
}
