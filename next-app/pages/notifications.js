import {useEffect, useState} from 'react';

export default function Notifications(){
  const [data,setData] = useState({comments:[], reactions:[]});
  const [token] = useState(typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(()=>{ fetchNotifs(); }, []);

  async function fetchNotifs(){
    if (!token) return;
    const r = await fetch('/api/notifications', { headers: { 'Authorization': 'Bearer '+token } });
    if (!r.ok) return;
    const d = await r.json();
    setData(d);
  }

  return (
    <div style={{maxWidth:900,margin:'20px auto',padding:16}}>
      <h1>Notifications</h1>
      <section>
        <h3>Comments on your posts</h3>
        {data.comments.length === 0 ? <div>No new comments</div> : data.comments.map(c=> (
          <div key={c.id} style={{border:'1px solid #eee',padding:10,borderRadius:8,marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700}}>{c.from_user} commented on "{c.title}"</div>
            <div style={{marginTop:6}}>{c.content}</div>
            <div style={{fontSize:12,color:'#666',marginTop:6}}>{new Date(c.created_at).toLocaleString()}</div>
          </div>
        ))}
      </section>
      <section style={{marginTop:18}}>
        <h3>Reactions on your posts</h3>
        {data.reactions.length === 0 ? <div>No recent reactions</div> : data.reactions.map(r=> (
          <div key={r.id} style={{border:'1px solid #eee',padding:10,borderRadius:8,marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700}}>{r.from_user} {r.type === 'like' ? 'liked' : 'disliked'} "{r.title}"</div>
            <div style={{fontSize:12,color:'#666',marginTop:6}}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
