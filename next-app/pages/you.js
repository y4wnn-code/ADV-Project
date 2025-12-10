import {useEffect, useState} from 'react';

export default function You(){
  const [posts,setPosts] = useState([]);
  const [token] = useState(typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(()=>{ fetchMine(); }, []);

  async function fetchMine(){
    if (!token) return setPosts([]);
    const r = await fetch('/api/posts?mine=1', { headers: { 'Authorization': 'Bearer '+token } });
    if (!r.ok) return setPosts([]);
    const data = await r.json();
    setPosts(data);
  }

  return (
    <div style={{maxWidth:900,margin:'20px auto',padding:16}}>
      <h1>Your Posts</h1>
      <div>
        {posts.length === 0 ? <div>No posts yet</div> : posts.map(p=> (
          <div key={p.id} style={{border:'1px solid #ddd',padding:10,borderRadius:8,marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <img src={p.pfp || '/default-pfp.png'} width={36} height={36} style={{borderRadius:18}} />
              <div><strong>{p.username}</strong> • <span style={{fontWeight:700}}>{p.title}</span> <span style={{color:'#666'}}>({p.year})</span></div>
            </div>
            <div style={{marginTop:8}}>{p.content}</div>
            <div style={{marginTop:8,color:'#666'}}>{p.likes} ↑ · {p.dislikes} ↓ · {p.comments.length} comments</div>
          </div>
        ))}
      </div>
    </div>
  );
}
